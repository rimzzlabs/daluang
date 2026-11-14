import type { Note } from "@daluang/notes/note";
import { describe, expect, it } from "vitest";
import type { ImportedPost } from "@/lib/notes/client";
import {
	finishedCount,
	type ImportRow,
	importRows,
	importSummary,
	importSummaryText,
	isToSend,
	withRowState,
} from "@/lib/notes/import-run";

const NOTE: Note = {
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
	body: "",
	published: null,
	mark: null,
};

function post(mark: "publish" | null): ImportedPost {
	return { note: { ...NOTE, mark }, warnings: [] };
}

function file(name: string) {
	return new File([`---\ntitle: ${name}\n---\n`], name);
}

describe("importRows", () => {
	it("gives one waiting row for each file, in the order of the names", () => {
		const rows = importRows([file("b.mdx"), file("a.mdx")]);
		expect(rows.map((row) => row.file.name)).toEqual(["a.mdx", "b.mdx"]);
		expect(rows.map((row) => row.state.status)).toEqual(["waiting", "waiting"]);
	});

	it("reads a number in a name as a number, and ignores capitals", () => {
		const rows = importRows([file("a10.md"), file("B.md"), file("a2.md")]);
		expect(rows.map((row) => row.file.name)).toEqual([
			"a2.md",
			"a10.md",
			"B.md",
		]);
	});
});

describe("isToSend", () => {
	const row = (state: ImportRow["state"]) => ({ file: file("a.md"), state });

	it("sends a waiting row and a failure that a retry can help", () => {
		expect(isToSend(row({ status: "waiting" }))).toBe(true);
		expect(
			isToSend(row({ status: "failed", failure: { code: "offline" } })),
		).toBe(true);
		expect(
			isToSend(row({ status: "failed", failure: { code: "server" } })),
		).toBe(true);
	});

	it("does not send an imported, a skipped, a refused, or an unread file again", () => {
		expect(isToSend(row({ status: "imported", post: post(null) }))).toBe(false);
		expect(isToSend(row({ status: "skipped" }))).toBe(false);
		expect(
			isToSend(row({ status: "failed", failure: { code: "no-title" } })),
		).toBe(false);
		expect(
			isToSend(row({ status: "failed", failure: { code: "file-not-read" } })),
		).toBe(false);
	});
});

describe("importSummary", () => {
	it("counts the files of each state, and the posts with the mark", () => {
		const rows = withRowState(
			importRows([file("a"), file("b"), file("c"), file("d"), file("e")]),
			{ index: 0, state: { status: "imported", post: post("publish") } },
		);
		const done = [
			{ index: 1, state: { status: "imported", post: post(null) } },
			{ index: 2, state: { status: "skipped" } },
			{ index: 3, state: { status: "failed", failure: { code: "no-title" } } },
		] as const;
		const shown = done.reduce(
			(list, change) => withRowState(list, change),
			rows,
		);
		const summary = importSummary(shown);
		expect(finishedCount(shown)).toBe(4);
		expect(
			finishedCount(
				withRowState(shown, {
					index: 4,
					state: { status: "failed", failure: { code: "offline" } },
				}),
			),
		).toBe(4);
		expect(summary).toEqual({
			imported: 2,
			toPublish: 1,
			skipped: 1,
			failed: 1,
			waiting: 1,
		});
		expect(importSummaryText(summary)).toBe(
			"2 imported, 1 skipped, 1 failed, 1 not imported yet. 1 with the mark To publish.",
		);
		expect(importSummaryText({ ...summary, waiting: 0 })).toBe(
			"2 imported, 1 skipped, 1 failed. 1 with the mark To publish.",
		);
	});
});
