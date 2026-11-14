import { describe, expect, it } from "vitest";
import {
	importFailureMessage,
	importIssueMessages,
	importWarningMessage,
} from "@/lib/notes/import-messages";

describe("importWarningMessage", () => {
	it("names a component that stays, with the number of its uses", () => {
		expect(
			importWarningMessage({
				code: "component-kept",
				name: "NoteImage",
				count: 11,
			}),
		).toBe(
			"The component NoteImage stays as it is (11 uses). Change it by hand.",
		);
		expect(
			importWarningMessage({ code: "component-kept", name: "Kbd", count: 1 }),
		).toBe("The component Kbd stays as it is (1 use). Change it by hand.");
	});

	it("names a key that the import left out", () => {
		expect(
			importWarningMessage({ code: "field-left-out", name: "cover" }),
		).toBe(
			'The import left out the key "cover". If the post needs the value, add it by hand.',
		);
	});

	it("names a date that the import cannot read, and what to do", () => {
		expect(
			importWarningMessage({ code: "date-not-read", name: "publishedAt" }),
		).toBe(
			'The import cannot read "publishedAt", so the post has no such date. Correct the file, delete the post, and import the file again.',
		);
	});
});

describe("importFailureMessage", () => {
	it.each([
		["slug-taken", "A post with this slug is in this language already."],
		["no-title", 'The frontmatter has no title. Add the key "title".'],
		[
			"frontmatter-not-read",
			"Daluang cannot read the frontmatter. Correct the YAML.",
		],
		[
			"too-large",
			"The file is too large to send. The limit of a post is 1 MB.",
		],
		[
			"file-not-read",
			"Daluang cannot read the file. Select Done, open Import again, and choose the file.",
		],
		[
			"offline",
			"Daluang cannot reach the server. Check your connection, then select Import to continue.",
		],
		[
			"signed-out",
			"Your session ended. Sign in again in another tab, then select Import to continue.",
		],
		[
			"settings-needed",
			"Choose the languages of the CMS first. Open Settings, then Languages.",
		],
		[
			"server",
			"The server cannot import the file. Select Import to try again.",
		],
	] as const)("gives the message of %s", (code, message) => {
		expect(importFailureMessage({ code })).toBe(message);
	});

	it("tells the writer to correct each value of a refused draft", () => {
		expect(importFailureMessage({ code: "invalid-note", issues: [] })).toBe(
			"Daluang cannot keep a value of the file. Correct each value in this list.",
		);
	});
});

describe("importIssueMessages", () => {
	it("puts the label of the input before the message of each issue", () => {
		const fields = [
			{ name: "series", label: "Series", type: "text", required: false },
		] as const;
		expect(
			importIssueMessages(
				[
					{ path: "title", message: "Give the post a title." },
					{ path: "fields.series", message: "Series needs a text." },
					{ path: "", message: "The draft is not valid." },
				],
				fields,
			),
		).toEqual([
			"Title: Give the post a title.",
			"Series: Series needs a text.",
			"The draft is not valid.",
		]);
	});
});
