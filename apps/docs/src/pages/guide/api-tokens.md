# API tokens [Give a site a token to read the published posts]

A site reads the published posts of the CMS with an API token. Give each site its own
token. Then you can revoke the token of one site, and the other sites keep their access.

A site sends its token to the content API. See [Astro site](/guide/astro-site).

## Make a token

1. Open **Publish → API tokens** in the sidebar.
2. Type a name for the token, for example `rimzzlabs.com build`.
3. Select **Make a token**.
4. Copy the token. The CMS shows it one time only.
5. Give the token to your site as a secret, for example `DALUANG_TOKEN`.

A token starts with `dlg_`. A secret scanner can find a token of Daluang by this start.

## How the CMS keeps a token

The CMS keeps the SHA-256 hash of each token in its D1 database, not the token. The list
shows the start of each token, the day that you made it, and its last use.

## Revoke a token

1. Open **Publish → API tokens**.
2. Select **Revoke** on the token.
3. Select **Revoke now**.

A site that uses a revoked token can no longer read the posts. A CMS can have 20 tokens.
