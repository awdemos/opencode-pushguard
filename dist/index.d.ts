/**
 * Pushguard: OpenCode Plugin
 *
 * Intercepts git push commands and runs desloppify quality checks.
 * Blocks push if quality score is below threshold (configurable).
 */
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
declare const _default: {
    name: string;
    hooks: {
        /**
         * Intercept bash tool calls to detect git push
         */
        beforeToolCall: (toolName: string, args: ToolArgs) => Promise<HookResult>;
    };
    tools: Tool[];
};
export default _default;
//# sourceMappingURL=index.d.ts.map