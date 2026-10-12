# Operations

## Deploying / updating

There is no server. A scheduled GitHub Action (`.github/workflows/crawl.yml`) runs the crawler, commits the changed JSON and publishes the site to GitHub Pages. Trigger it manually from the Actions tab if needed.

## Backups

The Git history of `public/data/` is the archive of all crawled results (including previous seasons).

## Monitoring / health checks

The crawler fails loudly if the DSB markup changes. A failed scheduled run in the Actions tab is the signal.

## Rollback

Revert the offending commit and let the Pages workflow redeploy.
