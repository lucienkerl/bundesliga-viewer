#!/usr/bin/env bash
# Commits and pushes changed crawl data. If the push collides with another commit (two data commits at
# nearly the same time), the local commit is dropped, the crawl is repeated on top of the newest main and
# committed again. Crawled data is reproducible, so this never needs a manual conflict resolution.
#
# Usage: scripts/commit-data.sh [crawl arguments...]
# Writes changed=true|false to $GITHUB_OUTPUT when set.
set -euo pipefail

out() { if [ -n "${GITHUB_OUTPUT:-}" ]; then echo "changed=$1" >> "$GITHUB_OUTPUT"; fi; }

for attempt in 1 2 3; do
  git add public/data
  if git diff --cached --quiet; then
    echo "No changes"
    out false
    exit 0
  fi
  git commit -q -m "chore(data): update crawled results"
  if git pull --rebase -q origin main && git push -q origin HEAD:main; then
    out true
    exit 0
  fi
  echo "Push collided (attempt $attempt), crawling again on top of the newest main"
  git rebase --abort 2>/dev/null || true
  git fetch -q origin main
  git reset -q --hard origin/main
  npm run crawl -- "$@"
done

echo "Giving up after 3 attempts" >&2
exit 1
