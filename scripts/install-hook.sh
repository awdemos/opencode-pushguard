#!/usr/bin/env bash
#
# Install desloppify pre-push git hook
# Usage: ./install-hook.sh [--uninstall] [--force]
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK_NAME="pre-push"
HOOK_SOURCE="${SCRIPT_DIR}/${HOOK_NAME}"
HOOK_TARGET=""

# Parse arguments
FORCE=false
UNINSTALL=false
while [[ $# -gt 0 ]]; do
    case "$1" in
        --force|-f) FORCE=true; shift ;;
        --uninstall|-u) UNINSTALL=true; shift ;;
        --help|-h)
            echo "Usage: $0 [--uninstall] [--force]"
            echo ""
            echo "Options:"
            echo "  --uninstall, -u  Remove the pre-push hook"
            echo "  --force, -f      Overwrite existing hook without prompting"
            echo "  --help, -h       Show this help message"
            exit 0
            ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

# Find git directory
if [[ -d ".git" ]]; then
    HOOK_TARGET=".git/hooks/${HOOK_NAME}"
elif [[ -f ".git" ]]; then
    # Worktree case
    GIT_DIR=$(git rev-parse --git-common-dir 2>/dev/null || echo "")
    if [[ -n "$GIT_DIR" && -d "$GIT_DIR" ]]; then
        HOOK_TARGET="${GIT_DIR}/hooks/${HOOK_NAME}"
    fi
fi

if [[ -z "$HOOK_TARGET" ]]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

HOOK_DIR=$(dirname "$HOOK_TARGET")

# Create hooks directory if needed
if [[ ! -d "$HOOK_DIR" ]]; then
    mkdir -p "$HOOK_DIR"
fi

# Uninstall mode
if [[ "$UNINSTALL" == "true" ]]; then
    if [[ -L "$HOOK_TARGET" || -f "$HOOK_TARGET" ]]; then
        rm -f "$HOOK_TARGET"
        echo "✅ Uninstalled pre-push hook"
    else
        echo "ℹ️  No pre-push hook to uninstall"
    fi
    exit 0
fi

# Check for existing hook
if [[ -e "$HOOK_TARGET" && "$FORCE" != "true" ]]; then
    echo "⚠️  A pre-push hook already exists at: $HOOK_TARGET"
    echo "   Use --force to overwrite"
    exit 1
fi

# Create symlink (relative for portability)
REL_SOURCE=$(realpath --relative-to="$HOOK_DIR" "$HOOK_SOURCE" 2>/dev/null || echo "$HOOK_SOURCE")

# Remove existing hook if any
rm -f "$HOOK_TARGET"

# Create symlink
ln -sf "$REL_SOURCE" "$HOOK_TARGET"

# Verify
if [[ -L "$HOOK_TARGET" ]]; then
    echo "✅ Installed desloppify pre-push hook"
    echo "   Location: $HOOK_TARGET"
    echo ""
    echo "Configuration (environment variables):"
    echo "  DESLOPPIFY_SKIP=1        - Skip hook"
    echo "  DESLOPPIFY_BLOCK=1       - Block on low score"
    echo "  DESLOPPIFY_THRESHOLD=95  - Min score threshold"
    echo ""
    echo "To uninstall: $0 --uninstall"
else
    echo "❌ Failed to install hook"
    exit 1
fi
