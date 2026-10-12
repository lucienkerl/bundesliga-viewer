# Working on Bundesliga Viewer

## Language

Code, comments, docstrings, test names, design documents, filenames, and
commit messages are written in **English**. Product UI strings are **German**; keep them together (e.g. `src/i18n/de.ts`) so the code itself stays English.

## Commit messages

English, [Conventional Commits](https://www.conventionalcommits.org/), in the
form:

```
feat(scope): add a search field to the device view
fix(scope): new commands reach devices commissioned earlier
docs(specs): record why the resend interval has a floor
refactor(tests): translate test prose to English
chore(deps): bump lockfile
```

Say what changed and why it changed. A subject that only names the file it
touched tells a later reader nothing they could not get from
`git show --stat`.

Conventional Commits are not just style here — `cliff.toml` parses the commit
type to build `CHANGELOG.md`. A commit outside the known types (`feat`,
`fix`, `perf`, `refactor`, `docs`, `chore`, `ci`, `test`) lands in "Other
Changes" instead of its proper section.

## Design docs

Non-trivial features get a design spec in `docs/superpowers/specs/` before
implementation (see `docs/superpowers/plans/` for the resulting implementation
plans). Follow the `superpowers:brainstorming` and `superpowers:writing-plans`
skills for the process.

## Releases

See `docs/PROJECT_BLUEPRINT.md` for the recorded release cadence decision, and
the repo root `scripts/release.sh` for the mechanism.
