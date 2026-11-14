import { handleImportRequest } from "@daluang/notes/import";
import { readSettings } from "@daluang/settings/store";
import type { APIRoute } from "astro";
import { readNotesEnv } from "@/lib/notes/env";

export const prerender = false;

/**
 * `POST /api/notes/import`. A static route has priority over `[id].ts`, and an ID is a
 * UUID, so no note has the ID `import`. See `handleImportRequest`.
 */
export const ALL: APIRoute = async (context) => {
	const db = readNotesEnv().DB;
	return handleImportRequest({
		request: context.request,
		db,
		settings: await readSettings(db),
		now: () => new Date(),
	});
};
