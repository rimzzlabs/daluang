import type { APIRoute } from "astro";
import { handleWebhooksRequest } from "../api";
import { readWebhooksEnv } from "./env";

export const prerender = false;

/** Each path below `/api/webhooks`. See `handleWebhooksRequest`. */
export const ALL: APIRoute = (context) =>
	handleWebhooksRequest({
		request: context.request,
		db: readWebhooksEnv().DB,
	});
