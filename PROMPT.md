# Desloppify-Guard OpenCode Plugin

## Task

Build an OpenCode plugin called `desloppify-guard` that intercepts `git push` commands and runs desloppify quality checks before allowing the push to proceed.

## Architecture Decision: Plugin vs MCP Server

**This MUST be a plugin, not an MCP server.**

| Approach | Can Intercept/Hook | Can Block | Enforcement |
|----------|-------------------|-----------|-------------|
| **Plugin** | ✅ Yes (`beforeToolCall`) | ✅ Yes | Enforced |
| **MCP Server** | ❌ No | ❌ No | Optional |

### Why Plugin?

1. **Interception Required**: We need to catch `git push` before it executes
2. **Conditional Blocking**: We need to prevent the push if quality score is too low
3. **Hooks API**: Only plugins have `hooks.beforeToolCall` to intercept tool execution

### Why Not MCP Server?

MCP servers can only **provide tools** — they cannot intercept or block anything. An MCP server would give you `desloppify_scan` as a tool, but the agent would have to voluntarily call it. It cannot force a quality check before `git push`.

### Hybrid Option (Future)

You could later create an MCP server for other clients (Claude Desktop, etc.) that want desloppify tools, but the enforcement hook must be a plugin.

## Project Location

```
/home/andrewh/code/personal/desloppify-guard
```

Git worktree on branch: `plugin/desloppify-guard`

## Reference Implementation

Study the existing `envsitter-guard` plugin for the hook pattern:
- **GitHub**: https://github.com/boxpositron/envsitter-guard
- **Key file**: `index.ts` - shows how to register tool hooks that intercept/block operations

## Requirements

### 1. Plugin Hook Behavior

When the agent attempts to run `git push` (via `bash` tool), the plugin should:

1. **Pre-execution check**: Intercept the bash command
2. **Detect git push**: Check if command contains `git push` or `git *push*`
3. **Run desloppify**: Execute `desloppify scan --path .`
4. **Evaluate score**: 
   - Get strict score from desloppify output
   - Compare against threshold (default: 95, configurable via env var)
5. **Decision**:
   - **Score >= threshold**: Allow push to proceed
   - **Score < threshold**: 
     - If `DESLOPPIFY_BLOCK=1`: Block push, return error with guidance
     - Otherwise: Warn but allow push to continue

### 2. Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `DESLOPPIFY_SKIP` | `0` | Skip the hook entirely |
| `DESLOPPIFY_BLOCK` | `0` | Block push if below threshold |
| `DESLOPPIFY_THRESHOLD` | `95` | Minimum strict score |

### 3. Tools to Provide

Create these tools (like envsitter-guard does):

- `desloppify_scan` - Run a quality scan, return score + findings count
- `desloppify_next` - Show highest priority issue to fix
- `desloppify_plan` - View prioritized fix plan
- `desloppify_help` - Usage guide

### 4. Blocking Pattern

Follow envsitter-guard's pattern:

```typescript
// In index.ts, register a hook on the bash tool
export default {
  name: "desloppify-guard",
  hooks: {
    beforeToolCall: async (toolName, args) => {
      if (toolName === "bash" && isGitPush(args.command)) {
        // Check DESLOPPIFY_SKIP
        if (process.env.DESLOPPIFY_SKIP === "1") {
          return { proceed: true };
        }
        
        // Run desloppify check
        const result = await runDesloppify();
        
        if (result.score < threshold && process.env.DESLOPPIFY_BLOCK === "1") {
          return {
            proceed: false,
            error: `PUSH BLOCKED: Score ${result.score} below threshold ${threshold}. Run 'desloppify next' to see issues.`
          };
        }
        
        // Warn but proceed
        console.warn(`⚠️ Quality score ${result.score} below target ${threshold}`);
        return { proceed: true };
      }
      return { proceed: true };
    }
  },
  tools: [
    // Define desloppify_* tools here
  ]
};
```

### 5. Project Structure

```
desloppify-guard/
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── index.ts           # Main plugin with hooks + tools
├── src/
│   ├── desloppify.ts  # Desloppify CLI wrapper
│   └── utils.ts       # Git command detection
├── test/
│   └── index.test.ts
├── README.md
├── AGENTS.md
└── LICENSE
```

### 6. package.json

```json
{
  "name": "desloppify-guard",
  "version": "1.0.0",
  "description": "OpenCode plugin that runs desloppify quality checks before git push",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "typecheck": "tsc --noEmit",
    "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js"
  },
  "keywords": ["opencode", "plugin", "desloppify", "quality", "git"],
  "license": "MIT",
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

### 7. Installation Method

The plugin should be installable via:

**npm (published)**:
```json
{ "plugin": ["desloppify-guard@latest"] }
```

**Local development**:
```
.opencode/plugin/desloppify-guard.ts:
  export { default } from "/path/to/desloppify-guard";
```

## Success Criteria

1. ✅ Plugin intercepts `git push` commands
2. ✅ Runs desloppify scan before push
3. ✅ Blocks or warns based on score + env vars
4. ✅ Provides `desloppify_*` helper tools
5. ✅ Works when installed via `opencode.json`
6. ✅ Has tests
7. ✅ Has README with usage instructions

## Notes

- Use `child_process.spawn` to run desloppify CLI
- Parse JSON output from desloppify if available, otherwise parse text
- Handle case where desloppify is not installed gracefully (warn, don't block)
- Log quality reports in a readable format (like the bash pre-push hook does)

## Commands to Start

```bash
cd /home/andrewh/code/personal/desloppify-guard
npm init -y
npm install -D typescript @types/node
npx tsc --init

# Then implement index.ts following envsitter-guard pattern
```
