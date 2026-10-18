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
import { PostForm } from "@/components/notes/post-form";

const FIELDS: readonly FieldDefinition[] = [
	{ name: "featured", label: "Featured", type: "boolean", required: false },
];

const RULES = {
	languages: { languages: ["en", "id"], defaultLanguage: "en" },
	fields: FIELDS,
};

let last: NoteForm = emptyNoteForm(RULES);

function Harness(props: {
	errors?: NoteFormErrors;
	languages?: readonly string[];
}) {
	const [form, setForm] = useState(emptyNoteForm(RULES));
	last = form;
	return (
		<PostForm
			value={form}
			errors={props.errors ?? {}}
			languages={props.languages ?? ["en", "id"]}
			definitions={FIELDS}
			onChange={setForm}
		/>
	);
}

describe("PostForm", () => {
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
		await userEvent.type(
			screen.getByRole("textbox", { name: "Body" }),
			"# Hai",
		);
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
					language: "Choose a language of this CMS.",
				}}
			/>,
		);
		expect(
			screen
				.getByRole("textbox", { name: "Title" })
				.getAttribute("aria-invalid"),
		).toBe("true");
		expect(screen.getByText("Give the post a title.")).toBeTruthy();
		expect(screen.getByText("Choose a language of this CMS.")).toBeTruthy();
	});

	it("has no language choice in a CMS with one language", () => {
		render(<Harness languages={["en"]} />);
		expect(screen.queryByRole("group", { name: "Language" })).toBeNull();
		expect(screen.queryByRole("button", { name: "English" })).toBeNull();
	});
});
