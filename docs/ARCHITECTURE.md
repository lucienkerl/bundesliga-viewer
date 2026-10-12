# Architecture

## Data flow

```
bundesliga.dsb.de ──(scheduled GitHub Action, crawler/)──> public/data/*.json ──> static site (src/)
```

Browsers cannot read bundesliga.dsb.de directly (CORS), so the crawler runs in GitHub Actions,
writes one JSON file per league (`public/data/<discipline>-<league>.json`) plus `index.json`, and
commits them only when the content changed. The site is static and reads those files.

## Sources on the DSB site

| What | Where |
|---|---|
| Table, match days, venues, referees, matches with single results | league page, e.g. `/luftpistole/1-bl-sued` (server-rendered) |
| Official seeding list (Setzliste) per team | URL in the `data-url` of the "Setzliste anzeigen" button (contains a `cHash`, so it is read from the league page each run) |
| Club address, federation, website | "Verein anzeigen" link; contact persons and e-mail addresses are deliberately not read |

The setlist columns are: rank, name, foreign marker (A), status (S regular / E substitute / F),
start average of the previous season, and the result per match day. The DSB footer shows the time of
the last update.

## Seeding rules (Ausschreibung Bundesliga LG/LP 2026/27)

- 1.5.1: Match day 1 uses the closing lists of the previous season (the DSB "start average").
- 1.5.3: After every match weekend the league management recreates the list from the results of the
  current season in that league. Ties keep the previous order. The official list is binding.
- Shooters without a season result keep their start average; shooters with neither go to the end.
- Results that do not count (incomplete, wrong seeding, team did not show up, shooter not eligible)
  are not visible on the web page, so `shared/seeding.ts` is a **preview** and says so in the UI.
- 3.8: Regular shooters (S) must start at least once during the season (11 match days in the 1st
  Bundesliga), otherwise 2 team points and 5 single points are deducted at the end.
- 3.9: Substitutes from lower leagues become regular shooters (F) after three starts (counted by date).
- Ligaordnung 3.1.3: At most one foreign shooter (A) per team and match.
- 1.5: The seeding list defines the order of the chosen five shooters; the team chooses who shoots.

## Layout

- `crawler/`: fetching and HTML parsing (cheerio). Fixtures of real DSB HTML live in `crawler/fixtures/`.
- `shared/`: types and pure logic used by crawler and site (`seeding.ts`, `lineup.ts`).
- `public/data/`: generated JSON.
- `src/`: static site.

## Resilience

- The DSB markup is not an API. Parsers throw when expected structure is missing instead of silently
  producing empty data. A failed league keeps its previous JSON and the run fails visibly.
- Past results can change (corrections by the league management, protests), so every run re-reads
  everything.
- A scheduled run that finds no change commits nothing.

## DSB quirks handled by the parser

- **Shoot-off (Stechen):** When a pair is tied after four series, the DSB adds a "Stechergebnis" row and shows the
  home shoot-off value in the home *total* cell. The parser keeps the four series, stores the shoot-off separately
  (`shootOff`) and recomputes the total from the series. `tests/data.test.ts` checks that every played pair and every
  team total adds up across all crawled leagues.
- **Unset shooters:** "Schütze nicht gesetzt" becomes `name: null`.
- **Setlist average 0:** The DSB shows 0 when a shooter has no start average; this is treated as "no basis".
