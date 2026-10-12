#!/usr/bin/env bash
#
# Cuts a release: regenerates CHANGELOG.md from Conventional Commits via
# git-cliff, commits it, tags, and pushes. The release *moment* is always a
# deliberate human call — this script never picks a version on its own.
#
#   ./scripts/release.sh v1.3.0            regenerate changelog, commit, tag, push
#   ./scripts/release.sh v1.3.0 --dry-run  same, but no commit/tag/push
#
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION="${1:-}"
DRY_RUN=0
for arg in "$@"; do
  if [ "$arg" = "--dry-run" ]; then
    DRY_RUN=1
  fi
done

if [ -z "$VERSION" ]; then
  echo "Usage: $0 vX.Y.Z [--dry-run]" >&2
  exit 1
fi

if ! [[ "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "✗ Version must look like vX.Y.Z, got: $VERSION" >&2
  exit 1
fi

if ! command -v git-cliff >/dev/null 2>&1; then
  echo "✗ git-cliff is not installed. Install it first:" >&2
  echo "  brew install git-cliff" >&2
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "✗ Working tree is not clean. Commit or stash first." >&2
  exit 1
fi

if git rev-parse "$VERSION" >/dev/null 2>&1; then
  echo "✗ Tag $VERSION already exists." >&2
  exit 1
fi

echo "→ Generating CHANGELOG.md for $VERSION"
git cliff --tag "$VERSION" -o CHANGELOG.md

if [ "$DRY_RUN" = "1" ]; then
  echo "→ Dry run: CHANGELOG.md written, nothing committed or tagged."
  exit 0
fi

git add CHANGELOG.md
git commit -m "chore(release): $VERSION"
git tag -a "$VERSION" -m "$VERSION"
git push --follow-tags

echo "✓ Released $VERSION"
