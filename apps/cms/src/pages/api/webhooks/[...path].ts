import { handleWebhooksRequest } from "@daluang/webhooks/api";
import type { APIRoute } from "astro";
import { readWebhooksEnv } from "@/lib/webhooks/env";

export const prerender = false;

/** Each path below `/api/webhooks`. See `handleWebhooksRequest`. */
export const ALL: APIRoute = (context) =>
	handleWebhooksRequest({
		request: context.request,
		db: readWebhooksEnv().DB,
	});
