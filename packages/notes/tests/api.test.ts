import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { NoteSettings } from "../src/api";
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

function handle(db: D1Database, req: Request) {
	return handleNotesRequest({
		request: req,
		db,
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
			settings: { languages: null, fields: null },
			now: () => NOW,
		});
		expect(response.status).toBe(409);
		await expect(response.json()).resolves.toEqual({
			error: "settings-needed",
		});
	});
});

describe("other methods", () => {
	it("answers 405 to a method that the endpoint does not have", async () => {
		const { db } = createFakeD1();
		const response = await handle(db, request("", { method: "PUT" }));
		expect(response.status).toBe(405);
		expect(response.headers.get("Allow")).toBe("GET, POST");
	});
});
