import { handleNotesRequest } from "@daluang/notes/api";
import { readSettings } from "@daluang/settings/store";
import type { APIRoute } from "astro";
import { readNotesEnv } from "@/lib/notes/env";

export const prerender = false;

/** `GET` and `POST /api/notes`. A draft obeys the stored settings. See `handleNotesRequest`. */
export const ALL: APIRoute = async (context) => {
	const db = readNotesEnv().DB;
	return handleNotesRequest({
		request: context.request,
		db,
		settings: await readSettings(db),
		now: () => new Date(),
	});
};
