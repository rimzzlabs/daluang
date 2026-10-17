import { handleWebhooksRequest } from "@daluang/webhooks/api";
import type { APIRoute } from "astro";
import { readWebhooksEnv } from "@/lib/webhooks/env";

export const prerender = false;

/** `GET` and `POST /api/webhooks`. See `handleWebhooksRequest`. */
export const ALL: APIRoute = (context) =>
	handleWebhooksRequest({
		request: context.request,
		db: readWebhooksEnv().DB,
		now: () => new Date(),
		// Workers refuses a call of `fetch` as the method of another object, so the call has
		// no `this`.
		fetcher: (input, init) => fetch(input, init),
	});
