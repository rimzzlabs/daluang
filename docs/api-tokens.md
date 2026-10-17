# API tokens

This page tells how a site gets a token to read the published notes. The logic is in
`packages/api-tokens`. The page of the tokens is in `apps/cms/src/components/api-tokens/`.

- A site reads the published notes with a token: `Authorization: Bearer dlg_…`. The
  content API that reads the notes comes in a later step. `verifyApiToken` of
  `packages/api-tokens/src/verify.ts` is its check.
- **D1 keeps the SHA-256 hash of a token, never the token**
  (`apps/cms/migrations/0003_api_tokens.sql`). A token has 32 random bytes, so a fast hash
  is safe. The column `start` keeps the prefix and 4 characters, to tell the tokens apart.
- `POST /api/tokens` gives the token one time. The page shows it once, with a copy button.
  `GET /api/tokens` gives the tokens with no hash. `DELETE /api/tokens/<id>` revokes one.
- A CMS can have 20 tokens (`TOKENS_MAX`). A check records the last use at most once a
  minute, so a site build that reads many notes writes D1 one time.
- The page reads the tokens from the server in an effect, the only effect of the page:
  the server is an external system. The HTML of the server shows the loading state.
