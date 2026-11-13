// @vitest-environment jsdom
import type { FieldDefinition } from "@daluang/notes/field-definitions";
import {
	emptyNoteForm,
	type NoteForm,
	type NoteFormErrors,
} from "@daluang/notes/note-form";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { PostBodyField, PostDetailsFields } from "@/components/notes/post-form";
import { typeInEditor } from "./editor";

const FIELDS: readonly FieldDefinition[] = [
	{ name: "featured", label: "Featured", type: "boolean", required: false },
];

const RULES = {
	languages: { languages: ["en", "id"], defaultLanguage: "en" },
	fields: FIELDS,
};

// The preview loads the parser of Comark with a lazy import. On a busy computer, as in the
// pre-push hook, the first load takes more than the 1 s of `findByRole`.
const LAZY_PREVIEW = { timeout: 10_000 };

const LOST_LANGUAGE =
	"This language is not in the settings of the CMS. Choose another language.";

let last: NoteForm = emptyNoteForm(RULES);

function Harness(props: {
	errors?: NoteFormErrors;
	languages?: readonly string[];
	language?: string;
}) {
	const [form, setForm] = useState({
		...emptyNoteForm(RULES),
		language: props.language ?? "en",
	});
	last = form;
	const fieldProps = {
		value: form,
		errors: props.errors ?? {},
		languages: props.languages ?? ["en", "id"],
		definitions: FIELDS,
		onChange: setForm,
	};
	return (
		<>
			<PostDetailsFields {...fieldProps} />
			<PostBodyField {...fieldProps} />
		</>
	);
}

describe("PostDetailsFields and PostBodyField", () => {
	it("makes the slug from the title, and keeps each value", async () => {
		render(<Harness />);
		await userEvent.type(
			screen.getByRole("textbox", { name: "Title" }),
			"Resep Jotai",
		);
		expect(screen.getByRole("textbox", { name: "Slug" })).toHaveProperty(
			"value",
			"resep-jotai",
		);
		expect(
			screen.getByText(/It follows the title until you change it/),
		).toBeTruthy();
		await userEvent.click(screen.getByRole("button", { name: "Indonesia" }));
		await userEvent.type(
			screen.getByRole("textbox", { name: "Description (optional)" }),
			"Kecil.",
		);
		await userEvent.type(
			screen.getByRole("textbox", { name: "Keywords (optional)" }),
			"react",
		);
		await userEvent.click(screen.getByRole("checkbox", { name: "Featured" }));
		await typeInEditor("Body", "# Hai");
		expect(last).toEqual({
			...emptyNoteForm(RULES),
			title: "Resep Jotai",
			slug: "resep-jotai",
			language: "id",
			description: "Kecil.",
			keywords: "react",
			fields: { featured: true },
			body: "# Hai",
		});
	});

	it("keeps a typed slug, and keeps the language on a click on the chosen one", async () => {
		render(<Harness />);
		await userEvent.type(
			screen.getByRole("textbox", { name: "Slug" }),
			"jotai",
		);
		await userEvent.type(
			screen.getByRole("textbox", { name: "Title" }),
			"Other",
		);
		await userEvent.click(screen.getByRole("button", { name: "English" }));
		expect(last.slug).toBe("jotai");
		expect(
			screen.getByText("The last part of the address of the post."),
		).toBeTruthy();
		expect(last.language).toBe("en");
	});

	it("shows the error of each value", () => {
		render(
			<Harness
				errors={{
					title: "Give the post a title.",
					language:
						"This language is not in the settings of the CMS. Choose another language.",
				}}
			/>,
		);
		expect(
			screen
				.getByRole("textbox", { name: "Title" })
				.getAttribute("aria-invalid"),
		).toBe("true");
		expect(screen.getByText("Give the post a title.")).toBeTruthy();
		expect(
			screen.getByText(
				"This language is not in the settings of the CMS. Choose another language.",
			),
		).toBeTruthy();
	});

	it("has no language choice in a CMS with one language", () => {
		render(<Harness languages={["en"]} />);
		expect(screen.queryByRole("group", { name: "Language" })).toBeNull();
		expect(screen.queryByRole("button", { name: "English" })).toBeNull();
	});

	it("has no language choice for a post in the only language of the CMS", () => {
		render(<Harness languages={["en"]} language="en" />);
		expect(screen.queryByRole("group", { name: "Language" })).toBeNull();
	});

	it("shows the language of a post that the CMS lost, with its error", async () => {
		render(
			<Harness
				languages={["en"]}
				language="id"
				errors={{ language: LOST_LANGUAGE }}
			/>,
		);
		const indonesian = screen.getByRole("button", { name: "Indonesia" });
		expect(indonesian.getAttribute("aria-pressed")).toBe("true");
		expect(screen.getByText(LOST_LANGUAGE)).toBeTruthy();
		await userEvent.click(screen.getByRole("button", { name: "English" }));
		expect(last.language).toBe("en");
	});

	it("shows the error of a keyword at the keywords input", () => {
		render(
			<Harness
				errors={{ keywords: "Keep each keyword at 60 characters or fewer." }}
			/>,
		);
		const keywords = screen.getByRole("textbox", {
			name: "Keywords (optional)",
		});
		expect(keywords.getAttribute("aria-invalid")).toBe("true");
		expect(
			screen.getByText("Keep each keyword at 60 characters or fewer."),
		).toBeTruthy();
	});

	it("shows the message of an error that no input shows", () => {
		render(<Harness errors={{ "fields.mood": "Mood is not a field name." }} />);
		expect(screen.getByRole("alert").textContent).toBe(
			"mood: Mood is not a field name.",
		);
	});

	it("shows the preview of the body, and keeps the editor", async () => {
		render(<Harness />);
		await typeInEditor("Body", "# Resep");
		await userEvent.click(screen.getByRole("button", { name: "Preview" }));
		expect(
			await screen.findByRole(
				"heading",
				{ level: 1, name: "Resep" },
				LAZY_PREVIEW,
			),
		).toBeTruthy();
		await userEvent.click(screen.getByRole("button", { name: "Write" }));
		expect(screen.getByRole("textbox", { name: "Body" }).textContent).toBe(
			"# Resep",
		);
	});

	it("shows the text and the preview together in Split", async () => {
		render(<Harness />);
		await typeInEditor("Body", "# Resep");
		await userEvent.click(screen.getByRole("button", { name: "Split" }));
		expect(
			await screen.findByRole(
				"heading",
				{ level: 1, name: "Resep" },
				LAZY_PREVIEW,
			),
		).toBeTruthy();
		expect(screen.getByRole("textbox", { name: "Body" })).toBeTruthy();
		await userEvent.click(screen.getByRole("button", { name: "Split" }));
		expect(
			screen
				.getByRole("button", { name: "Split" })
				.getAttribute("aria-pressed"),
		).toBe("true");
	});
});
