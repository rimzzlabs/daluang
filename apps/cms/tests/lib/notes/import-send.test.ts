import type { Note } from "@daluang/notes/note";
import { NOTE_BODY_MAX_BYTES } from "@daluang/notes/note-draft";
import { R } from "@mobily/ts-belt";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ImportedPost } from "@/lib/notes/client";
import { importRows, withRowState } from "@/lib/notes/import-run";
import { importOneFile, sendFiles } from "@/lib/notes/import-send";

const client = vi.hoisted(() => ({ importNoteOfCms: vi.fn() }));
vi.mock("@/lib/notes/client", () => client);

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

beforeEach(() => {
	client.importNoteOfCms.mockReset();
});

describe("importOneFile", () => {
	it("sends the name, the text, and the language of the import", async () => {
		client.importNoteOfCms.mockResolvedValue(R.Ok(post("publish")));
		await expect(
			importOneFile({ file: file("a.mdx"), language: "id" }),
		).resolves.toEqual({ status: "imported", post: post("publish") });
		expect(client.importNoteOfCms).toHaveBeenCalledWith({
			fileName: "a.mdx",
			language: "id",
			text: "---\ntitle: a.mdx\n---\n",
		});
	});

	it("skips a file whose slug is taken, and keeps each other failure", async () => {
		client.importNoteOfCms.mockResolvedValueOnce(
			R.Error({ code: "slug-taken" }),
		);
		await expect(
			importOneFile({ file: file("a.md"), language: "en" }),
		).resolves.toEqual({ status: "skipped" });
		const failure = { code: "invalid-note", issues: [] };
		client.importNoteOfCms.mockResolvedValueOnce(R.Error(failure));
		await expect(
			importOneFile({ file: file("a.md"), language: "en" }),
		).resolves.toEqual({ status: "failed", failure });
	});

	it("does not send a file above the limit of a post", async () => {
		const large = new File(["a".repeat(NOTE_BODY_MAX_BYTES + 1)], "big.md");
		await expect(
			importOneFile({ file: large, language: "en" }),
		).resolves.toEqual({ status: "failed", failure: { code: "too-large" } });
		expect(client.importNoteOfCms).not.toHaveBeenCalled();
	});

	it("gives file-not-read when the browser cannot read the file", async () => {
		const broken = file("a.md");
		vi.spyOn(broken, "text").mockRejectedValue(new Error("NotReadableError"));
		await expect(
			importOneFile({ file: broken, language: "en" }),
		).resolves.toEqual({
			status: "failed",
			failure: { code: "file-not-read" },
		});
	});
});

describe("sendFiles", () => {
	it("sends one file at a time, and gives each change of a row", async () => {
		const events: string[] = [];
		client.importNoteOfCms.mockImplementation(async (sent) => {
			events.push(`send ${sent.fileName}`);
			await Promise.resolve();
			events.push(`answer ${sent.fileName}`);
			return R.Ok(post(null));
		});
		const stop = await sendFiles({
			rows: importRows([file("b.md"), file("a.md")]),
			language: "en",
			onRow: (change) => events.push(`${change.index} ${change.state.status}`),
			shouldContinue: () => true,
		});
		expect(stop).toBeNull();
		expect(events).toEqual([
			"0 importing",
			"send a.md",
			"answer a.md",
			"0 imported",
			"1 importing",
			"send b.md",
			"answer b.md",
			"1 imported",
		]);
	});

	it("stops at a failure that each next file gets also", async () => {
		client.importNoteOfCms.mockResolvedValue(R.Error({ code: "signed-out" }));
		const onRow = vi.fn();
		const stop = await sendFiles({
			rows: importRows([file("a.md"), file("b.md")]),
			language: "en",
			onRow,
			shouldContinue: () => true,
		});
		expect(stop).toEqual({ code: "signed-out" });
		expect(client.importNoteOfCms).toHaveBeenCalledOnce();
		expect(onRow).toHaveBeenLastCalledWith({
			index: 0,
			state: { status: "failed", failure: { code: "signed-out" } },
		});
	});

	it("skips a row that is not to send", async () => {
		const rows = withRowState(importRows([file("a.md")]), {
			index: 0,
			state: { status: "skipped" },
		});
		await sendFiles({
			rows,
			language: "en",
			onRow: vi.fn(),
			shouldContinue: () => true,
		});
		expect(client.importNoteOfCms).not.toHaveBeenCalled();
	});

	it("sends no more files when the run must not continue", async () => {
		client.importNoteOfCms.mockResolvedValue(R.Ok(post(null)));
		let alive = true;
		const stop = await sendFiles({
			rows: importRows([file("a.md"), file("b.md")]),
			language: "en",
			onRow: (change) => {
				if (change.state.status === "imported") alive = false;
			},
			shouldContinue: () => alive,
		});
		expect(stop).toBeNull();
		expect(client.importNoteOfCms).toHaveBeenCalledOnce();
	});
});
