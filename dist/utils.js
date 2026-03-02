"use strict";
/**
 * Utility functions for git command detection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isGitPush = isGitPush;
exports.parseGitPushCommand = parseGitPushCommand;
/**
 * Check if a command is a git push command
 * Handles various forms:
 * - git push
 * - git push origin main
 * - git push -f
 * - git push --force
 * - /usr/bin/git push
 */
function isGitPush(command) {
    if (!command)
        return false;
    // Normalize command
    const normalized = command.trim().toLowerCase();
    // Skip if explicitly skipping
    if (normalized.includes("desloppify_skip"))
        return false;
    // Pattern: git push (with optional path prefix and arguments)
    const gitPushPattern = /(^|\s|\/)(git|git\.exe)\s+push(\s|$|--)/i;
    return gitPushPattern.test(normalized);
}
/**
 * Extract remote and branch from git push command
 */
function parseGitPushCommand(command) {
    if (!isGitPush(command))
        return null;
    const parts = command.trim().split(/\s+/);
    const pushIndex = parts.findIndex(p => p === "push");
    if (pushIndex === -1)
        return {};
    const args = parts.slice(pushIndex + 1);
    const nonFlagArgs = args.filter(a => !a.startsWith("-"));
    return {
        remote: nonFlagArgs[0],
        branch: nonFlagArgs[1]
    };
}
//# sourceMappingURL=utils.js.map