import { describe, expect, it, vi } from "vitest";
import { CONTENT_NOTES_API_PATH, handleContentRequest } from "../src/content";
import type { NoteDraft } from "../src/note";
import { createNote, updateNote } from "../src/store";
import { createFakeD1 } from "./fake-d1";
import { publishNotes } from "./publish";

const NOW = new Date("2026-10-18T00:00:00.000Z");
const URL_OF_API = `http://localhost:4321${CONTENT_NOTES_API_PATH}`;

const DRAFT: NoteDraft = {
	title: "Jotai recipes",
	slug: "jotai-recipes",
	language: "en",
	description: "",
	keywords: [],
	fields: { featured: true },
	body: '::callout{type="note"}\nRun **pnpm i** first.\n::\n',
};

function read(db: D1Database, valid: boolean, method = "GET") {
	const authorize = vi.fn(() => Promise.resolve(valid));
	const request = new Request(URL_OF_API, {
		method,
		headers: { Authorization: "Bearer dlg_x" },
	});
	return {
		authorize,
		response: handleContentRequest({ request, db, authorize }),
	};
}

describe("handleContentRequest", () => {
	it("gives the published copy of each note with its Comark document, and no draft", async () => {
		const { db } = createFakeD1();
		const published = await createNote({ db, draft: DRAFT, now: NOW });
		await publishNotes({ db, ids: [published.id], now: NOW });
		await createNote({ db, draft: { ...DRAFT, slug: "a-draft" }, now: NOW });
		const { authorize, response } = read(db, true);
		const answer = await response;
		expect(answer.status).toBe(200);
		expect(authorize).toHaveBeenCalledWith("Bearer dlg_x");
		await expect(answer.json()).resolves.toEqual({
			notes: [
				{
					...DRAFT,
					id: published.id,
					status: "published",
					publishedAt: NOW.toISOString(),
					createdAt: NOW.toISOString(),
					updatedAt: NOW.toISOString(),
					document: {
						frontmatter: {},
						meta: {},
						nodes: [
							[
								"callout",
								{ type: "note" },
								"Run ",
								["strong", {}, "pnpm i"],
								" first.",
							],
						],
					},
				},
			],
		});
	});

	it("keeps an edit of a published note away from the sites", async () => {
		const { db } = createFakeD1();
		const note = await createNote({ db, draft: DRAFT, now: NOW });
		await publishNotes({ db, ids: [note.id], now: NOW });
		const edit = { ...DRAFT, title: "Unfinished title", body: "# Half" };
		await updateNote({ db, id: note.id, draft: edit, now: NOW });
		const body: unknown = await (await read(db, true).response).json();
		expect(body).toEqual({
			notes: [
				expect.objectContaining({ title: DRAFT.title, body: DRAFT.body }),
			],
		});
		expect(JSON.stringify(body)).not.toContain("Unfinished");
	});

	it("answers 401 with no valid API token", async () => {
		const { db } = createFakeD1();
		const answer = await read(db, false).response;
		expect(answer.status).toBe(401);
		expect(answer.headers.get("WWW-Authenticate")).toBe("Bearer");
		await expect(answer.json()).resolves.toEqual({ error: "unauthorized" });
	});

	it("answers 405 to a method other than GET, before the check of the token", async () => {
		const { db } = createFakeD1();
		const { authorize, response } = read(db, true, "POST");
		const answer = await response;
		expect(answer.status).toBe(405);
		expect(answer.headers.get("Allow")).toBe("GET");
		expect(authorize).not.toHaveBeenCalled();
	});
});
