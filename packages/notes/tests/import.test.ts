import { A } from "@mobily/ts-belt";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { NoteSettings } from "../src/api";
import { handleImportRequest, NOTES_IMPORT_API_PATH } from "../src/import";
import { noteSchema } from "../src/note";
import { NOTE_BODY_MAX_BYTES } from "../src/note-draft";
import { findNote, listNotes } from "../src/store";
import { createFakeD1 } from "./fake-d1";

const NOW = new Date("2026-11-14T00:00:00.000Z");

const SETTINGS: NoteSettings = {
	languages: { languages: ["en", "id"], defaultLanguage: "en" },
	fields: [
		{ name: "featured", label: "Featured", type: "boolean", required: true },
	],
};

// A file in the form of the old posts of rimzzlabs.com.
const OLD_POST = `---
title: "Jotai Recipes"
description: "Derived atoms"
publishedAt: "09/30/2023"
updatedAt: "10/16/2026"
status: "published"
featured: true
keywords:
  - react
---

import Callout from "@/components/callout.astro";

<Callout type="note">
  **In short:** use atoms.
</Callout>
`;

function post(body: unknown, init?: RequestInit): Request {
	return new Request(`http://localhost:4321${NOTES_IMPORT_API_PATH}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
		...init,
	});
}

function file(text: string, language = "en") {
	return { fileName: "en/jotai-recipes.mdx", language, text };
}

function handle(
	db: D1Database,
	request: Request,
	settings: NoteSettings = SETTINGS,
) {
	return handleImportRequest({ request, db, settings, now: () => NOW });
}

// The answer is JSON from outside the test, so the test reads it with a schema.
const answerSchema = z.object({
	note: noteSchema,
	warnings: z.array(z.unknown()),
});

async function imported(text: string) {
	const { db } = createFakeD1();
	const response = await handle(db, post(file(text)));
	expect(response.status).toBe(201);
	return answerSchema.parse(await response.json());
}

describe("POST /api/notes/import", () => {
	it("adds a post of an old file with its dates and the mark publish", async () => {
		const { db } = createFakeD1();
		const response = await handle(db, post(file(OLD_POST)));
		expect(response.status).toBe(201);
		const raw: unknown = await response.json();
		expect(raw).toEqual({
			note: {
				id: expect.any(String),
				title: "Jotai Recipes",
				slug: "jotai-recipes",
				language: "en",
				description: "Derived atoms",
				keywords: ["react"],
				fields: { featured: true },
				body: '::callout{type="note"}\n**In short:** use atoms.\n::\n',
				status: "draft",
				publishedAt: "2023-09-30T00:00:00.000Z",
				createdAt: NOW.toISOString(),
				updatedAt: "2026-10-16T00:00:00.000Z",
				published: null,
				mark: "publish",
			},
			warnings: [],
		});
		const { note } = answerSchema.parse(raw);
		expect(await findNote({ db, id: note.id })).toEqual(note);
	});

	it("gives no mark and the warning when the import cannot read a date", async () => {
		const answer = await imported(
			OLD_POST.replace('"09/30/2023"', '"30/09/2023"'),
		);
		expect(answer.note).toMatchObject({ mark: null, publishedAt: null });
		expect(answer.warnings).toEqual([
			{ code: "date-not-read", name: "publishedAt" },
		]);
	});

	it("refuses a slug that a post has in the same language", async () => {
		const { db } = createFakeD1();
		expect((await handle(db, post(file(OLD_POST)))).status).toBe(201);
		const again = await handle(db, post(file(OLD_POST)));
		expect(again.status).toBe(409);
		await expect(again.json()).resolves.toEqual({ error: "slug-taken" });
		const translation = await handle(db, post(file(OLD_POST, "id")));
		expect(translation.status).toBe(201);
	});

	it("adds one post when two imports of a slug come at the same time", async () => {
		const { db } = createFakeD1();
		const answers = await Promise.all([
			handle(db, post(file(OLD_POST))),
			handle(db, post(file(OLD_POST))),
		]);
		const statuses = A.map(answers, (answer) => answer.status);
		expect(A.sort(statuses, (a, b) => a - b)).toEqual([201, 409]);
		expect(await listNotes(db)).toHaveLength(1);
	});

	it("throws another error of D1 again", async () => {
		const { db, database } = createFakeD1();
		database.exec('drop table "note"');
		await expect(handle(db, post(file(OLD_POST)))).rejects.toThrow(
			/no such table/,
		);
	});

	it("refuses a language that the CMS does not have", async () => {
		const { db } = createFakeD1();
		const response = await handle(db, post(file(OLD_POST, "fr")));
		expect(response.status).toBe(422);
		await expect(response.json()).resolves.toEqual({
			error: "invalid-note",
			issues: [{ path: "language", message: expect.any(String) }],
		});
	});

	it.each([
		[
			"YAML that does not parse",
			"---\ntitle: A\nb: [1\n---\n",
			"frontmatter-not-read",
		],
		["no title", "# A post\n", "no-title"],
	])("refuses a file with %s", async (_name, text, error) => {
		const { db } = createFakeD1();
		const response = await handle(db, post(file(text)));
		expect(response.status).toBe(422);
		await expect(response.json()).resolves.toEqual({ error });
	});

	it("refuses a body that is not a file", async () => {
		const { db } = createFakeD1();
		const response = await handle(
			db,
			post({ fileName: "a.md", language: "en" }),
		);
		expect(response.status).toBe(422);
		await expect(response.json()).resolves.toEqual({
			error: "invalid-import",
			issues: [{ path: "text", message: expect.any(String) }],
		});
	});

	it("refuses an import before the onboarding saves the languages", async () => {
		const { db } = createFakeD1();
		const response = await handle(db, post(file(OLD_POST)), {
			languages: null,
			fields: null,
		});
		expect(response.status).toBe(409);
		await expect(response.json()).resolves.toEqual({
			error: "settings-needed",
		});
	});

	it("answers 405 to another method", async () => {
		const { db } = createFakeD1();
		const response = await handle(
			db,
			new Request(`http://localhost:4321${NOTES_IMPORT_API_PATH}`),
		);
		expect(response.status).toBe(405);
		expect(response.headers.get("Allow")).toBe("POST");
		await expect(response.json()).resolves.toEqual({
			error: "method-not-allowed",
		});
	});

	it.each([
		["another type", { headers: { "Content-Type": "text/plain" } }, 415],
		["text that is not JSON", { body: "{" }, 400],
		[
			"a body above the limit",
			{ body: "x".repeat(NOTE_BODY_MAX_BYTES + 70_000) },
			413,
		],
	])("refuses %s", async (_name, init, status) => {
		const { db } = createFakeD1();
		const response = await handle(db, post(null, init));
		expect(response.status).toBe(status);
	});
});
