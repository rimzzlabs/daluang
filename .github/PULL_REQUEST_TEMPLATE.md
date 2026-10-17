## Summary

<!-- What does this pull request change, and why? -->

Closes #

## Type of change

- [ ] Fix
- [ ] Feature
- [ ] Refactor, with no change of behavior
- [ ] Docs
- [ ] Chore, CI, or dependencies

## Test

<!-- The steps that you did to test the change. For a change to the interface, add a screenshot. -->

## Checklist

- [ ] The title is a Conventional Commit, in lower case. The squash merge makes it the commit on `main`.
- [ ] The pull request has one subject, and it changes less than 400 lines of code.
- [ ] `pnpm check`, `pnpm typecheck`, and `pnpm test` pass on my computer. I did not skip a hook.
- [ ] If the change touches `apps/cms` or a package, `pnpm build` passes. If it touches `apps/web` or `apps/docs`, `pnpm web:build` passes.
- [ ] Each changed source file has its test (`docs/testing.md`).
- [ ] A domain package has only pure functions, schemas, and side-effect functions with a `Side effect:` comment. It has no JSX.
- [ ] Each document that the change makes false is updated: `AGENTS.md`, `docs/`, `apps/docs`, or `README.md`.
- [ ] If the D1 schema changes, the pull request adds a new migration file. It does not edit an applied migration.
