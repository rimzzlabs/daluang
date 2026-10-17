import { handleTokensRequest } from "@daluang/api-tokens/api";
import type { APIRoute } from "astro";
import { readApiTokensEnv } from "@/lib/api-tokens/env";

export const prerender = false;

/** `GET` and `POST /api/tokens`. See `handleTokensRequest`. */
export const ALL: APIRoute = (context) =>
	handleTokensRequest({
		request: context.request,
		db: readApiTokensEnv().DB,
		id: context.params.id,
	});
