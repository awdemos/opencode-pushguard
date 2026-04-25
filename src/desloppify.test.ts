import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runDesloppify, getDesloppifyStatus, getNextIssue, getPlan } from "./desloppify";

const mockExecFileSync = vi.fn();
vi.mock("child_process", () => ({
  execFileSync: (...args: unknown[]) => mockExecFileSync(...args),
}));

describe("runDesloppify", () => {
  beforeEach(() => {
    mockExecFileSync.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns score and findings on success", () => {
    mockExecFileSync
      .mockReturnValueOnce("") // scan output
      .mockReturnValueOnce(
        "Scores: strict 87.5/100\nopen (in-scope): 3\n"
      ); // status output

    const result = runDesloppify(".");
    expect(result).toEqual({
      score: 87.5,
      findings: 3,
      raw: "Scores: strict 87.5/100\nopen (in-scope): 3\n",
    });

    expect(mockExecFileSync).toHaveBeenNthCalledWith(
      1,
      "desloppify",
      ["scan", "--path", "."],
      expect.objectContaining({ encoding: "utf-8" })
    );
  });

  it("passes custom path safely", () => {
    mockExecFileSync
      .mockReturnValueOnce("")
      .mockReturnValueOnce("strict 90.0/100\nopen (in-scope): 0\n");

    runDesloppify("/some/path");
    expect(mockExecFileSync).toHaveBeenNthCalledWith(
      1,
      "desloppify",
      ["scan", "--path", "/some/path"],
      expect.anything()
    );
  });

  it("extracts score from error output when scan fails", () => {
    const error = Object.assign(new Error("scan failed"), {
      stdout: "strict 45.0/100\nopen (in-scope): 12\n",
      stderr: "",
    });
    mockExecFileSync.mockImplementation((cmd: string, args: string[]) => {
      if (args[0] === "scan") throw error;
      return "";
    });

    const result = runDesloppify(".");
    expect(result).toEqual({
      score: 45,
      findings: 12,
      raw: "strict 45.0/100\nopen (in-scope): 12\n",
    });
  });

  it("returns null when no score or findings can be parsed", () => {
    const error = Object.assign(new Error("command not found"), {
      stdout: "",
      stderr: "desloppify: command not found",
      message: "desloppify: command not found",
    });
    mockExecFileSync.mockImplementation(() => {
      throw error;
    });

    const result = runDesloppify(".");
    expect(result).toBeNull();
  });
});

describe("getDesloppifyStatus", () => {
  beforeEach(() => {
    mockExecFileSync.mockReset();
  });

  it("returns parsed status", () => {
    mockExecFileSync.mockReturnValue(
      "Scores: strict 92.0/100\nopen (in-scope): 1\n"
    );

    const result = getDesloppifyStatus();
    expect(result).toMatchObject({
      score: 92,
      openFindings: 1,
    });
  });

  it("returns error object on failure", () => {
    mockExecFileSync.mockImplementation(() => {
      throw new Error("not found");
    });

    const result = getDesloppifyStatus();
    expect(result).toHaveProperty("error");
    expect(result).toHaveProperty("message");
  });
});

describe("getNextIssue", () => {
  beforeEach(() => {
    mockExecFileSync.mockReset();
  });

  it("returns next issue output", () => {
    mockExecFileSync.mockReturnValue("Fix missing tests in utils.ts");
    expect(getNextIssue()).toBe("Fix missing tests in utils.ts");
  });

  it("returns error message on failure", () => {
    mockExecFileSync.mockImplementation(() => {
      const err = new Error("fail") as Error & { stdout?: string; stderr?: string };
      err.stdout = "";
      err.stderr = "";
      throw err;
    });
    expect(getNextIssue()).toBe("fail");
  });
});

describe("getPlan", () => {
  beforeEach(() => {
    mockExecFileSync.mockReset();
  });

  it("returns plan output", () => {
    mockExecFileSync.mockReturnValue("1. Add tests\n2. Refactor\n");
    expect(getPlan()).toBe("1. Add tests\n2. Refactor\n");
  });

  it("returns error message on failure", () => {
    mockExecFileSync.mockImplementation(() => {
      const err = new Error("fail") as Error & { stdout?: string; stderr?: string };
      err.stdout = "";
      err.stderr = "";
      throw err;
    });
    expect(getPlan()).toBe("fail");
  });
});
