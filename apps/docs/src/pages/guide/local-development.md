# Local development [Run the CMS and this site on your computer]

## Requirements

- Node.js 24. The file `.nvmrc` has the version.
- pnpm 12. The field `packageManager` in `package.json` has the version.

## Install

1. Clone the repository.
2. Run `pnpm install` from the root of the repository.

The install also adds the Git hooks.

## Run the CMS

1. Run `pnpm dev`.
2. Open the URL that the command prints.

The CMS runs in workerd, the runtime of Cloudflare Workers.

## Run this site

1. Run `pnpm docs:dev`.
2. Open the URL that the command prints.

## Check a change

| Command           | Does                                                 |
| ----------------- | ---------------------------------------------------- |
| `pnpm check`      | Biome (lint and format) and Prettier, with no write  |
| `pnpm fix`        | Biome and Prettier, with write                       |
| `pnpm typecheck`  | The type check of each workspace                     |
| `pnpm build`      | The build of the CMS                                 |
| `pnpm docs:build` | The build of this site. A dead link fails the build. |
