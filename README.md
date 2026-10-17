# Daluang

A Markdown CMS that runs as a Cloudflare Worker. Open source under the MIT license.

[daluang.rimzzlabs.com](https://daluang.rimzzlabs.com) · [Docs](https://daluang.rimzzlabs.com/docs/) · [Deploy your own](https://daluang.rimzzlabs.com/docs/guide/deploy)

## Workspace

| Path                  | Package               | Does                                                                  |
| --------------------- | --------------------- | --------------------------------------------------------------------- |
| `apps/cms`            | `@daluang/cms`        | The CMS: Astro with React islands, on Cloudflare Workers              |
| `apps/web`            | `@daluang/web`        | The landing page at `daluang.rimzzlabs.com`, with the docs at `/docs` |
| `apps/docs`           | `@daluang/docs`       | The documentation site, on Vocs 2                                     |
| `packages/ui`         | `@daluang/ui`         | The UI primitives (shadcn `base-maia` on Base UI) and the theme       |
| `packages/auth`       | `@daluang/auth`       | Sign-in with GitHub, the allow list, and the sign-in guard            |
| `packages/notes`      | `@daluang/notes`      | The model of a note: metadata, languages, slugs, and extra fields     |
| `packages/settings`   | `@daluang/settings`   | The settings of a CMS and the questions of the first sign-in          |
| `packages/api-tokens` | `@daluang/api-tokens` | The API tokens that let a site read the published posts               |
| `packages/webhooks`   | `@daluang/webhooks`   | The webhooks that tell a site to rebuild                              |
| `packages/tsconfig`   | `@daluang/tsconfig`   | The TypeScript base of each workspace                                 |

## Start

1. Install Node.js 24 and pnpm 12.
2. Run `pnpm install`.
3. Run `pnpm dev` for the CMS, or `pnpm docs:dev` for the documentation site.

`AGENTS.md` has the conventions of the repository.

## License

[MIT](LICENSE)
