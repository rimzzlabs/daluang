import { O } from "@mobily/ts-belt";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { CHANGES_API_PATH } from "../src/change";
import { handleChangesRequest } from "../src/changes";
import type { NoteDraft } from "../src/note";
import { createNote, findNote, markNote } from "../src/store";
import { createFakeD1 } from "./fake-d1";

const NOW = new Date("2026-10-18T00:00:00.000Z");

const DRAFT: NoteDraft = {
	title: "Jotai recipes",
	slug: "jotai-recipes",
	language: "en",
	description: "",
	keywords: [],
	fields: {},
	body: "# Jotai",
};

function call(db: D1Database, method: string) {
	const notify = vi.fn((_event: "publish") => Promise.resolve());
	const response = handleChangesRequest({
		request: new Request(`http://localhost:4321${CHANGES_API_PATH}`, {
			method,
		}),
		db,
		now: () => NOW,
		notify,
	});
	return { notify, response };
}

describe("handleChangesRequest", () => {
	it("gives the number of changes and each change", async () => {
		const { db } = createFakeD1();
		const note = await createNote({ db, draft: DRAFT, now: NOW });
		await markNote({ db, id: note.id, mark: "publish" });
		const answer = await call(db, "GET").response;
		await expect(answer.json()).resolves.toEqual({
			count: 1,
			changes: [
				{ note: expect.objectContaining({ id: note.id }), change: "publish" },
			],
		});
	});

	it("applies each change, and tells each site one time", async () => {
		const { db } = createFakeD1();
		const first = await createNote({ db, draft: DRAFT, now: NOW });
		const second = await createNote({
			db,
			draft: { ...DRAFT, slug: "jotai-state" },
			now: NOW,
		});
		await markNote({ db, id: first.id, mark: "publish" });
		await markNote({ db, id: second.id, mark: "publish" });
		const { notify, response } = call(db, "POST");
		const answer = await response;
		expect(answer.status).toBe(200);
		const body = z
			.object({ applied: z.array(z.unknown()) })
			.parse(await answer.json());
		expect(body.applied).toHaveLength(2);
		expect(notify.mock.calls).toEqual([["publish"]]);
		const published = O.getExn(await findNote({ db, id: first.id }));
		expect(published.status).toBe("published");
		expect((await call(db, "GET").response).status).toBe(200);
	});

	it("sends no event when no change waits", async () => {
		const { db } = createFakeD1();
		const { notify, response } = call(db, "POST");
		await expect((await response).json()).resolves.toEqual({ applied: [] });
		expect(notify).not.toHaveBeenCalled();
	});

	it("answers 405 to another method", async () => {
		const { db } = createFakeD1();
		const answer = await call(db, "DELETE").response;
		expect(answer.status).toBe(405);
		expect(answer.headers.get("Allow")).toBe("GET, POST");
	});
});
