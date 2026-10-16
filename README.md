# Daluang

A Markdown CMS that runs as a Cloudflare Worker. Open source under the MIT license.

## Workspace

| Path                | Package             | Does                                                                  |
| ------------------- | ------------------- | --------------------------------------------------------------------- |
| `apps/cms`          | `@daluang/cms`      | The CMS: Astro with React islands, on Cloudflare Workers              |
| `apps/web`          | `@daluang/web`      | The landing page at `daluang.rimzzlabs.com`, with the docs at `/docs` |
| `apps/docs`         | `@daluang/docs`     | The documentation site, on Vocs 2                                     |
| `packages/ui`       | `@daluang/ui`       | The UI primitives (shadcn `base-maia` on Base UI) and the theme       |
| `packages/tsconfig` | `@daluang/tsconfig` | The TypeScript base of each workspace                                 |

## Start

1. Install Node.js 24 and pnpm 12.
2. Run `pnpm install`.
3. Run `pnpm dev` for the CMS, or `pnpm docs:dev` for the documentation site.

`AGENTS.md` has the conventions of the repository.

## License

[MIT](LICENSE)
