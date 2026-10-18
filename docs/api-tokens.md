# API tokens

This page tells how a site gets a token to read the published notes. The logic is in
`packages/api-tokens`. The page of the tokens is in `apps/cms/src/components/api-tokens/`,
and its calls of the endpoint are in `apps/cms/src/lib/api-tokens/client.ts`. The route
files are `apps/cms/src/pages/api/tokens.ts` and `apps/cms/src/pages/api/tokens/[id].ts`.
They give each request to `handleTokensRequest`, with the `DB` binding of
`apps/cms/src/lib/api-tokens/env.ts`.

- A site reads the published notes with a token: `Authorization: Bearer dlg_…`. The
  content API that reads the notes is below `/api/content/`, and the sign-in guard needs
  no session there (`docs/auth.md`). `verifyApiToken` of
  `packages/api-tokens/src/verify.ts` is the check of the token.
- **D1 keeps the SHA-256 hash of a token, never the token**
  (`apps/cms/migrations/0003_api_tokens.sql`). A token has 32 random bytes, so a fast hash
  is safe. The column `start` keeps the prefix and 4 characters, to tell the tokens apart.
- `POST /api/tokens` gives the token one time. The page shows it once, with a copy button.
  `GET /api/tokens` gives the tokens with no hash. `DELETE /api/tokens/<id>` revokes one.
- A CMS can have 20 tokens (`TOKENS_MAX`). A check records the last use at most once a
  minute, so a site build that reads many notes writes D1 one time.
- The page reads the tokens from the server in an effect, the only effect of the page:
  the server is an external system. The HTML of the server shows the loading state.
