# Operations

## Deploying / updating

There is no server. A scheduled GitHub Action (`.github/workflows/crawl.yml`) runs the crawler, commits the changed JSON and publishes the site to GitHub Pages. Trigger it manually from the Actions tab if needed.

Schedule (UTC, GitHub may start runs a few minutes late):

- Saturday and Sunday every 15 minutes between 07:00 and 19:45: the run first checks the match schedule from the last crawl
  (`crawler/should-crawl.ts`) and crawls only from 30 minutes before a match start until 150 minutes after it
  (Germany time, daylight saving handled). Otherwise it ends after a few seconds.
- Every day at 05:30: unconditional crawl for schedule changes, corrections and new official seeding lists.
- Manual runs always crawl.

The window sizes are `DEFAULT_WINDOW` in `crawler/gate.ts`. Club logos are shrunk to 160 px WebP files in `public/data/logos/`.

## Backups

The Git history of `public/data/` is the archive of all crawled results (including previous seasons).

## Monitoring / health checks

The crawler fails loudly if the DSB markup changes. A failed scheduled run in the Actions tab is the signal.

## Rollback

Revert the offending commit and let the Pages workflow redeploy.
