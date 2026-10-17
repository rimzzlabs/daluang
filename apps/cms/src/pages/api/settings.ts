import { handleSettingsRequest } from "@daluang/settings/api";
import type { APIRoute } from "astro";
import { readSettingsEnv } from "@/lib/settings/env";

export const prerender = false;

/** `GET` and `PATCH /api/settings`. See `handleSettingsRequest`. */
export const ALL: APIRoute = (context) =>
	handleSettingsRequest({
		request: context.request,
		db: readSettingsEnv().DB,
		now: () => new Date(),
	});
