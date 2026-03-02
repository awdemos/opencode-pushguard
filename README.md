# opencode-pushguard

OpenCode plugin that runs [desloppify](https://github.com/peteromallet/desloppify) quality checks before `git push`.

---

## 🤖 For AI Agents / Coding Assistants

**Copy and paste this prompt into your coding assistant:**

```
```
Install opencode-pushguard to prevent sloppy code from being pushed to this repository.

Prerequisites:
- desloppify CLI installed: pip install "desloppify[full]"
- Run: desloppify update-skill claude (pick your assistant: claude, cursor, codex, copilot, windsurf, gemini)

Install the pre-push hook:
  ./scripts/install-hook.sh

What opencode-pushguard does:
- Intercepts git push commands
- Runs desloppify quality scan
- Warns or blocks if score < threshold (default: 95)

Configuration:
  DESLOPPIFY_SKIP=1      # Skip check entirely
  DESLOPPIFY_BLOCK=1     # Block push (vs warn)
  DESLOPPIFY_THRESHOLD=95  # Minimum score

For OpenCode, add to ~/.config/opencode/opencode.json:
  {"plugin": ["opencode-pushguard"]}

Documentation: https://github.com/awdemos/opencode-pushguard
```

---

## Features

- **OpenCode Plugin**: Intercepts `git push` commands and runs quality checks
- **Git Hook**: Optional pre-push hook for any git repository
- **Tools**: `desloppify_scan`, `desloppify_next`, `desloppify_plan`, `desloppify_status`, `desloppify_help`

## Installation

### As OpenCode Plugin

Add to your `~/.config/opencode/opencode.json`:

```json
{
  "plugin": ["opencode-pushguard"]
}
```

Or install locally:

```json
{
  "plugin": ["file:///path/to/opencode-pushguard"]
}
```

### Git Pre-Push Hook (Optional)

Install the pre-push hook in your repository:

```bash
# From npm
npx opencode-pushguard

# Or directly
./scripts/install-hook.sh
```

**Uninstall:**

```bash
npx opencode-pushguard --uninstall
# Or
./scripts/install-hook.sh --uninstall
```

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `DESLOPPIFY_SKIP` | `0` | Set to `1` to skip the hook |
| `DESLOPPIFY_BLOCK` | `0` | Set to `1` to block pushes below threshold |
| `DESLOPPIFY_THRESHOLD` | `95` | Minimum strict score (0-100) |

## Usage

### Normal Push (warns if score < threshold)

```bash
git push
```

### Block Pushes Below Threshold

```bash
export DESLOPPIFY_BLOCK=1
git push
```

### Skip Check Entirely

```bash
DESLOPPIFY_SKIP=1 git push
```

### Manual Quality Check

```bash
desloppify scan --path .
desloppify next
desloppify plan
```

## Tools Provided

When installed as an OpenCode plugin, the following tools are available:

| Tool | Description |
|------|-------------|
| `desloppify_scan` | Run quality scan, return score + findings |
| `desloppify_next` | Show highest priority issue |
| `desloppify_plan` | View prioritized fix plan |
| `desloppify_status` | Get current status |
| `desloppify_help` | Usage guide |

## Requirements

- [desloppify](https://github.com/peteromallet/desloppify) >= 0.1.0
- Node.js >= 18.0.0 (for OpenCode plugin)

## License

MIT
