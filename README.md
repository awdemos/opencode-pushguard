# pushguard

OpenCode plugin that runs [desloppify](https://github.com/peteromallet/desloppify) quality checks before `git push`.

---

## 🤖 For AI Agents / Coding Assistants

**Copy and paste this prompt into your coding assistant:**

```
I want you to improve the quality of this codebase. To do this, install and run pushguard + desloppify.

Run ALL of the following (requires Python 3.11+):

pip install --upgrade "desloppify[full]"
desloppify update-skill claude    # IMPORTANT — installs the workflow guide. Pick yours: claude, cursor, codex, copilot, windsurf, gemini

    # Install the pre-push hook (blocks sloppy code from leaving your machine)
  ./scripts/install-hook.sh

    desloppify scan --path .
desloppify next

  --path is the directory to scan (use "." for the whole project, or "src/" etc).

Your goal is to get the strict score that Desloppify produces as high as possible. Don't be lazy. Fix things properly
and fix things deep. Large refactors are fine if that's what it takes but also small fixes are great. The scoring is designed
  to resist gaming, so the only way to improve it is to actually make the code better. Don't cheat.

Follow `next` — it tells you exactly what to fix, which file, and the resolve command to run
  when done. Fix the issue, resolve it, run `next` again. Keep going until done.
  Use `plan` to reorder priorities or cluster related issues.
  You can scan to refresh things. The scan output includes agent instructions — follow them, don't augment with your own analysis but follow its plan.

For OpenCode, add to ~/.config/opencode/opencode.json:
  {"plugin": ["pushguard"]}

Documentation: https://github.com/peteromallet/desloppify
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
  "plugin": ["pushguard"]
}
```

Or install locally:

```json
{
  "plugin": ["file:///path/to/pushguard"]
}
```

### Git Pre-Push Hook (Optional)

Install the pre-push hook in your repository:

```bash
# From npm
npx pushguard

# Or directly
./scripts/install-hook.sh
```

**Uninstall:**

```bash
npx pushguard --uninstall
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
