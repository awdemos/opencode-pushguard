"use strict";
/**
 * Desloppify CLI wrapper
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDesloppify = runDesloppify;
exports.getDesloppifyStatus = getDesloppifyStatus;
exports.getNextIssue = getNextIssue;
exports.getPlan = getPlan;
const child_process_1 = require("child_process");
/**
 * Run desloppify scan and parse results
 */
function runDesloppify(path = ".") {
    try {
        (0, child_process_1.execFileSync)("desloppify", ["scan", "--path", path], {
            encoding: "utf-8",
            timeout: 120000
        });
        const statusOutput = (0, child_process_1.execFileSync)("desloppify", ["status"], {
            encoding: "utf-8",
            timeout: 30000
        });
        const scoreMatch = statusOutput.match(/strict\s+(\d+\.?\d*)\/100/i);
        const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
        const findingsMatch = statusOutput.match(/open\s+\(in-scope\):\s+(\d+)/i);
        const findings = findingsMatch ? parseInt(findingsMatch[1], 10) : 0;
        return { score, findings, raw: statusOutput };
    }
    catch (error) {
        const err = error;
        const output = err.stdout || err.stderr || err.message || "";
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
function getDesloppifyStatus() {
    try {
        const output = (0, child_process_1.execFileSync)("desloppify", ["status"], {
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
    }
    catch (error) {
        return {
            error: "Failed to get desloppify status",
            message: error.message
        };
    }
}
/**
 * Get next priority issue
 */
function getNextIssue() {
    try {
        return (0, child_process_1.execFileSync)("desloppify", ["next"], {
            encoding: "utf-8",
            timeout: 30000
        });
    }
    catch (error) {
        const err = error;
        const output = err.stdout || err.stderr || err.message;
        return output || "No issues found or desloppify not available";
    }
}
/**
 * Get prioritized fix plan
 */
function getPlan() {
    try {
        return (0, child_process_1.execFileSync)("desloppify", ["plan"], {
            encoding: "utf-8",
            timeout: 30000
        });
    }
    catch (error) {
        const err = error;
        const output = err.stdout || err.stderr || err.message;
        return output || "No plan available or desloppify not available";
    }
}
//# sourceMappingURL=desloppify.js.map