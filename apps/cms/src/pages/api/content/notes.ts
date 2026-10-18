import { handleContentRequest } from "@daluang/notes/content";
import type { APIRoute } from "astro";
import { authorizeSite } from "@/lib/notes/authorize";
import { readNotesEnv } from "@/lib/notes/env";

export const prerender = false;

/** `GET /api/content/notes`, read by a site with an API token. See `handleContentRequest`. */
export const ALL: APIRoute = (context) => {
	const db = readNotesEnv().DB;
	return handleContentRequest({
		request: context.request,
		db,
		authorize: authorizeSite(db),
	});
};
