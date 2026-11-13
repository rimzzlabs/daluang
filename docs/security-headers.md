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
- `style-src` has `'self'` in `CMS_CSP`. A resource that a page adds to `style-src`
  replaces the default `'self'` of Astro, so the config keeps it. `astro build` and
  `astro dev` then warn that `style-src-attr` does not get `'self'`. The warning is
  expected: a `style` attribute needs only `'unsafe-inline'`.
- An image from another host needs the host in `img-src`. The avatar comes from
  `avatars.githubusercontent.com`.

## Style elements of a script

- **A `<style>` element that a script makes needs the nonce of the response.** The policy
  has hashes only for the styles that Astro renders, so it refuses each other `<style>`
  element. CodeMirror makes one for the editor.
- `apps/cms/src/pages/[...path].astro` makes a nonce for each response with
  `makeStyleNonce` of `security/style-nonce.ts`: 128 random bits from
  `crypto.getRandomValues`, as base64. `Astro.csp.insertStyleResource` adds
  `'nonce-<value>'` to `style-src` of the header of that response.
- `BaseLayout` gives the nonce to the browser in `<meta property="csp-nonce">`, the
  convention of Vite. The sign-in page and the welcome page make no `<style>` element in
  a script, so they get no nonce.
- `readStyleNonce` reads the nonce from the `nonce` property of the meta. A browser hides
  the `nonce` attribute from `getAttribute`.
- `MarkdownEditor` gives the nonce to CodeMirror with `EditorView.cspNonce`. CodeMirror
  then puts the nonce on its `<style>` element.
- `script-src` gets no nonce. A script still needs a hash.
- **If a new library makes a `<style>` element, give it the nonce.** Read the nonce with
  `readStyleNonce`, and give it to the option of the library. If a library has no nonce
  option, do not use it in the island.
- Base UI has `CSPProvider` for the nonce. ScrollArea and Select make a `<style>`
  element. Tabs and Slider make an inline `<script>`, and `script-src` has no nonce. The
  CMS uses none of these parts.
- A new page with such a library makes its nonce in its own frontmatter, as
  `[...path].astro` does. Astro writes the header after the frontmatter of the page. It can
  write the header before the frontmatter of a layout runs.

## Check the policy

- `astro dev` sends no policy. To check the policy, run `pnpm build`, then `pnpm preview`.
  The preview server of Astro 7 keeps running in the background. After a new build, stop
  it with `pnpm --filter @daluang/cms exec astro preview stop`, or it serves the old
  build.
