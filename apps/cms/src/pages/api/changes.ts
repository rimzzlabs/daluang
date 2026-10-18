import { handleChangesRequest } from "@daluang/notes/changes";
import type { APIRoute } from "astro";
import { readNotesEnv } from "@/lib/notes/env";
import { notifySites } from "@/lib/notes/notify";

export const prerender = false;

/** `GET /api/changes`, and `POST /api/changes` for Publish changes. See `handleChangesRequest`. */
export const ALL: APIRoute = (context) => {
	const db = readNotesEnv().DB;
	return handleChangesRequest({
		request: context.request,
		db,
		now: () => new Date(),
		notify: notifySites(db),
	});
};
