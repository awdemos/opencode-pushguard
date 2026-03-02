/**
 * Utility functions for git command detection
 */
/**
 * Check if a command is a git push command
 * Handles various forms:
 * - git push
 * - git push origin main
 * - git push -f
 * - git push --force
 * - /usr/bin/git push
 */
export declare function isGitPush(command: string): boolean;
/**
 * Extract remote and branch from git push command
 */
export declare function parseGitPushCommand(command: string): {
    remote?: string;
    branch?: string;
} | null;
//# sourceMappingURL=utils.d.ts.map