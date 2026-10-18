// @vitest-environment jsdom
import { R } from "@mobily/ts-belt";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewPost } from "@/components/notes/new-post";
import { settingsStore } from "../../settings";
import { typeInEditor } from "./editor";

const client = vi.hoisted(() => ({
	addNote: vi.fn(),
	NOTES_ERROR_MESSAGES: { "slug-taken": "Slug taken." },
}));

vi.mock("@/lib/notes/client", () => client);

beforeEach(() => {
	client.addNote.mockReset();
});

function renderNewPost(onSaved = vi.fn()) {
	render(
		<NewPost settings={settingsStore()} linkKind="anchor" onSaved={onSaved} />,
	);
	return onSaved;
}

describe("NewPost", () => {
	it("adds the post as a draft, then opens the list", async () => {
		client.addNote.mockResolvedValue(R.Ok({}));
		const onSaved = renderNewPost();
		await userEvent.type(
			screen.getByRole("textbox", { name: "Title" }),
			"Jotai recipes",
		);
		await typeInEditor("Body", "# Hi");
		await userEvent.click(screen.getByRole("button", { name: "Save draft" }));
		expect(client.addNote).toHaveBeenCalledWith({
			title: "Jotai recipes",
			slug: "jotai-recipes",
			language: "en",
			description: "",
			keywords: [],
			fields: {},
			body: "# Hi",
		});
		expect(onSaved).toHaveBeenCalledOnce();
	});

	it("shows the error of each value, and sends nothing", async () => {
		renderNewPost();
		await userEvent.click(screen.getByRole("button", { name: "Save draft" }));
		expect(screen.getByText("Give the post a title.")).toBeTruthy();
		expect(client.addNote).not.toHaveBeenCalled();
	});

	it("shows the message of a refused save, and stays", async () => {
		client.addNote.mockResolvedValue(R.Error("slug-taken"));
		const onSaved = renderNewPost();
		await userEvent.type(
			screen.getByRole("textbox", { name: "Title" }),
			"Jotai",
		);
		await userEvent.click(screen.getByRole("button", { name: "Save draft" }));
		expect((await screen.findByRole("alert")).textContent).toBe("Slug taken.");
		expect(onSaved).not.toHaveBeenCalled();
	});

	it("links Cancel to the list of posts", () => {
		renderNewPost();
		expect(
			screen.getByRole("link", { name: "Cancel" }).getAttribute("href"),
		).toBe("/posts");
	});
});
