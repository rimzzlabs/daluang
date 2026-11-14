import { R } from "@mobily/ts-belt";
import { parseMarkdown } from "comark";
import { describe, expect, it } from "vitest";
import { type ImportedNote, importedNote } from "../src/note-import";

const REAL = `---
title: "Jotai Recipes I Commonly Use for My Project"
description: "Derived atoms"
publishedAt: "09/30/2023"
updatedAt: "10/16/2026"
status: "published"
language: id
featured: true
author: rimzzlabs
keywords:
  - react
  - jotai
relatedPosts:
  - jotai-state-manager
---

import NoteImage from "@/components/notes/note-image.astro";

<Callout type="note">
  **In short:** use atoms.
</Callout>

Text <NoteImage src="a.png" /> and <NoteImage src="b.png" />.
`;

function run(text: string, fileName = "My Post.mdx") {
	return importedNote({ fileName, text, language: "en" });
}

async function ok(text: string, fileName?: string): Promise<ImportedNote> {
	const result = await run(text, fileName);
	if (R.isError(result)) throw new Error("expected Ok");
	return R.getExn(result);
}

function file(lines: string, body = "Text\n"): string {
	return `---\ntitle: A\n${lines}\n---\n${body}`;
}

describe("importedNote", () => {
	it("reads a real-shaped file", async () => {
		expect(await ok(REAL, "en/jotai-recipes.mdx")).toEqual({
			draft: {
				title: "Jotai Recipes I Commonly Use for My Project",
				slug: "jotai-recipes",
				language: "en",
				description: "Derived atoms",
				keywords: ["react", "jotai"],
				fields: {
					featured: true,
					author: "rimzzlabs",
					relatedPosts: ["jotai-state-manager"],
				},
				body: '::callout{type="note"}\n**In short:** use atoms.\n::\n\nText <NoteImage src="a.png" /> and <NoteImage src="b.png" />.\n',
			},
			publishedAt: "2023-09-30T00:00:00.000Z",
			updatedAt: "2026-10-16T00:00:00.000Z",
			wantsPublish: true,
			warnings: [{ code: "component-kept", name: "NoteImage", count: 2 }],
		});
	});

	it.each([
		[
			"YAML that does not parse",
			"---\ntitle: A\nb: [1\n---\n",
			"frontmatter-not-read",
		],
		["a YAML text", "---\ntitle\n---\n", "frontmatter-not-read"],
		["no frontmatter", "# A\n", "no-title"],
		["an empty title", "---\ntitle: '  '\n---\n", "no-title"],
		["a list title", "---\ntitle: [a]\n---\n", "no-title"],
		["a boolean title", "---\ntitle: true\n---\n", "no-title"],
		["a null title", "---\ntitle: null\n---\n", "no-title"],
	])("gives an error for %s", async (_name, text, error) => {
		expect(await run(text)).toEqual(R.Error(error));
	});

	it.each([
		["x.md", 'slug: "own-slug"', "own-slug"],
		["x.md", 'slug: "Own Slug!"', "own-slug"],
		["x.md", "slug: 2024", "2024"],
		["en/My Great Post.MDX", "", "my-great-post"],
		["a\\b\\Café.md", "slug: '  '", "cafe"],
		["???.md", 'slug: "!!!"', "a"],
		["???.md", "title: '!!!'", "untitled"],
		["日本語.md", "title: 日本語", "untitled"],
	])("makes the slug of %s with %j", async (fileName, line, slug) => {
		const text = line.startsWith("title") ? `---\n${line}\n---\n` : file(line);
		expect((await ok(text, fileName)).draft.slug).toBe(slug);
	});

	it("reads a number as the text of the title, the slug, and the description", async () => {
		const note = await ok("---\ntitle: 2024\nslug: 7\ndescription: 1.5\n---\n");
		expect(note.draft).toMatchObject({
			title: "2024",
			slug: "7",
			description: "1.5",
		});
		expect(note.warnings).toEqual([]);
	});

	it("does not use a core value of another kind, and ignores the language keys", async () => {
		const lines =
			"description: [a]\nslug: {a: 1}\nstatus: true\nkeywords: a, 5\nlang: id\nlanguage: id";
		const note = await ok(file(lines), "file.md");
		expect(note.draft).toMatchObject({
			slug: "file",
			language: "en",
			description: "",
			keywords: ["a", "5"],
			fields: {},
		});
		expect(note.wantsPublish).toBe(false);
		expect(note.warnings).toEqual(
			["slug", "description", "status"].map((name) => ({
				code: "field-left-out",
				name,
			})),
		);
	});

	it.each([
		["", null, null, []],
		["publishedAt: null\nupdatedAt: null", null, null, []],
		["publishedAt: 2023-09-30", "2023-09-30", "2023-09-30", []],
		[
			"publishedAt: 2024-01-01\nupdatedAt: 2023-01-01",
			"2024-01-01",
			"2023-01-01",
			[],
		],
		[
			"publishedAt: 02/30/2023\nupdatedAt: 2024-01-01",
			null,
			"2024-01-01",
			["publishedAt"],
		],
		[
			"publishedAt: 2023-09-30\nupdatedAt: soon",
			"2023-09-30",
			"2023-09-30",
			["updatedAt"],
		],
		["updatedAt: 2024-01-01T10:00:00", null, null, ["updatedAt"]],
	])("reads the dates of %j", async (lines, published, updated, lost) => {
		const note = await ok(file(lines));
		const iso = (day: string | null) => (day ? `${day}T00:00:00.000Z` : null);
		expect(note.publishedAt).toBe(iso(published));
		expect(note.updatedAt).toBe(iso(updated));
		expect(note.warnings).toEqual(
			lost.map((name) => ({ code: "date-not-read", name })),
		);
	});

	it.each([
		["published", true],
		[" Published ", true],
		["draft", false],
		["5", false],
	])("reads the status %j", async (status, wants) => {
		expect((await ok(file(`status: "${status}"`))).wantsPublish).toBe(wants);
	});

	it("gives the warnings in a fixed order", async () => {
		const lines = "bad-name: x\nupdatedAt: no\nslug: [a]\npublishedAt: no";
		const body = "<B x={1} />\n\n<A x={1} />\n\n<B x={2} />\n";
		expect((await ok(file(lines, body))).warnings).toEqual([
			{ code: "date-not-read", name: "publishedAt" },
			{ code: "date-not-read", name: "updatedAt" },
			{ code: "field-left-out", name: "slug" },
			{ code: "field-left-out", name: "bad-name" },
			{ code: "component-kept", name: "B", count: 2 },
			{ code: "component-kept", name: "A", count: 1 },
		]);
	});

	it.each([
		["---\ntitle: A\n---\n\n---\n\nIntro\n", "\n---\n\nIntro\n"],
		[
			'---\ntitle: A\n---\nimport A from "a";\n\n---\n\nIntro\n',
			"\n---\n\nIntro\n",
		],
		["\uFEFF---\r\ntitle: A\r\n---\r\n\r\n---\r\nIntro\r\n", "\n---\nIntro\n"],
	])(
		"keeps one empty line before a --- at the start of %j",
		async (text, body) => {
			const note = await ok(text);
			expect(note.draft.body).toBe(body);
			const document = await parseMarkdown(note.draft.body);
			expect(document.frontmatter).toEqual({});
			expect(document.nodes).toEqual([
				["hr", {}],
				["p", {}, "Intro"],
			]);
		},
	);
});
