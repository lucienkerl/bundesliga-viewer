# Punctual crawls with an external trigger

GitHub schedules (`cron` in `.github/workflows/crawl.yml`) are best effort: runs are often hours late or skipped. For
results that arrive within minutes of a match, let an external scheduler start the workflow instead. The workflow decides
by itself whether a crawl is useful, so the scheduler can simply call it every few minutes.

## How it works

The scheduler sends one HTTP request to the GitHub API: `workflow_dispatch` on `crawl.yml` with `mode=auto`.

- `mode=auto`: the run checks the match schedule. Only from 30 minutes before a match start until 150 minutes after it,
  it crawls (light crawl, league pages only, about 10 seconds) and commits changes. Otherwise it ends after a few seconds.
- `mode=full` (default when started by hand in the Actions tab): crawls everything, including seeding lists and club pages.

A dispatch started this way that finds no changes commits nothing. The site is rebuilt only after a commit with changed data.

## Set it up (about 10 minutes)

1. **Create a token.** GitHub, Settings, Developer settings, Fine-grained personal access tokens, "Generate new token".
   - Resource owner: your account; Repository access: only `lucienkerl/bundesliga-viewer`.
   - Permissions: Repository permissions, **Actions: Read and write**. Nothing else.
   - Expiration: pick the longest sensible one and note it in your calendar.
2. **Test it once from a terminal** (replace `TOKEN`; the token must never be committed):

   ```bash
   curl -i -X POST \
     -H "Accept: application/vnd.github+json" \
     -H "Authorization: Bearer TOKEN" \
     -H "X-GitHub-Api-Version: 2022-11-28" \
     https://api.github.com/repos/lucienkerl/bundesliga-viewer/actions/workflows/crawl.yml/dispatches \
     -d '{"ref":"main","inputs":{"mode":"auto"}}'
   ```

   `HTTP/2 204` means it worked; a new run appears in the Actions tab.
3. **Create the job at an external cron service**, for example [cron-job.org](https://cron-job.org) (free):
   - URL: `https://api.github.com/repos/lucienkerl/bundesliga-viewer/actions/workflows/crawl.yml/dispatches`
   - Method: POST; request body: `{"ref":"main","inputs":{"mode":"auto"}}`
   - Headers: `Accept: application/vnd.github+json`, `Authorization: Bearer TOKEN`,
     `X-GitHub-Api-Version: 2022-11-28`, `Content-Type: application/json`
   - Time zone Europe/Berlin; schedule every 5 minutes, Saturday and Sunday, 08:00 to 22:00 (the workflow ignores times
     outside the match window anyway; other weekdays only matter if a match is moved).
   - Success is HTTP 204. Enable the failure notification of the service so you notice an expired token.
4. **Keep the GitHub cron as it is.** It stays as a fallback and as the daily full crawl.

## Alternatives

Any scheduler that can send that POST works (Cloudflare Worker cron trigger, a Raspberry Pi with `curl` in a crontab, ...).
The token is the only secret; store it only in the scheduler.
