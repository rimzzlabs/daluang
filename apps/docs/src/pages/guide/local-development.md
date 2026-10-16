# Local development [Run the CMS and this site on your computer]

## Requirements

- Node.js 24. The file `.nvmrc` has the version.
- pnpm 12. The field `packageManager` in `package.json` has the version.

## Install

1. Clone the repository.
2. Run `pnpm install` from the root of the repository.

The install also adds the Git hooks.

## Set up sign-in

The CMS uses sign-in with GitHub. Only the GitHub users on its allow list can sign in.

1. Open [the developer settings of GitHub](https://github.com/settings/developers) and make a new OAuth app.
2. Set the homepage URL to `http://localhost:4321`.
3. Set the callback URL to `http://localhost:4321/api/auth/callback/github`.
4. Copy `apps/cms/.dev.vars.example` to `apps/cms/.dev.vars`.
5. Put the client ID and a new client secret of the OAuth app in `.dev.vars`.
6. Set `BETTER_AUTH_SECRET` to the output of `openssl rand -base64 32`.
7. Set `ALLOWED_GITHUB_USERS` to your GitHub username.
8. Run `pnpm db:migrate:local` to make the tables in the local database.

An empty `ALLOWED_GITHUB_USERS` allows nobody to sign in. Git ignores `.dev.vars`.

## Run the CMS

1. Run `pnpm dev`.
2. Open the URL that the command prints.

The CMS runs in workerd, the runtime of Cloudflare Workers.

## Run this site only

1. Run `pnpm docs:dev`.
2. Open `http://localhost:4323/docs/`.

## Run the landing page

1. Run `pnpm web:dev`.
2. Open `http://localhost:4322`.

The command starts the landing page and this site. The landing page sends each request
for `/docs` to the dev server of this site. A change to a page of either site shows at
once.

## Check a change

| Command           | Does                                                 |
| ----------------- | ---------------------------------------------------- |
| `pnpm check`      | Biome (lint and format) and Prettier, with no write  |
| `pnpm fix`        | Biome and Prettier, with write                       |
| `pnpm typecheck`  | The type check of each workspace                     |
| `pnpm build`      | The build of the CMS                                 |
| `pnpm web:build`  | The build of this site, then of the landing page     |
| `pnpm docs:build` | The build of this site. A dead link fails the build. |
