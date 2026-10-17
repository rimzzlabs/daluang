# Infrastructure

This page tells where each part of Daluang runs, and how a release reaches Cloudflare.
The guide for a person who hosts a copy is `apps/docs/src/pages/guide/deploy.md`.

## Hosting

| URL                          | Served by                                            | Worker        |
| ---------------------------- | ---------------------------------------------------- | ------------- |
| `daluang.rimzzlabs.com`      | `apps/web`                                           | `daluang-web` |
| `daluang.rimzzlabs.com/docs` | `apps/docs`, in the build of `apps/web`              | `daluang-web` |
| `cms.rimzzlabs.com`          | `apps/cms`: the copy of the CMS that the owner hosts | `daluang-cms` |

- `daluang-web` serves static files only. It has no server code. `apps/web/public/_headers`
  gives each file its security headers: no frame, no sniffed type, and HSTS.
- `apps/docs` has `basePath: "/docs"`. Each of its URLs starts with `/docs/`.
- **The root of the docs site is `/docs/`, with the slash.** At `/docs`, the client
  router of Vocs (Waku) throws "pathname must start with basePath". Link to `/docs/`.
  The Worker (`auto-trailing-slash`) and the dev middleware of `apps/web` redirect
  `/docs` to `/docs/`.
- A page of `apps/web` is a file (`build.format: "file"`), so its URL has no slash.
- Keep `trailingSlash: "ignore"` in `apps/web`. Astro checks the slash before the dev
  proxy runs, and the other values refuse a URL of the docs site.
- `apps/web/scripts/copy-docs.ts` copies `apps/docs/dist/public` into
  `apps/web/dist/docs`. Run `pnpm web:build`, which builds the docs site first.
- A missing page gets the nearest `404.html`: below `/docs`, the 404 page of Vocs.
- In development, `astro dev` of `apps/web` sends `/docs` to the Vocs dev server, also
  the socket of the hot reload. `pnpm web:dev` starts the two servers.
- The dev ports are fixed: `apps/cms` 4321, `apps/web` 4322, and `apps/docs` 4323. Vocs
  takes the next free port when 4323 is in use, and the proxy then fails. If `/docs`
  fails in development, stop the process on port 4323.
- Vocs does not add `basePath` to `iconUrl` and `logoUrl`. Write these URLs with `/docs`
  in `apps/docs/vocs.config.ts`.
- `apps/cms/wrangler.jsonc` has no domain and no database ID. The deploy workflow gives
  the domain from the variable `CMS_DOMAIN`, and Wrangler finds the database by its name,
  `daluang`. A fork deploys with no change to a file.
- The CMS has no Astro sessions (`session: false`) and no image service
  (`imageService: "passthrough"`), so the adapter adds no KV namespace and no Images
  binding. Its one binding is `DB`.

## Release and deploy

- release-please (`release.yml`) reads the Conventional Commits on `main`, and keeps a
  release pull request open. A merge of that pull request cuts the tag and the GitHub
  release. Its title is `chore(release): v<version>`, which commitlint accepts.
- The first release is v0.1.0 (`initial-version`). Before 1.0.0, a `feat` raises the
  minor number and a `fix` the patch number. A breaking change raises the minor number,
  so a release does not jump to 1.0.0.
- After a release, `release.yml` calls `deploy.yml` with the tag. A person can also run
  `deploy.yml` from the Actions tab, with a tag or a branch.
- `deploy.yml` deploys the CMS: it makes the D1 database `daluang` if it is missing,
  applies the migrations, builds, and deploys with `--secrets-file` and `--domain`. The
  migrations come before the deploy, so new code never runs on an old schema.
- `deploy.yml` deploys the landing page and the docs site only in `rimzzlabs/daluang`. A
  fork deploys only its CMS.
- The values come from the settings of the repository: the secrets
  `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `BETTER_AUTH_SECRET`,
  `AUTH_GITHUB_CLIENT_ID`, and `AUTH_GITHUB_CLIENT_SECRET`, and the variables `CMS_DOMAIN`
  and `ALLOWED_GITHUB_USERS`. `apps/docs/src/pages/guide/deploy.md` is the guide.
- A secret name of GitHub cannot start with `GITHUB_`, so the OAuth values start with
  `AUTH_`. The workflow gives them to the Worker as `GITHUB_CLIENT_ID` and
  `GITHUB_CLIENT_SECRET`.
- `apps/cms` and `apps/web` each have a `cf:deploy` script, which runs `wrangler deploy`.
  Do not run it. `deploy.yml` deploys, after a release. The name is not `deploy`, because
  `pnpm deploy` is a command of pnpm.

## Checks on a pull request

`checks.yml` runs on each pull request to `main`, and on no other event. A squash merge
puts the tested tree on `main`, so a second run on `main` repeats the same work.

| Job                                      | Command                                             |
| ---------------------------------------- | --------------------------------------------------- |
| Lint and format                          | `pnpm check`, and commitlint on the PR title        |
| Type check                               | `pnpm typecheck`                                    |
| Unit tests                               | `pnpm test`                                         |
| Build the CMS                            | `pnpm build`                                        |
| Build the landing page and the docs site | `pnpm web:build`. A dead link in the docs fails it. |

`.github/actions/install` installs pnpm, Node.js, and `node_modules` for each job, from a
cache that the lockfile keys.
