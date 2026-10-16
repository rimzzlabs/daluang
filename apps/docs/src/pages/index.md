# What Daluang is [A Markdown CMS that you host on Cloudflare]

Daluang is a content management system (CMS) for writing. A writer edits notes in
Markdown, and the CMS keeps and publishes them. The CMS runs as a Cloudflare Worker.

The name comes from daluang, the bark paper of old Sundanese manuscripts.

Daluang is open source under the MIT license. You can host your own copy on your own
Cloudflare account.

## Status

Daluang is in early development. The CMS has sign-in with GitHub, the questions of the
[first sign-in](/guide/first-sign-in), and the frame of the app. The editor and the note
storage come in later releases. [Deploy](/guide/deploy) tells you how to host your own
copy.

## The parts

| Part          | Does                                                     |
| ------------- | -------------------------------------------------------- |
| `apps/cms`    | The CMS. An Astro app that runs as a Cloudflare Worker.  |
| `apps/web`    | The landing page. It serves this site at `/docs`.        |
| `apps/docs`   | This site, on Vocs.                                      |
| `packages/ui` | The UI components, the theme, and the fonts.             |
| `packages/*`  | One package for each domain, for example auth and notes. |

## Markdown only

The CMS keeps each note as Markdown. It does not keep HTML or rich text.
[Comark](https://comark.dev) parses and renders the Markdown.
