import type { APIRoute } from "astro";
import { handleTokensRequest } from "../api";
import { readApiTokensEnv } from "./env";

export const prerender = false;

/** `GET` and `POST /api/tokens`, and `DELETE /api/tokens/<id>`. See `handleTokensRequest`. */
export const ALL: APIRoute = (context) =>
	handleTokensRequest({
		request: context.request,
		db: readApiTokensEnv().DB,
		id: context.params.id,
	});
