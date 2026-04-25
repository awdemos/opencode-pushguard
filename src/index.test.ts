import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockExecFileSync = vi.fn();
const mockRunDesloppify = vi.fn();
const mockGetDesloppifyStatus = vi.fn();
const mockGetNextIssue = vi.fn();
const mockGetPlan = vi.fn();

vi.mock("child_process", () => ({
  execFileSync: (...args: unknown[]) => mockExecFileSync(...args),
}));

vi.mock("./desloppify.js", () => ({
  runDesloppify: (...args: unknown[]) => mockRunDesloppify(...args),
  getDesloppifyStatus: () => mockGetDesloppifyStatus(),
  getNextIssue: () => mockGetNextIssue(),
  getPlan: () => mockGetPlan(),
}));

// Import the plugin after mocks are established
const loadPlugin = async () => {
  const mod = await import("./index.js");
  return mod.default;
};

describe("plugin hooks", () => {
  let plugin: Awaited<ReturnType<typeof loadPlugin>>;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv("DESLOPPIFY_SKIP", "");
    vi.stubEnv("DESLOPPIFY_BLOCK", "");
    vi.stubEnv("DESLOPPIFY_THRESHOLD", "");
    mockExecFileSync.mockReset();
    mockRunDesloppify.mockReset();
    plugin = await loadPlugin();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("allows non-bash tools to proceed", async () => {
    const result = await plugin.hooks.beforeToolCall("read_file", { path: "/tmp" });
    expect(result).toEqual({ proceed: true });
  });

  it("allows bash commands that are not git push", async () => {
    const result = await plugin.hooks.beforeToolCall("bash", { command: "ls -la" });
    expect(result).toEqual({ proceed: true });
  });

  it("skips check when DESLOPPIFY_SKIP=1", async () => {
    vi.resetModules();
    vi.stubEnv("DESLOPPIFY_SKIP", "1");
    plugin = await loadPlugin();
    const result = await plugin.hooks.beforeToolCall("bash", { command: "git push" });
    expect(result.proceed).toBe(true);
    expect(result.message).toContain("skipped");
  });

  it("warns and allows when desloppify is not installed", async () => {
    mockExecFileSync.mockImplementation(() => {
      throw new Error("not found");
    });
    plugin = await loadPlugin();
    const result = await plugin.hooks.beforeToolCall("bash", { command: "git push" });
    expect(result.proceed).toBe(true);
    expect(result.message).toContain("not found");
  });

  it("allows push when score is above threshold", async () => {
    mockExecFileSync.mockReturnValue("");
    mockRunDesloppify.mockReturnValue({ score: 96, findings: 0 });
    plugin = await loadPlugin();
    const result = await plugin.hooks.beforeToolCall("bash", { command: "git push" });
    expect(result.proceed).toBe(true);
    expect(result.message).toContain("passed");
  });

  it("warns when score is below threshold without block", async () => {
    mockExecFileSync.mockReturnValue("");
    mockRunDesloppify.mockReturnValue({ score: 80, findings: 5 });
    plugin = await loadPlugin();
    const result = await plugin.hooks.beforeToolCall("bash", { command: "git push" });
    expect(result.proceed).toBe(true);
    expect(result.message).toContain("WARNING");
  });

  it("blocks push when score is below threshold with DESLOPPIFY_BLOCK=1", async () => {
    vi.resetModules();
    vi.stubEnv("DESLOPPIFY_BLOCK", "1");
    mockExecFileSync.mockReturnValue("");
    mockRunDesloppify.mockReturnValue({ score: 80, findings: 5 });
    plugin = await loadPlugin();
    const result = await plugin.hooks.beforeToolCall("bash", { command: "git push" });
    expect(result.proceed).toBe(false);
    expect(result.error).toContain("BLOCKED");
  });

  it("handles invalid threshold gracefully", async () => {
    vi.resetModules();
    vi.stubEnv("DESLOPPIFY_THRESHOLD", "abc");
    vi.stubEnv("DESLOPPIFY_BLOCK", "1");
    mockExecFileSync.mockReturnValue("");
    mockRunDesloppify.mockReturnValue({ score: 94, findings: 2 });
    plugin = await loadPlugin();
    const result = await plugin.hooks.beforeToolCall("bash", { command: "git push" });
    // NaN threshold would have caused score < NaN to be false, but now it falls back to 95
    expect(result.proceed).toBe(false);
    expect(result.error).toContain("BLOCKED");
  });

  it("allows push when desloppify scan fails entirely", async () => {
    mockExecFileSync.mockReturnValue("");
    mockRunDesloppify.mockReturnValue(null);
    plugin = await loadPlugin();
    const result = await plugin.hooks.beforeToolCall("bash", { command: "git push" });
    expect(result.proceed).toBe(true);
    expect(result.message).toContain("Could not run");
  });
});

describe("plugin tools", () => {
  let plugin: Awaited<ReturnType<typeof loadPlugin>>;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv("DESLOPPIFY_THRESHOLD", "");
    mockExecFileSync.mockReset();
    mockRunDesloppify.mockReset();
    mockGetDesloppifyStatus.mockReset();
    mockGetNextIssue.mockReset();
    mockGetPlan.mockReset();
    plugin = await loadPlugin();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("desloppify_scan returns scan results", async () => {
    mockRunDesloppify.mockReturnValue({ score: 88, findings: 4 });
    const tool = plugin.tools.find((t: { name: string }) => t.name === "desloppify_scan");
    expect(tool).toBeDefined();
    const result = await tool!.execute({ path: "/project" });
    expect(result).toMatchObject({ score: 88, findings: 4, passed: false });
  });

  it("desloppify_scan returns error on failure", async () => {
    mockRunDesloppify.mockReturnValue(null);
    const tool = plugin.tools.find((t: { name: string }) => t.name === "desloppify_scan");
    const result = await tool!.execute({});
    expect(result).toHaveProperty("error");
  });

  it("desloppify_next delegates to getNextIssue", async () => {
    mockGetNextIssue.mockReturnValue("Fix typo");
    const tool = plugin.tools.find((t: { name: string }) => t.name === "desloppify_next");
    const result = await tool!.execute({});
    expect(result).toBe("Fix typo");
  });

  it("desloppify_plan delegates to getPlan", async () => {
    mockGetPlan.mockReturnValue("1. Fix typo\n");
    const tool = plugin.tools.find((t: { name: string }) => t.name === "desloppify_plan");
    const result = await tool!.execute({});
    expect(result).toBe("1. Fix typo\n");
  });

  it("desloppify_status delegates to getDesloppifyStatus", async () => {
    mockGetDesloppifyStatus.mockReturnValue({ score: 99 });
    const tool = plugin.tools.find((t: { name: string }) => t.name === "desloppify_status");
    const result = await tool!.execute({});
    expect(result).toMatchObject({ score: 99 });
  });

  it("desloppify_help returns usage info", async () => {
    const tool = plugin.tools.find((t: { name: string }) => t.name === "desloppify_help");
    const result = await tool!.execute({});
    expect(result).toMatchObject({ name: "opencode-pushguard" });
    expect(result).toHaveProperty("tools");
  });
});
