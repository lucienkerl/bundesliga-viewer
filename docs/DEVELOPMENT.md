# Development

## Prerequisites

- Node.js 22 or newer
- npm

## Local setup

```bash
npm install
npm run crawl     # fetch data from bundesliga.dsb.de into public/data/
npm run dev       # start the Vite dev server
npm run build     # typecheck and build the static site into dist/
```

## Running tests

```bash
npm run test      # vitest (parser and seeding-list calculation, using saved HTML fixtures)
```

## Project structure

```
crawler/         Node/TypeScript crawler and parsers
crawler/fixtures Saved DSB HTML used by tests
src/             Static site (Vite, vanilla TypeScript)
public/data/     Generated JSON (committed by the scheduled action)
docs/            Specs, plans, decision log
```
