import { R } from "@mobily/ts-belt";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createChangesStore } from "@/lib/notes/changes-store";
import {
	addNote,
	deleteNoteOfCms,
	listChangesOfCms,
	listNotesOfCms,
	listPostsOfCms,
	markNoteOfCms,
	publishChanges,
	readNote,
	refreshChangeCount,
	saveNote,
} from "@/lib/notes/client";

const NOTE = {
	id: "n1",
	title: "Jotai recipes",
	slug: "jotai-recipes",
	language: "en",
	description: "",
	keywords: [],
	status: "draft",
	publishedAt: null,
	updatedAt: "2026-10-18T00:00:00.000Z",
	createdAt: "2026-10-18T00:00:00.000Z",
	fields: {},
	body: "# Jotai",
	published: null,
	mark: null,
};

const SUMMARY = {
	id: "n1",
	title: "Jotai recipes",
	slug: "jotai-recipes",
	language: "en",
	status: "draft",
	publishedAt: null,
	updatedAt: "2026-10-18T00:00:00.000Z",
	mark: null,
};

const DRAFT = {
	title: "Jotai recipes",
	slug: "jotai-recipes",
	language: "en",
	description: "",
	keywords: [],
	fields: {},
	body: "# Jotai",
};

function answer(response: Response | Error) {
	const fetch = vi.fn(() =>
		response instanceof Error
			? Promise.reject(response)
			: Promise.resolve(response),
	);
	vi.stubGlobal("fetch", fetch);
	return fetch;
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("the notes client", () => {
	it("lists the posts", async () => {
		answer(Response.json({ notes: [SUMMARY] }));
		await expect(listNotesOfCms()).resolves.toEqual(R.Ok([SUMMARY]));
	});

	it("reads one post", async () => {
		const fetch = answer(Response.json({ note: NOTE }));
		await expect(readNote("n 1")).resolves.toEqual(R.Ok(NOTE));
		expect(fetch).toHaveBeenCalledWith("/api/notes/n%201", undefined);
	});

	it("adds a post with its draft as JSON", async () => {
		const fetch = answer(Response.json({ note: NOTE }, { status: 201 }));
		await expect(addNote(DRAFT)).resolves.toEqual(R.Ok(NOTE));
		expect(fetch).toHaveBeenCalledWith("/api/notes", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(DRAFT),
		});
	});

	it("saves a post with PATCH", async () => {
		const fetch = answer(Response.json({ note: NOTE }));
		await expect(saveNote({ id: "n1", draft: DRAFT })).resolves.toEqual(
			R.Ok(NOTE),
		);
		expect(fetch).toHaveBeenCalledWith(
			"/api/notes/n1",
			expect.objectContaining({ method: "PATCH" }),
		);
	});

	it("deletes a post", async () => {
		const fetch = answer(new Response(null, { status: 204 }));
		await expect(deleteNoteOfCms("n1")).resolves.toEqual(R.Ok(true));
		expect(fetch).toHaveBeenCalledWith("/api/notes/n1", { method: "DELETE" });
	});

	it("marks a post, or clears its mark", async () => {
		const fetch = answer(Response.json({ note: { ...NOTE, mark: "publish" } }));
		await expect(
			markNoteOfCms({ id: "n1", action: "publish" }),
		).resolves.toEqual(R.Ok({ ...NOTE, mark: "publish" }));
		expect(fetch).toHaveBeenCalledWith("/api/notes/n1/publish", {
			method: "POST",
		});
		answer(Response.json({ note: NOTE }));
		await expect(
			markNoteOfCms({ id: "n1", action: "cancel" }),
		).resolves.toEqual(R.Ok(NOTE));
	});

	it.each([
		[Response.json({ error: "slug-taken" }, { status: 409 }), "slug-taken"],
		[
			Response.json({ error: "settings-needed" }, { status: 409 }),
			"settings-needed",
		],
		[Response.json({ error: "invalid-note" }, { status: 422 }), "invalid"],
		[Response.json({ error: "not-found" }, { status: 404 }), "not-found"],
		[Response.json({ error: "x" }, { status: 401 }), "signed-out"],
		[new Response("down", { status: 503 }), "server"],
		[new Response(null, { status: 409 }), "server"],
	])("gives the code of a refused answer", async (response, code) => {
		answer(response);
		await expect(addNote(DRAFT)).resolves.toEqual(R.Error(code));
	});

	it("gives offline for a request that does not reach the server", async () => {
		answer(new Error("network"));
		await expect(listNotesOfCms()).resolves.toEqual(R.Error("offline"));
	});

	it("gives server for an answer that the schema refuses", async () => {
		answer(Response.json({ notes: [{ id: 1 }] }));
		await expect(listNotesOfCms()).resolves.toEqual(R.Error("server"));
		answer(new Response("not json"));
		await expect(readNote("n1")).resolves.toEqual(R.Error("server"));
	});
});

describe("the changes client", () => {
	it("lists the changes and their number", async () => {
		const fetch = answer(
			Response.json({ count: 1, changes: [{ note: SUMMARY, change: "edit" }] }),
		);
		await expect(listChangesOfCms()).resolves.toEqual(
			R.Ok({ count: 1, changes: [{ note: SUMMARY, change: "edit" }] }),
		);
		expect(fetch).toHaveBeenCalledWith("/api/changes", undefined);
	});

	it("publishes the changes, and gives their number", async () => {
		const fetch = answer(Response.json({ applied: [{}, {}] }));
		await expect(publishChanges()).resolves.toEqual(R.Ok(2));
		expect(fetch).toHaveBeenCalledWith("/api/changes", { method: "POST" });
	});

	it("refuses a change of an unknown kind", async () => {
		answer(
			Response.json({ count: 1, changes: [{ note: SUMMARY, change: "x" }] }),
		);
		await expect(listChangesOfCms()).resolves.toEqual(R.Error("server"));
	});
});

describe("the posts client", () => {
	it("lists the posts, each with its change", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn((path: string) =>
				Promise.resolve(
					path === "/api/changes"
						? Response.json({
								count: 1,
								changes: [{ note: SUMMARY, change: "edit" }],
							})
						: Response.json({ notes: [SUMMARY] }),
				),
			),
		);
		await expect(listPostsOfCms()).resolves.toEqual(
			R.Ok({ posts: [{ note: SUMMARY, change: "edit" }], count: 1 }),
		);
	});

	it("fails when a list fails", async () => {
		answer(new Response(null, { status: 401 }));
		await expect(listPostsOfCms()).resolves.toEqual(R.Error("signed-out"));
	});
});

describe("refreshChangeCount", () => {
	it("gives the number of changes of the server to the store", async () => {
		answer(Response.json({ count: 2, changes: [] }));
		const changes = createChangesStore(0);
		await refreshChangeCount(changes);
		expect(changes.read()).toBe(2);
	});

	it("keeps the number when the server does not answer", async () => {
		answer(new Error("offline"));
		const changes = createChangesStore(5);
		await refreshChangeCount(changes);
		expect(changes.read()).toBe(5);
	});
});
