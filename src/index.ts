/**
 * Pushguard: OpenCode Plugin
 * 
 * Intercepts git push commands and runs desloppify quality checks.
 * Blocks push if quality score is below threshold (configurable).
 */

import { execSync } from "child_process";
import { isGitPush } from "./utils.js";
import { runDesloppify, getDesloppifyStatus, getNextIssue, getPlan } from "./desloppify.js";

// Environment configuration
const DESLOPPIFY_SKIP = process.env.DESLOPPIFY_SKIP === "1";
const DESLOPPIFY_BLOCK = process.env.DESLOPPIFY_BLOCK === "1";
const DESLOPPIFY_THRESHOLD = parseFloat(process.env.DESLOPPIFY_THRESHOLD || "95");

interface ToolArgs {
  command?: string;
  [key: string]: unknown;
}

interface HookResult {
  proceed: boolean;
  error?: string;
  message?: string;
}

interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Format quality report for display
 */
function formatReport(score: number, threshold: number, findings: number): string {
  const status = score >= threshold ? "✅ PASS" : "⚠️ WARN";
  const border = "━".repeat(60);
  
  return `
${border}
  DESLOPPIFY QUALITY REPORT
${border}
  Strict Score:    ${score.toFixed(1)}
  Threshold:       ${threshold}
  Open Findings:   ${findings}
  Status:          ${status}
${border}
`.trim();
}

// Plugin export
export default {
  name: "pushguard",
  
  hooks: {
    /**
     * Intercept bash tool calls to detect git push
     */
    beforeToolCall: async (toolName: string, args: ToolArgs): Promise<HookResult> => {
      // Only intercept bash tool
      if (toolName !== "bash") {
        return { proceed: true };
      }
      
      const command = args.command || "";
      
      // Check if this is a git push command
      if (!isGitPush(command)) {
        return { proceed: true };
      }
      
      // Skip hook if requested
      if (DESLOPPIFY_SKIP) {
        return { 
          proceed: true, 
          message: "ℹ️  Pushguard skipped (DESLOPPIFY_SKIP=1)"
        };
      }
      
      // Check if desloppify is available
      try {
        execSync("which desloppify", { stdio: "ignore" });
      } catch {
        return { 
          proceed: true,
          message: "⚠️  desloppify not found - skipping quality check. Install with: pip install 'desloppify[full]'"
        };
      }
      
      // Run desloppify scan
      const result = runDesloppify();
      
      if (!result) {
        return { 
          proceed: true,
          message: "⚠️  Could not run desloppify scan - allowing push"
        };
      }
      
      // Format and display report
      const report = formatReport(result.score, DESLOPPIFY_THRESHOLD, result.findings);
      
      // Check score against threshold
      if (result.score < DESLOPPIFY_THRESHOLD) {
        if (DESLOPPIFY_BLOCK) {
          return {
            proceed: false,
            error: `${report}

❌ PUSH BLOCKED: Score ${result.score.toFixed(1)} is below threshold ${DESLOPPIFY_THRESHOLD}

To fix issues, run:
  desloppify next        # Show highest priority issue
  desloppify plan        # View prioritized plan

To bypass (not recommended):
  DESLOPPIFY_SKIP=1 git push`
          };
        } else {
          return {
            proceed: true,
            message: `${report}

⚠️  WARNING: Score ${result.score.toFixed(1)} is below target ${DESLOPPIFY_THRESHOLD}
   Consider running: desloppify next
   To block pushes below threshold: export DESLOPPIFY_BLOCK=1`
          };
        }
      }
      
      return {
        proceed: true,
        message: `${report}\n\n✅ Code quality check passed`
      };
    }
  },
  
  tools: [
    {
      name: "desloppify_scan",
      description: "Run desloppify quality scan on the codebase. Returns score, findings count, and status.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Path to scan (default: current directory)",
            default: "."
          }
        }
      },
      execute: async (args: Record<string, unknown>) => {
        const path = (args.path as string) || ".";
        const result = runDesloppify(path);
        if (!result) {
          return { error: "Failed to run desloppify scan. Is desloppify installed?" };
        }
        return {
          score: result.score,
          findings: result.findings,
          threshold: DESLOPPIFY_THRESHOLD,
          passed: result.score >= DESLOPPIFY_THRESHOLD
        };
      }
    },
    {
      name: "desloppify_next",
      description: "Show the highest priority quality issue to fix next.",
      parameters: {
        type: "object",
        properties: {}
      },
      execute: async () => {
        return getNextIssue();
      }
    },
    {
      name: "desloppify_plan",
      description: "View the prioritized fix plan for all quality issues.",
      parameters: {
        type: "object",
        properties: {}
      },
      execute: async () => {
        return getPlan();
      }
    },
    {
      name: "desloppify_status",
      description: "Get current desloppify status including score and configuration.",
      parameters: {
        type: "object",
        properties: {}
      },
      execute: async () => {
        return getDesloppifyStatus();
      }
    },
    {
      name: "desloppify_help",
      description: "Get help and usage instructions for pushguard.",
      parameters: {
        type: "object",
        properties: {}
      },
      execute: async () => {
        return {
          name: "pushguard",
          purpose: "Runs desloppify quality checks before git push",
          environmentVariables: {
            DESLOPPIFY_SKIP: { default: "0", description: "Set to '1' to skip the hook entirely" },
            DESLOPPIFY_BLOCK: { default: "0", description: "Set to '1' to block pushes below threshold" },
            DESLOPPIFY_THRESHOLD: { default: "95", description: "Minimum strict score (0-100)" }
          },
          tools: [
            "desloppify_scan - Run quality scan",
            "desloppify_next - Show highest priority issue",
            "desloppify_plan - View prioritized fix plan",
            "desloppify_status - Get current status",
            "desloppify_help - This help message"
          ],
          usage: {
            normalPush: "git push (warns if score < threshold)",
            blockPush: "DESLOPPIFY_BLOCK=1 git push",
            skipCheck: "DESLOPPIFY_SKIP=1 git push"
          }
        };
      }
    }
  ] as Tool[]
};
