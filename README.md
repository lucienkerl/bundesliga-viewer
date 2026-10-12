# Bundesliga Viewer

A public, mobile-friendly viewer for the DSB Bundesliga (air rifle and air pistol): match days, tables, team pages, official vs. calculated seeding lists, and printable or shareable result sheets.



## Features

- Match days with expandable single results for every league (data crawled from bundesliga.dsb.de)
- League tables and team pages (venue, contact, shooters)
- Official seeding list (Setzliste) next to a calculated preview based on season averages
- Lineup helper that orders chosen shooters by the seeding list and checks the foreign-shooter rule
- Printable result sheet (A4 landscape) and a 9:16 image for WhatsApp status

## Userscript

`tools/bundesliga-druck.user.js` adds print and image buttons directly on bundesliga.dsb.de (Tampermonkey or similar). The site in this repo offers the same without a userscript.

## Getting started

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for local setup and
[docs/OPERATIONS.md](docs/OPERATIONS.md) for deploying/updating a running
instance.

## License

MIT — see [LICENSE](LICENSE).
