import type { APIRoute } from "astro";
import { handleSettingsRequest } from "../api";
import { readSettingsEnv } from "./env";

export const prerender = false;

/** `GET` and `PATCH /api/settings`. See `handleSettingsRequest`. */
export const ALL: APIRoute = (context) =>
	handleSettingsRequest({
		request: context.request,
		db: readSettingsEnv().DB,
	});
