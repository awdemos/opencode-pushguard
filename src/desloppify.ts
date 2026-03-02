/**
 * Desloppify CLI wrapper
 */

import { execSync } from "child_process";

interface DesloppifyResult {
  score: number;
  findings: number;
  raw?: string;
}

/**
 * Run desloppify scan and parse results
 */
export function runDesloppify(path: string = "."): DesloppifyResult | null {
  try {
    execSync(`desloppify scan --path "${path}" 2>&1`, {
      encoding: "utf-8",
      timeout: 120000
    });
    
    const statusOutput = execSync("desloppify status 2>&1", {
      encoding: "utf-8",
      timeout: 30000
    });
    
    const scoreMatch = statusOutput.match(/strict\s+(\d+\.?\d*)\/100/i);
    const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
    
    const findingsMatch = statusOutput.match(/open\s+\(in-scope\):\s+(\d+)/i);
    const findings = findingsMatch ? parseInt(findingsMatch[1], 10) : 0;
    
    return { score, findings, raw: statusOutput };
  } catch (error) {
    const output = (error as { stdout?: string; stderr?: string; message?: string }).stdout || 
                   (error as { stdout?: string; stderr?: string; message?: string }).stderr || 
                   (error as { message?: string }).message || "";
    
    const scoreMatch = output.match(/strict\s+(\d+\.?\d*)\/100/i);
    const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
    
    const findingsMatch = output.match(/open\s+\(in-scope\):\s+(\d+)/i);
    const findings = findingsMatch ? parseInt(findingsMatch[1], 10) : 0;
    
    if (score > 0 || findings > 0) {
      return { score, findings, raw: output };
    }
    
    return null;
  }
}

/**
 * Get desloppify status
 */
export function getDesloppifyStatus(): Record<string, unknown> {
  try {
    const output = execSync("desloppify status 2>&1", {
      encoding: "utf-8",
      timeout: 30000
    });
    
    // Parse key information
    const scoreMatch = output.match(/strict\s+(\d+\.?\d*)\/100/i);
    const findingsMatch = output.match(/open\s+\(in-scope\):\s+(\d+)/i);
    
    return {
      raw: output,
      score: scoreMatch ? parseFloat(scoreMatch[1]) : null,
      openFindings: findingsMatch ? parseInt(findingsMatch[1], 10) : null
    };
  } catch (error) {
    return {
      error: "Failed to get desloppify status",
      message: (error as Error).message
    };
  }
}

/**
 * Get next priority issue
 */
export function getNextIssue(): string {
  try {
    return execSync("desloppify next 2>&1", {
      encoding: "utf-8",
      timeout: 30000
    });
  } catch (error) {
    const output = (error as { stdout?: string }).stdout || (error as Error).message;
    return output || "No issues found or desloppify not available";
  }
}

/**
 * Get prioritized fix plan
 */
export function getPlan(): string {
  try {
    return execSync("desloppify plan 2>&1", {
      encoding: "utf-8",
      timeout: 30000
    });
  } catch (error) {
    const output = (error as { stdout?: string }).stdout || (error as Error).message;
    return output || "No plan available or desloppify not available";
  }
}
