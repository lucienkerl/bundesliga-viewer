# Site design

Agreed in conversation with the maintainer (mockup iterations), implemented in `src/`.

## Scope

All 14 DSB Bundesliga leagues (air pistole and air rifle, 1st and 2nd Bundesliga). One static page, hash routing, data from
`public/data/*.json` written by the crawler. No backend.

## Views per league

1. **Wettkampftage**: chips per match day, venues with host/referee, match cards that expand to the single results
   (series, totals, shoot-off). Each played match offers "Drucken" (A4 landscape sheet) and "Bild" (1080x1920 PNG for a
   WhatsApp status, content kept inside the safe area, away series left to right with S1 to S4 labels). On the printed
   sheet the away series run right to left, next to the total.
2. **Tabelle**: DSB table; a row opens the team page.
3. **Teams**: club info (address, federation, website, home match days) and the seeding list.

## Seeding list

Segmented view: Vergleich (official rank, results, start average, new average, new rank, movement), Offiziell (DSB) and
Berechnet. The official list is binding and labelled as such; the calculated list is a preview (rules in
`docs/ARCHITECTURE.md`). Below it a lineup card with two modes: "Nach Ø" (best five of the calculated list, at most one
foreign shooter) and "Eigene Auswahl" (chosen shooters ordered by the official list, rule check). Full names ("Surname,
Given name") are always shown because surnames are not unique within a team.

## Non-goals

Finals seeding (average without worst result), table re-computation, anything that needs the DSB to store data.

## Deployment

GitHub Pages. `pages.yml` is a reusable workflow, called by `crawl.yml` when the crawl changed data (pushes made with
`GITHUB_TOKEN` do not trigger other workflows) and on pushes to `main` that change code.
