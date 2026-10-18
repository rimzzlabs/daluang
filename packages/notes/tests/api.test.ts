import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { NoteSettings } from "../src/api";
import { handleNotesRequest } from "../src/api";
import { NOTES_API_PATH } from "../src/note";
import { NOTE_BODY_MAX_BYTES } from "../src/note-draft";
import { setNoteStatus } from "../src/store";
import { createFakeD1 } from "./fake-d1";

const ORIGIN = "http://localhost:4321";
const NOW = new Date("2026-10-18T00:00:00.000Z");

const SETTINGS: NoteSettings = {
	languages: { languages: ["en", "id"], defaultLanguage: "en" },
	fields: [
		{ name: "featured", label: "Featured", type: "boolean", required: true },
	],
};

const DRAFT = {
	title: "Jotai recipes",
	slug: "jotai-recipes",
	language: "en",
	fields: { featured: false },
	body: "# Jotai recipes",
};

function request(path: string, init?: RequestInit) {
	return new Request(`${ORIGIN}${NOTES_API_PATH}${path}`, init);
}

function send(method: string, path: string, body: unknown) {
	return request(path, {
		method,
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}

function handle(db: D1Database, req: Request, id?: string) {
	return handleNotesRequest({
		request: req,
		db,
		id,
		action: undefined,
		settings: SETTINGS,
		now: () => NOW,
	});
}

const createdSchema = z.object({ note: z.object({ id: z.string() }) });

async function created(db: D1Database, draft: unknown = DRAFT) {
	const response = await handle(db, send("POST", "", draft));
	return createdSchema.parse(await response.json()).note.id;
}

describe("POST /api/notes", () => {
	it("adds a draft, and the list then has its summary", async () => {
		const { db } = createFakeD1();
		const response = await handle(db, send("POST", "", DRAFT));
		expect(response.status).toBe(201);
		const listed = await handle(db, request(""));
		await expect(listed.json()).resolves.toEqual({
			notes: [
				expect.objectContaining({
					title: DRAFT.title,
					status: "draft",
					updatedAt: NOW.toISOString(),
				}),
			],
		});
	});

	it("refuses a draft with the message of each field", async () => {
		const { db } = createFakeD1();
		const response = await handle(
			db,
			send("POST", "", { ...DRAFT, language: "fr", fields: {} }),
		);
		expect(response.status).toBe(422);
		await expect(response.json()).resolves.toEqual({
			error: "invalid-note",
			issues: [
				{ path: "language", message: "Choose a language of this CMS." },
				{ path: "fields.featured", message: "Give Featured a value." },
			],
		});
	});

	it("refuses a slug that another note has in the same language", async () => {
		const { db } = createFakeD1();
		await created(db);
		const response = await handle(db, send("POST", "", DRAFT));
		expect(response.status).toBe(409);
		await expect(response.json()).resolves.toEqual({ error: "slug-taken" });
		const translation = await handle(
			db,
			send("POST", "", { ...DRAFT, language: "id" }),
		);
		expect(translation.status).toBe(201);
	});

	it.each([
		["a body of another type", request("", { method: "POST", body: "x" }), 415],
		[
			"a body that is not JSON",
			request("", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: "{",
			}),
			400,
		],
		[
			"a body that is too large",
			send("POST", "", {
				...DRAFT,
				body: "a".repeat(NOTE_BODY_MAX_BYTES + 70 * 1024),
			}),
			413,
		],
	])("refuses %s", async (_name, req, status) => {
		const { db } = createFakeD1();
		expect((await handle(db, req)).status).toBe(status);
	});

	it("refuses a write before the onboarding saves the languages", async () => {
		const { db } = createFakeD1();
		const response = await handleNotesRequest({
			request: send("POST", "", DRAFT),
			db,
			id: undefined,
			action: undefined,
			settings: { languages: null, fields: null },
			now: () => NOW,
		});
		expect(response.status).toBe(409);
		await expect(response.json()).resolves.toEqual({
			error: "settings-needed",
		});
	});
});

describe("/api/notes/<id>", () => {
	it("gives one note with its body", async () => {
		const { db } = createFakeD1();
		const id = await created(db);
		const response = await handle(db, request(`/${id}`), id);
		await expect(response.json()).resolves.toEqual({
			note: expect.objectContaining({ id, body: DRAFT.body }),
		});
	});

	it("changes a note, and keeps its own slug", async () => {
		const { db } = createFakeD1();
		const id = await created(db);
		const draft = { ...DRAFT, title: "More Jotai recipes" };
		const response = await handle(db, send("PATCH", `/${id}`, draft), id);
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			note: expect.objectContaining({ id, title: "More Jotai recipes" }),
		});
	});

	it("refuses a change to the slug of another note", async () => {
		const { db } = createFakeD1();
		await created(db);
		const other = await created(db, { ...DRAFT, slug: "jotai-state" });
		const response = await handle(db, send("PATCH", `/${other}`, DRAFT), other);
		expect(response.status).toBe(409);
	});

	it("refuses a change with a draft that is not valid", async () => {
		const { db } = createFakeD1();
		const id = await created(db);
		const response = await handle(
			db,
			send("PATCH", `/${id}`, { ...DRAFT, title: "" }),
			id,
		);
		expect(response.status).toBe(422);
	});

	it("deletes a note, then answers 404 for it", async () => {
		const { db } = createFakeD1();
		const id = await created(db);
		const deleted = await handle(
			db,
			request(`/${id}`, { method: "DELETE" }),
			id,
		);
		expect(deleted.status).toBe(204);
		expect((await handle(db, request(`/${id}`), id)).status).toBe(404);
		expect((await handle(db, send("PATCH", `/${id}`, DRAFT), id)).status).toBe(
			404,
		);
		expect(
			(await handle(db, request(`/${id}`, { method: "DELETE" }), id)).status,
		).toBe(404);
	});
});

