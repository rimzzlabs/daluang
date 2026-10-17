# Auth

This page tells how a person signs in to the CMS, and how the CMS guards each page and
each endpoint. The logic is in `packages/auth`. The sign-in button and the user menu are
in `apps/cms/src/components/auth/`. The browser client of Better Auth is
`apps/cms/src/lib/auth/client.ts`. The server side of the app is in `apps/cms/src/lib/auth/`:
the instance, the guard middleware, and the read of the environment.

## Sign-in

- Sign-in is with GitHub only, through Better Auth. Better Auth keeps the users, the
  accounts, and the sessions in D1.
- **Only the GitHub users of `ALLOWED_GITHUB_USERS` can sign in.** The value is a list of
  usernames, separated by commas, compared in lower case. An empty list allows nobody.
- Two database hooks of `packages/auth/src/server.ts` check the list: one when the user
  row is made, and one at each new session. A refused sign-in returns to
  `/sign-in?error=github_user_not_allowed`.
- Each error of Better Auth opens `/sign-in?error=<code>` (`onAPIError.errorURL`).
  `signInError` of `packages/auth/src/sign-in-error.ts` gives the message of each code.
- `githubLogin` comes from the GitHub profile, and the allow list trusts it. Better Auth
  drops a field with `input: false` from a profile, so the field takes input.
- A session that exists stays valid after its user leaves the list, until it expires.
  To end it now, delete its row from the `session` table.

## Endpoints of Better Auth

- `apps/cms/src/pages/api/auth/[...all].ts` gives each request below `/api/auth` to the
  handler of the Better Auth instance (`apps/cms/src/lib/auth/auth.ts`).
- **Only the endpoints of `OPEN_AUTH_PATHS` answer.** The plugin `openPathsOnly` of
  `packages/auth/src/server.ts` gives 404 to each other path below `/api/auth`. It is an
  allow list, so a new endpoint of Better Auth stays closed. Do not open an endpoint that
  writes a user or gives the GitHub access token.
- D1 keeps the GitHub tokens of an account encrypted with `BETTER_AUTH_SECRET`
  (`encryptOAuthTokens`).
- **The rate limit of Better Auth is on** (`rateLimit.enabled`). Better Auth turns it on
  only when `NODE_ENV` is `production`, and a Worker has no `NODE_ENV`. The sign-in allows
  3 requests in 10 seconds from one address. The count is in the memory of each isolate.
- Better Auth reads the address of the client from `CF-Connecting-IP`. Cloudflare sets
  it, and a client cannot. Do not add `X-Forwarded-For`: a client can set it.

## The guard

- The guard (`apps/cms/src/lib/auth/middleware.ts`) needs a session for each page and
  each endpoint, with two exceptions: `/sign-in`, and `/api/auth/*`. A page with no
  session redirects to `/sign-in?next=<path>`. An endpoint with no session answers 401.
- **A write from another origin answers 403, also with a session.** A write is `POST`,
  `PUT`, `PATCH`, or `DELETE`. `isCrossOriginWrite` of `packages/auth/src/guard.ts`
  compares the `Origin` header with the origin of the request. A write with no `Origin`
  is refused also.
- A page reads the signed-in user from `Astro.locals.user`.
- Give each `next` value to `safeNext` before a redirect. It refuses a URL that leaves
  the app.

## Schema and environment

- `apps/cms/migrations/0001_auth.sql` holds the tables of Better Auth. If the auth config
  changes the schema (a plugin, a field), make the SQL with `getMigrations` of
  `better-auth/db/migration`, and add it as a new migration file. Do not edit an applied
  migration.
- `apps/cms/.dev.vars.example` lists each variable. In production, set each one with
  `wrangler secret put`.
- `apps/cms/src/lib/auth/env.ts` reads the auth variables and the `DB` binding with the
  schema of `@daluang/auth/env`.
