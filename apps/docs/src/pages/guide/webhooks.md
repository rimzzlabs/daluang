# Webhooks [Tell your site to rebuild]

A webhook is a URL that the CMS sends a POST to. Use the deploy hook of your site, so the
site can rebuild with the new posts.

The CMS sends a webhook when you select **Send a test**. It also sends one when you select
**Publish changes**: one delivery for all the changes, so a site rebuilds one time.
[Write a post](/guide/write-a-post) tells how to publish.

## Add the deploy hook of a site on Cloudflare Pages

1. Open your project on Cloudflare Pages, then open **Settings → Builds**.
2. Add a deploy hook, and copy its URL.
3. In the CMS, open **Publish → Webhooks** in the sidebar.
4. Type a name, for example `rimzzlabs.com rebuild`.
5. Paste the URL, then select **Add the webhook**.
6. Select **Send a test**. The delivery shows below the webhook.

## What the CMS sends

The CMS sends a POST with this JSON body:

```json
{ "event": "test", "sentAt": "2026-10-17T03:00:00.000Z" }
```

The event is `test` or `publish`. A deploy hook can ignore the body: a
POST starts the rebuild.

A delivery is **Delivered** when the answer has a status of 2xx. Each other answer, a
redirect, or no answer in 10 seconds is **Failed**. The CMS keeps the 20 newest deliveries
of each webhook.

## Keep the URL secret

The URL of a deploy hook is its secret: each person with the URL can start a build. The
list of webhooks shows only the host and the last 4 characters of each URL.

The CMS accepts only an `https` URL with a public host name. It refuses `localhost`, an IP
address, and a name of a local network, for example `printer.local`.
