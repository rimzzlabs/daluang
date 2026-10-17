# Contributing to Daluang

Daluang is a Markdown CMS that runs as a Cloudflare Worker. It is open source under the
MIT license. This file tells how a change goes from your computer to `main`.

Read these files before your first change:

- `AGENTS.md`: the product scope, the open decisions, the architecture rules, and the
  tech stack. Its rules are for people and for agents.
- `docs/code-conventions.md`: the rules for each file that you write or change.
- `docs/testing.md`: which code needs a test, and the coverage thresholds.

## Local setup

1. Install Node.js 24 and pnpm 12. `.nvmrc` and the field `packageManager` of
   `package.json` have the versions.
2. Clone the repository.
3. Run `pnpm install` from the root. The install also adds the Git hooks.
4. Set up the sign-in with GitHub and the local database. Obey "Set up sign-in" in
   `apps/docs/src/pages/guide/local-development.md`.
5. Run `pnpm dev`, then open `http://localhost:4321`.

If a pull adds a file to `apps/cms/migrations`, run `pnpm db:migrate:local` again.

## Scripts

Run each script from the root.

| Command                 | Does                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| `pnpm dev`              | `astro dev` in `apps/cms`                                                                    |
| `pnpm build`            | `astro build` in `apps/cms`                                                                  |
| `pnpm preview`          | `astro preview` on the build of `apps/cms`. It sends the Content Security Policy.            |
| `pnpm web:dev`          | `vocs dev` and `astro dev` together, with hot reload for both. Open `http://localhost:4322`. |
| `pnpm web:build`        | The docs site, then the landing page with the docs site in `dist/docs`                       |
| `pnpm web:preview`      | `wrangler dev` on the build of `apps/web`: the same files and rules as production            |
| `pnpm docs:dev`         | `vocs dev` in `apps/docs` only, at `http://localhost:4323/docs/`                             |
| `pnpm docs:build`       | `vocs build` in `apps/docs`. A dead link fails it.                                           |
| `pnpm typecheck`        | The type check of each workspace                                                             |
| `pnpm check`            | Biome (lint and format) and Prettier, with no write                                          |
| `pnpm fix`              | Biome and Prettier, with write                                                               |
| `pnpm test`             | The unit tests, with coverage. A number below its threshold fails it.                        |
| `pnpm test:watch`       | The unit tests in watch mode, with no coverage                                               |
| `pnpm commit`           | The commit prompt of commitlint                                                              |
| `pnpm db:migrate:local` | Apply `apps/cms/migrations` to the local D1 database                                         |

`apps/cms` and `apps/web` each have a `cf:deploy` script, which runs `wrangler deploy`.
Do not run it. `docs/infrastructure.md` tells how a release deploys.

## Branches

Make a branch from `main` for each change. Name the branch `type/short-description`.
The type is the commit type of the main change:

```
feat/post-editor
fix/webhook-timeout
docs/contributor-guide
chore/bump-astro
```

## Commits

- **Write each commit message as a Conventional Commit:** `type(scope): subject`.
  commitlint refuses each other form.
- The type is one of `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `style`,
  `build`, `ci`, `chore`, and `revert`.
- The scope is the folder name of a workspace, for example `cms`, `ui`, `docs`, or
  `settings`. `deps`, `ci`, and `release` are also scopes. A change at the root has no
  scope.
- Write the subject in the imperative and in lower case, with no period at the end.
- `pnpm commit` opens the prompt of commitlint.
- Make one change of behavior in each commit, with its test and its docs. Each commit
  must pass the checks.
- If you move a file and change it, make two commits: the move, then the change. Git then
  shows the change as a diff.
- Do not add a trailer, a session link, or a "generated with" line to a commit.

lefthook runs the Git hooks. `pnpm install` installs them.

| Hook         | Runs                                                              |
| ------------ | ----------------------------------------------------------------- |
| `pre-commit` | Biome and Prettier on the staged files. The hook stages each fix. |
| `commit-msg` | commitlint on the message                                         |
| `pre-push`   | `pnpm typecheck` and `pnpm test`                                  |

Do not skip a hook with `LEFTHOOK=0` or `--no-verify`.

## Before you open a pull request

Run each command that applies to the change. Each one must pass.

| Command          | When                                   |
| ---------------- | -------------------------------------- |
| `pnpm check`     | Each change                            |
| `pnpm typecheck` | Each change                            |
| `pnpm test`      | Each change                            |
| `pnpm build`     | A change to `apps/cms` or to a package |
| `pnpm web:build` | A change to `apps/web` or `apps/docs`  |

- If the change is visible in the interface, look at it in `pnpm dev`.
- If the change makes a document false, update the document in the same pull request.
  "Topic docs" in `AGENTS.md` lists the documents.
- If the change adds a library that the tech stack of `AGENTS.md` does not name, open an
  issue first.

## Pull requests

- Keep one subject in each pull request. If a pull request changes more than 400 lines
  of code, split it. Moved files and generated files do not count.
- The title is a Conventional Commit, in lower case. The repository merges with squash
  only, so the title becomes the commit on `main`. release-please reads that commit to
  make the release. CI runs commitlint on the title.
- **Do not mix commit types in one pull request.** Each commit has the type of the title.
  The squash merge keeps only the title, so a `fix` commit in a `feat` pull request does
  not show in the changelog. Open a second pull request for the `fix`.
- Fill in the template, with its checklist.
- Link the issue of the change. Before a large change, open an issue, so that the
  approach is agreed before the work.
- `checks.yml` runs on each pull request: lint, format, type check, tests, and the
  builds. Each check must pass before the merge.
- `.github/CODEOWNERS` names the maintainer who reviews each pull request. GitHub deletes
  the branch after the merge.

## Releases

release-please makes each release from the commits on `main`. Do not edit these files by
hand:

- `CHANGELOG.md`
- the field `version` of a `package.json`
- `.release-please-manifest.json`

Before 1.0.0, a `feat` raises the minor number, and a `fix` raises the patch number.
`docs/infrastructure.md` tells how a release deploys.

## Code of conduct

Each person who takes part obeys the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

Daluang is under the [MIT license](LICENSE). When you send a contribution, you agree
that it is under the same license.
