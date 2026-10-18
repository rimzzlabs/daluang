import { handleNotesRequest } from "@daluang/notes/api";
import { readSettings } from "@daluang/settings/store";
import type { APIRoute } from "astro";
import { readNotesEnv } from "@/lib/notes/env";

export const prerender = false;

/** `POST /api/notes/<id>/publish`, `/unpublish`, and `/cancel`. See `handleNotesRequest`. */
export const ALL: APIRoute = async (context) => {
	const db = readNotesEnv().DB;
	return handleNotesRequest({
		request: context.request,
		db,
		id: context.params.id,
		action: context.params.action,
		settings: await readSettings(db),
		now: () => new Date(),
	});
};
