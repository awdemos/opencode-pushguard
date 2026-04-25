import { describe, it, expect } from "vitest";
import { isGitPush, parseGitPushCommand } from "./utils";

describe("isGitPush", () => {
  it("matches basic git push", () => {
    expect(isGitPush("git push")).toBe(true);
  });

  it("matches git push with remote and branch", () => {
    expect(isGitPush("git push origin main")).toBe(true);
  });

  it("matches git push with flags", () => {
    expect(isGitPush("git push -f")).toBe(true);
    expect(isGitPush("git push --force")).toBe(true);
    expect(isGitPush("git push -u origin main")).toBe(true);
  });

  it("matches absolute path to git binary", () => {
    expect(isGitPush("/usr/bin/git push")).toBe(true);
  });

  it("matches windows git.exe", () => {
    expect(isGitPush("git.exe push origin main")).toBe(true);
  });

  it("matches uppercase commands", () => {
    expect(isGitPush("GIT PUSH ORIGIN MAIN")).toBe(true);
  });

  it("matches multiple spaces", () => {
    expect(isGitPush("git  push  origin")).toBe(true);
  });

  it("does not match non-push git commands", () => {
    expect(isGitPush("git status")).toBe(false);
    expect(isGitPush("git commit -m 'wip'")).toBe(false);
    expect(isGitPush("git pull")).toBe(false);
  });

  it("does not match commands containing 'git push' as substring", () => {
    expect(isGitPush('echo "git push"')).toBe(false);
    expect(isGitPush("legit push")).toBe(false);
    expect(isGitPush("mygit push")).toBe(false);
  });

  it("does not match git push without space before push", () => {
    expect(isGitPush("git push--force")).toBe(false);
  });

  it("returns false for empty or non-string input", () => {
    expect(isGitPush("")).toBe(false);
    expect(isGitPush(undefined as unknown as string)).toBe(false);
  });
});

describe("parseGitPushCommand", () => {
  it("extracts remote and branch", () => {
    expect(parseGitPushCommand("git push origin main")).toEqual({
      remote: "origin",
      branch: "main",
    });
  });

  it("handles uppercase commands", () => {
    expect(parseGitPushCommand("GIT PUSH ORIGIN MAIN")).toEqual({
      remote: "ORIGIN",
      branch: "MAIN",
    });
  });

  it("ignores flags before remote/branch", () => {
    expect(parseGitPushCommand("git push -u origin main")).toEqual({
      remote: "origin",
      branch: "main",
    });
  });

  it("returns only remote when branch is omitted", () => {
    expect(parseGitPushCommand("git push origin")).toEqual({
      remote: "origin",
      branch: undefined,
    });
  });

  it("returns empty object for bare git push", () => {
    expect(parseGitPushCommand("git push")).toEqual({});
  });

  it("returns null for non-git-push commands", () => {
    expect(parseGitPushCommand("git status")).toBeNull();
  });

  it("respects -- separator for literal refs", () => {
    expect(parseGitPushCommand("git push origin -- -f")).toEqual({
      remote: "origin",
      branch: "-f",
    });
  });

  it("handles refs after --tags flag", () => {
    expect(parseGitPushCommand("git push --tags origin")).toEqual({
      remote: "origin",
      branch: undefined,
    });
  });
});
