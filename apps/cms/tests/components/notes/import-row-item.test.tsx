// @vitest-environment jsdom
import type { Note } from "@daluang/notes/note";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ImportRowItem } from "@/components/notes/import-row-item";
import type { RowState } from "@/lib/notes/import-run";

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

const FIELDS = [
	{ name: "series", label: "Series", type: "text", required: false },
] as const;

function renderRow(state: RowState) {
	render(
		<ul>
			<ImportRowItem
				row={{ file: new File([""], "a.mdx"), state }}
				fields={FIELDS}
			/>
		</ul>,
	);
}

function lines() {
	return screen
		.queryAllByRole("listitem")
		.slice(1)
		.map((item) => item.textContent);
}

describe("ImportRowItem", () => {
	it.each([
		[{ status: "waiting" }, "Not sent yet"],
		[{ status: "importing" }, "In progress"],
		[{ status: "imported", post: { note: NOTE, warnings: [] } }, "Draft"],
	] as const)("shows the name of the file and its state", (state, label) => {
		renderRow(state);
		expect(screen.getByText("a.mdx")).toBeTruthy();
		expect(screen.getByText(label)).toBeTruthy();
		expect(lines()).toEqual([]);
	});

	it("shows the mark of a post, and each warning of its file", () => {
		renderRow({
			status: "imported",
			post: {
				note: { ...NOTE, mark: "publish" },
				warnings: [
					{ code: "date-not-read", name: "updatedAt" },
					{ code: "component-kept", name: "NoteImage", count: 2 },
				],
			},
		});
		expect(screen.getByText("To publish")).toBeTruthy();
		expect(
			screen.getByText("Check the post before you publish it."),
		).toBeTruthy();
		expect(lines()).toEqual([
			'The import cannot read "updatedAt", so the post has no such date. Correct the file, delete the post, and import the file again.',
			"The component NoteImage stays as it is (2 uses). Change it by hand.",
		]);
	});

	it("tells why the import skipped a file", () => {
		renderRow({ status: "skipped" });
		expect(screen.getByText("Skipped")).toBeTruthy();
		expect(
			screen.getByText("A post with this slug is in this language already."),
		).toBeTruthy();
	});

	it("shows each issue of a refused draft one time, with the label of its field", () => {
		renderRow({
			status: "failed",
			failure: {
				code: "invalid-note",
				issues: [
					{ path: "fields.series", message: "Series needs a text." },
					{ path: "keywords.0", message: "Keep each keyword short." },
					{ path: "keywords.1", message: "Keep each keyword short." },
				],
			},
		});
		expect(screen.getByText("Failed")).toBeTruthy();
		expect(lines()).toEqual([
			"Series: Series needs a text.",
			"Keywords: Keep each keyword short.",
		]);
	});
});
