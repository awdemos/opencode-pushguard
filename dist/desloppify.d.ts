/**
 * Desloppify CLI wrapper
 */
interface DesloppifyResult {
    score: number;
    findings: number;
    raw?: string;
}
/**
 * Run desloppify scan and parse results
 */
export declare function runDesloppify(path?: string): DesloppifyResult | null;
/**
 * Get desloppify status
 */
export declare function getDesloppifyStatus(): Record<string, unknown>;
/**
 * Get next priority issue
 */
export declare function getNextIssue(): string;
/**
 * Get prioritized fix plan
 */
export declare function getPlan(): string;
export {};
//# sourceMappingURL=desloppify.d.ts.map