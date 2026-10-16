# What Daluang is [A Markdown CMS that you host on Cloudflare]

Daluang is a content management system (CMS) for writing. A writer edits notes in
Markdown, and the CMS keeps and publishes them. The CMS runs as a Cloudflare Worker.

The name comes from daluang, the bark paper of old Sundanese manuscripts.

Daluang is open source under the MIT license. You can host your own copy on your own
Cloudflare account.

## Status

Daluang is in early development. The repository has the workspace, the CMS app shell,
and this site. The editor, the note storage, and the deploy guide come in later
releases.

## The parts

| Part          | Does                                                    |
| ------------- | ------------------------------------------------------- |
| `apps/cms`    | The CMS. An Astro app that runs as a Cloudflare Worker. |
| `apps/docs`   | This site, on Vocs.                                     |
| `packages/ui` | The UI components, the theme, and the fonts.            |

## Markdown only

The CMS keeps each note as Markdown. It does not keep HTML or rich text.
[Comark](https://comark.dev) parses and renders the Markdown.
