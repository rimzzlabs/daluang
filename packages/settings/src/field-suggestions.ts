import type { FieldDefinition } from "@daluang/notes/field-definitions";

/** The extra fields that many sites read. The Fields page adds one with one click. */
export const FIELD_SUGGESTIONS: readonly FieldDefinition[] = [
	{ name: "featured", label: "Featured", type: "boolean", required: false },
	{ name: "author", label: "Author", type: "text", required: false },
	{ name: "tags", label: "Tags", type: "list", required: false },
	{
		name: "relatedPosts",
		label: "Related posts",
		type: "list",
		required: false,
	},
	{ name: "series", label: "Series", type: "text", required: false },
];
