import { R } from "@mobily/ts-belt";
import { describe, expect, it } from "vitest";
import {
	type FieldDraft,
	fieldDrafts,
	newFieldDraft,
	openSuggestions,
	parseFieldDrafts,
	relabelField,
	renameField,
} from "../src/field-drafts";
import { FIELD_SUGGESTIONS } from "../src/field-suggestions";

const FEATURED = {
	name: "featured",
	label: "Featured",
	type: "boolean",
	required: true,
} as const;

function draft(change: Partial<FieldDraft> = {}): FieldDraft {
	return { ...newFieldDraft(FEATURED), ...change };
}

describe("fieldDrafts", () => {
	it("gives each stored field a key, with the name as typed", () => {
		const [first] = fieldDrafts([FEATURED]);
		expect(first).toEqual({
			...FEATURED,
			key: expect.any(String),
			nameEdited: true,
		});
	});
});

describe("newFieldDraft", () => {
	it("gives an empty text field whose name follows the label", () => {
		expect(newFieldDraft()).toEqual({
			key: expect.any(String),
			name: "",
			label: "",
			type: "text",
			required: false,
			nameEdited: false,
		});
	});

	it("gives a new key each time", () => {
		expect(newFieldDraft().key).not.toBe(newFieldDraft().key);
	});
});

describe("relabelField and renameField", () => {
	it("makes the name from the label until the writer types a name", () => {
		const empty = newFieldDraft();
		const labeled = relabelField(empty, "Related posts");
		expect(labeled.name).toBe("relatedPosts");
		const renamed = renameField(labeled, "related");
		expect(relabelField(renamed, "Other").name).toBe("related");
	});
});

describe("parseFieldDrafts", () => {
	it("gives the fields with no key", () => {
		expect(parseFieldDrafts([draft()])).toEqual(R.Ok([FEATURED]));
	});

	it("gives each error at the row of the field, one message for each input", () => {
		const first = draft();
		const second = draft({ label: " ", name: "title" });
		const third = draft();
		expect(parseFieldDrafts([first, second, third])).toEqual(
			R.Error({
				rows: {
					[second.key]: {
						label: "Give the field a label.",
						name: "Each post has this core field. Give the field a different name.",
					},
					[third.key]: {
						name: "Another field has this name. Give each field its own name.",
					},
				},
			}),
		);
	});

	it("gives an error of the list for too many fields", () => {
		const drafts = Array.from({ length: 31 }, (_, index) =>
			draft({ name: `field${index}` }),
		);
		expect(parseFieldDrafts(drafts)).toEqual(
			R.Error({ rows: {}, list: "A site can have 30 fields or fewer." }),
		);
	});
});

describe("openSuggestions", () => {
	it("gives the suggestions that the list does not have", () => {
		const open = openSuggestions({
			suggestions: FIELD_SUGGESTIONS,
			drafts: [draft()],
		});
		expect(open.map((suggestion) => suggestion.name)).toEqual([
			"author",
			"tags",
			"relatedPosts",
			"series",
		]);
	});
});
