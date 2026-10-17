# Security headers

This page tells which headers the CMS sends with each response, and how the Content
Security Policy works. The code is in `apps/cms/src/lib/security/`.

## Headers

- `apps/cms/src/lib/security/` holds the security layer of the CMS. Its integration is first
  in `integrations`, so its middleware runs before the sign-in guard.
- **Each response gets the headers of `securityHeaders`:** no frame, no sniffed type, no
  search index, `Referrer-Policy: same-origin`, and HSTS on HTTPS. A response with no
  `Cache-Control` gets `no-store`.

## Content Security Policy

- **The Content Security Policy is `CMS_CSP` of `security/csp.ts`.** Astro sends it as a
  header of each page, with the hash of each script and style that it renders. A script
  with no hash does not run.
- `PREFERENCES_SCRIPT` is the one inline script, and `CMS_CSP` has its hash. Do not add an
  inline script, an `on*` attribute, or `'unsafe-inline'` to `script-src`.
- A `style` attribute is allowed (`style-src-attr 'unsafe-inline'`). React renders the
  width of the sidebar as one.
- An image from another host needs the host in `img-src`. The avatar comes from
  `avatars.githubusercontent.com`.
- `astro dev` sends no policy. To check the policy, run `pnpm build`, then `pnpm preview`.
