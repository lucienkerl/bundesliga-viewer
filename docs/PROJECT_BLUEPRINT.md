# Project Blueprint Decisions

Recorded by the `new-project-blueprint` skill on 2026-10-12. This file
is a decision log, not a living design doc — update it only if a recorded
decision is deliberately reversed later, and note the date of the change.

| Category | Decision |
|---|---|
| Projekt-Identität | Bundesliga Viewer (`bundesliga-viewer`): nicer view of DSB Bundesliga results, tables, teams and seeding lists. Public. |
| Plattform/Stack | Node/TypeScript crawler + static site (Vite, vanilla TypeScript). No stack template exists in the blueprint, only `_common` was scaffolded. |
| Hosting-Modell | Not self-hosted. GitHub Pages, data refreshed by a scheduled GitHub Action (browsers cannot fetch bundesliga.dsb.de directly because of CORS). |
| Update-Mechanismus | Scheduled GitHub Action: crawl, commit JSON, deploy Pages. No `deploy.sh`. |
| Tests & CI | vitest with saved DSB HTML fixtures; GitHub Actions CI (`ci.yml` written by hand, no template). |
| Doku-Struktur | Default set. Idea for later: `docs/ARCHITECTURE.md` (data model, seeding rules from the Ausschreibung LG/LP 2026/27). |
| Sprachregeln | Product UI German; code, comments, docs and commits English. |
| Commit-/Release-Konvention | Conventional Commits + git-cliff + `scripts/release.sh` + tag-triggered `release.yml`. Cadence: ad hoc. |
| Lizenz | MIT, Copyright Lucien Kerl. |
| Secrets & Config | None. `.env.example` is present but empty of secrets. |
| Deployment-Topologie | Not applicable (GitHub Pages). |
| Claude-Tooling-Setup | `.claude/` and `.superpowers/` created empty; no extra skills. |
