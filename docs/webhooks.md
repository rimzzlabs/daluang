# Webhooks

This page tells how the CMS tells a site to rebuild. The logic is in `packages/webhooks`.
The page of the webhooks is in `apps/cms/src/components/webhooks/`, and its calls of the
endpoint are in `apps/cms/src/lib/webhooks/client.ts`. The route files are
`apps/cms/src/pages/api/webhooks.ts` and `apps/cms/src/pages/api/webhooks/[...path].ts`.
They give each request to `handleWebhooksRequest`, with the `DB` binding of
`apps/cms/src/lib/webhooks/env.ts`.

- A webhook is a URL that gets a POST with `{ "event", "sentAt" }`, for example the
  deploy hook of a site on Cloudflare Pages. The events are `test`, from the button "Send
  a test", and `publish`, which Publish changes sends one time for all its changes
  (`docs/notes.md`, "Publish changes"). The CMS does not send `unpublish` now.
- `deliverEvent` of `src/deliver-event.ts` sends one event to each webhook at the same
  time, and records each delivery. A failed delivery does not stop the others.
  `listWebhookTargets` of the store gives it the ID and the full URL of each webhook.
- **The URL of a deploy hook is its secret.** The list shows only its host and its last 4
  characters (`urlHint`). Only a delivery reads the URL from D1.
- `isWebhookUrl` accepts only `https` with a public host name. It refuses `localhost`, an
  IP address, a user name, and a name of a local network (`.local`, `.internal`). It reads
  no DNS, so a public name of a local address passes. On Cloudflare, a Worker cannot reach
  a private network. A delivery does not follow a redirect, and it stops after 10 seconds.
- A delivery is `delivered` for a status of 2xx, and `failed` for another status or for
  no answer. D1 keeps the 20 newest deliveries of each webhook
  (`apps/cms/migrations/0004_webhooks.sql`), and the list shows 5.
- The package reads no global `fetch` and no clock. The route files give the handler `now`
  and `fetcher`, and a test gives a fixed clock and a fake. `fetcher` calls `fetch` with no
  `this`, and `sendWebhook` calls it in an async function. Workers refuses a call of `fetch`
  as the method of another object ("Illegal invocation").