describe("other methods", () => {
	it.each([
		["PUT", undefined, "GET, POST"],
		["POST", "n1", "GET, PATCH, DELETE"],
	])("answers 405 to %s", async (method, id, allow) => {
		const { db } = createFakeD1();
		const response = await handle(
			db,
			request(id ? `/${id}` : "", { method }),
			id,
		);
		expect(response.status).toBe(405);
		expect(response.headers.get("Allow")).toBe(allow);
	});
});

interface ActionCall {
	db: D1Database;
	id: string;
	action: string;
	method?: string;
	settings?: NoteSettings;
}

/** A request to `/api/notes/<id>/<action>`. */
function act(call: ActionCall) {
	return handleNotesRequest({
		request: request(`/${call.id}/${call.action}`, {
			method: call.method ?? "POST",
		}),
		db: call.db,
		id: call.id,
		action: call.action,
		settings: call.settings ?? SETTINGS,
		now: () => NOW,
	});
}

const noteSchema = z.object({
	note: z.object({
		status: z.string(),
		mark: z.string().nullable(),
		published: z.unknown().nullable(),
	}),
});

async function noteOf(response: Response) {
	return noteSchema.parse(await response.json()).note;
}

/** Publishes a note at once, as Publish changes does. */
async function publishNow(db: D1Database, id: string) {
	await setNoteStatus({ db, id, status: "published", now: NOW });
}

describe("/api/notes/<id>/publish, /unpublish, and /cancel", () => {
	it("marks a draft to publish, and the sites do not get it yet", async () => {
		const { db } = createFakeD1();
		const id = await created(db);
		const response = await act({ db, id, action: "publish" });
		expect(response.status).toBe(200);
		expect(await noteOf(response)).toEqual({
			status: "draft",
			mark: "publish",
			published: null,
		});
	});

	it("refuses to mark a note that the current settings refuse", async () => {
		const { db } = createFakeD1();
		const id = await created(db);
		const settings: NoteSettings = {
			languages: SETTINGS.languages,
			fields: [
				{ name: "series", label: "Series", type: "text", required: true },
			],
		};
		const response = await act({ db, id, action: "publish", settings });
		expect(response.status).toBe(422);
		await expect(response.json()).resolves.toEqual({
			error: "invalid-note",
			issues: [{ path: "fields.series", message: "Give Series a value." }],
		});
	});

	it("refuses to publish before the onboarding saves the languages", async () => {
		const { db } = createFakeD1();
		const id = await created(db);
		const settings = { languages: null, fields: null };
		expect((await act({ db, id, action: "publish", settings })).status).toBe(
			409,
		);
	});

	it("marks a published note to unpublish", async () => {
		const { db } = createFakeD1();
		const id = await created(db);
		await publishNow(db, id);
		const note = await noteOf(await act({ db, id, action: "unpublish" }));
		expect(note.status).toBe("published");
		expect(note.mark).toBe("unpublish");
	});

	it("stops a publish that waits, with an unpublish of a draft", async () => {
		const { db } = createFakeD1();
		const id = await created(db);
		await act({ db, id, action: "publish" });
		const note = await noteOf(await act({ db, id, action: "unpublish" }));
		expect(note.mark).toBeNull();
	});

	it("keeps a published note on the sites with a publish, and stops its unpublish", async () => {
		const { db } = createFakeD1();
		const id = await created(db);
		await publishNow(db, id);
		await act({ db, id, action: "unpublish" });
		const note = await noteOf(await act({ db, id, action: "publish" }));
		expect(note.mark).toBeNull();
		expect(note.status).toBe("published");
	});

	it("clears a mark with cancel", async () => {
		const { db } = createFakeD1();
		const id = await created(db);
		await act({ db, id, action: "publish" });
		const note = await noteOf(await act({ db, id, action: "cancel" }));
		expect(note.mark).toBeNull();
	});

	it("marks a published note to delete, and deletes a draft at once", async () => {
		const { db } = createFakeD1();
		const live = await created(db);
		await publishNow(db, live);
		const draft = await created(db, { ...DRAFT, slug: "a-draft" });
		const marked = await handle(
			db,
			request(`/${live}`, { method: "DELETE" }),
			live,
		);
		expect(marked.status).toBe(200);
		expect((await noteOf(marked)).mark).toBe("delete");
		const deleted = await handle(
			db,
			request(`/${draft}`, { method: "DELETE" }),
			draft,
		);
		expect(deleted.status).toBe(204);
	});

	it.each([
		["publish", "nope", "POST", 404],
		["unpublish", "nope", "POST", 404],
		["cancel", "nope", "POST", 404],
		["publish", "n1", "GET", 405],
		["archive", "n1", "POST", 404],
	])("answers %s of %s with %s by %i", async (action, id, method, status) => {
		const { db } = createFakeD1();
		expect((await act({ db, id, action, method })).status).toBe(status);
	});
});
