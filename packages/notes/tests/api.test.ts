import { A } from "@mobily/ts-belt";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { NoteEvent, NoteSettings } from "../src/api";
import { handleNotesRequest, NOTES_API_PATH } from "../src/api";
import { NOTE_BODY_MAX_BYTES } from "../src/note-draft";
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

function noEvent(): Promise<void> {
	return Promise.reject(new Error("This request sends no event."));
}

function handle(db: D1Database, req: Request, id?: string) {
	return handleNotesRequest({
		request: req,
		db,
		id,
		action: undefined,
		settings: SETTINGS,
		now: () => NOW,
		notify: noEvent,
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
			notify: noEvent,
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

/** A request to `/api/notes/<id>/<action>`, and the events that it sent. */
async function act(call: ActionCall) {
	const notify = vi.fn((_event: NoteEvent) => Promise.resolve());
	const response = await handleNotesRequest({
		request: request(`/${call.id}/${call.action}`, {
			method: call.method ?? "POST",
		}),
		db: call.db,
		id: call.id,
		action: call.action,
		settings: call.settings ?? SETTINGS,
		now: () => NOW,
		notify,
	});
	return { response, events: A.map(notify.mock.calls, (args) => args[0]) };
}

describe("/api/notes/<id>/publish and /unpublish", () => {
	it("publishes a note, sets publishedAt, and tells each site", async () => {
		const { db } = createFakeD1();
		const id = await created(db);
		const { response, events } = await act({ db, id, action: "publish" });
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			note: expect.objectContaining({
				status: "published",
				publishedAt: NOW.toISOString(),
			}),
		});
		expect(events).toEqual(["publish"]);
	});

	it("refuses to publish a note that the current settings refuse", async () => {
		const { db } = createFakeD1();
		const id = await created(db);
		const settings: NoteSettings = {
			languages: SETTINGS.languages,
			fields: [
				{ name: "series", label: "Series", type: "text", required: true },
			],
		};
		const { response, events } = await act({
			db,
			id,
			action: "publish",
			settings,
		});
		expect(response.status).toBe(422);
		await expect(response.json()).resolves.toEqual({
			error: "invalid-note",
			issues: [{ path: "fields.series", message: "Give Series a value." }],
		});
		expect(events).toEqual([]);
	});

	it("refuses to publish before the onboarding saves the languages", async () => {
		const { db } = createFakeD1();
		const id = await created(db);
		const settings = { languages: null, fields: null };
		const { response } = await act({ db, id, action: "publish", settings });
		expect(response.status).toBe(409);
	});

	it("takes a published note back to a draft, and tells each site", async () => {
		const { db } = createFakeD1();
		const id = await created(db);
		await act({ db, id, action: "publish" });
		const { response, events } = await act({ db, id, action: "unpublish" });
		await expect(response.json()).resolves.toEqual({
			note: expect.objectContaining({
				status: "draft",
				publishedAt: NOW.toISOString(),
			}),
		});
		expect(events).toEqual(["unpublish"]);
	});

	it("sends no event to unpublish a draft", async () => {
		const { db } = createFakeD1();
		const id = await created(db);
		const { response, events } = await act({ db, id, action: "unpublish" });
		expect(response.status).toBe(200);
		expect(events).toEqual([]);
	});

	it("tells each site when a published note is deleted", async () => {
		const { db } = createFakeD1();
		const id = await created(db);
		await act({ db, id, action: "publish" });
		const notify = vi.fn((_event: NoteEvent) => Promise.resolve());
		const response = await handleNotesRequest({
			request: request(`/${id}`, { method: "DELETE" }),
			db,
			id,
			action: undefined,
			settings: SETTINGS,
			now: () => NOW,
			notify,
		});
		expect(response.status).toBe(204);
		expect(notify.mock.calls).toEqual([["unpublish"]]);
	});

	it.each([
		["publish", "nope", "POST", 404],
		["unpublish", "nope", "POST", 404],
		["publish", "n1", "GET", 405],
		["archive", "n1", "POST", 404],
	])("answers %s of %s with %s by %i", async (action, id, method, status) => {
		const { db } = createFakeD1();
		const { response } = await act({ db, id, action, method });
		expect(response.status).toBe(status);
	});
});
