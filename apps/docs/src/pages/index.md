# What Daluang is [A Markdown CMS that you host on Cloudflare]

Daluang is a content management system (CMS) for writing. A writer edits posts in
Markdown, and the CMS keeps and publishes them. The CMS runs as a Cloudflare Worker.

The name comes from daluang, the bark paper of old Sundanese manuscripts.

Daluang is open source under the MIT license. You can host your own copy on your own
Cloudflare account.

## Status

Daluang is in early development. The CMS has these parts now:

- Sign-in with GitHub, for the users of an allow list.
- The questions of the [first sign-in](/guide/first-sign-in): the site and the languages.
- The settings of the site, the languages, and the extra fields of a post.
- The [API tokens](/guide/api-tokens) of a site, and the [webhooks](/guide/webhooks) that
  tell a site to rebuild.

The editor and the post storage come in later releases. [Deploy](/guide/deploy) tells you
how to host your own copy.

## The parts

| Part          | Does                                                     |
| ------------- | -------------------------------------------------------- |
| `apps/cms`    | The CMS. An Astro app that runs as a Cloudflare Worker.  |
| `apps/web`    | The landing page. It serves this site at `/docs`.        |
| `apps/docs`   | This site, on Vocs.                                      |
| `packages/ui` | The UI components, the theme, and the fonts.             |
| `packages/*`  | One package for each domain, for example auth and notes. |

## Markdown only

The CMS keeps each post as Markdown. It does not keep HTML or rich text.
[Comark](https://comark.dev) parses and renders the Markdown.
