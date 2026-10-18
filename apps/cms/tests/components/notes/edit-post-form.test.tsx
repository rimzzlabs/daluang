// @vitest-environment jsdom
import type { Note } from "@daluang/notes/note";
import { R } from "@mobily/ts-belt";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EditPostForm } from "@/components/notes/edit-post-form";
import { createChangesStore } from "@/lib/notes/changes-store";
import { settingsStore } from "../../settings";

const client = vi.hoisted(() => ({
	saveNote: vi.fn(),
	refreshChangeCount: vi.fn(),
	NOTES_ERROR_MESSAGES: { offline: "Offline." },
}));

vi.mock("@/lib/notes/client", () => client);

const NOTE: Note = {
	id: "n1",
	title: "Jotai recipes",
	slug: "jotai",
	language: "en",
	description: "",
	keywords: ["react"],
	status: "published",
	publishedAt: "2026-10-18T12:00:00.000Z",
	updatedAt: "2026-10-18T12:00:00.000Z",
	createdAt: "2026-10-18T12:00:00.000Z",
	fields: {},
	body: "# Jotai",
	published: null,
	mark: null,
};

beforeEach(() => {
	client.saveNote.mockReset();
	client.refreshChangeCount.mockReset();
});

function renderForm(onSaved = vi.fn()) {
	const changes = createChangesStore(0);
	render(
		<EditPostForm
			note={NOTE}
			settings={settingsStore()}
			changes={changes}
			linkKind="anchor"
			onSaved={onSaved}
		/>,
	);
	return { changes, onSaved };
}

describe("EditPostForm", () => {
	it("saves the post, then reads the number of changes again", async () => {
		const saved = { ...NOTE, title: "Jotai" };
		client.saveNote.mockResolvedValue(R.Ok(saved));
		const { changes, onSaved } = renderForm();
		const title = screen.getByDisplayValue("Jotai recipes");
		await userEvent.clear(title);
		await userEvent.type(title, "Jotai");
		await userEvent.click(screen.getByRole("button", { name: "Save" }));
		expect(client.saveNote).toHaveBeenCalledWith({
			id: "n1",
			draft: {
				title: "Jotai",
				slug: "jotai",
				language: "en",
				description: "",
				keywords: ["react"],
				fields: {},
				body: "# Jotai",
			},
		});
		expect((await screen.findByRole("status")).textContent).toMatch(/^Saved\./);
		expect(onSaved).toHaveBeenCalledWith(saved);
		expect(client.refreshChangeCount).toHaveBeenCalledWith(changes);
		await userEvent.type(title, "!");
		expect(screen.queryByRole("status")).toBeNull();
	});

	it("shows the message of a refused save", async () => {
		client.saveNote.mockResolvedValue(R.Error("offline"));
		renderForm();
		await userEvent.click(screen.getByRole("button", { name: "Save" }));
		expect((await screen.findByRole("alert")).textContent).toBe("Offline.");
	});

	it("shows the errors of the form, and sends nothing", async () => {
		renderForm();
		await userEvent.clear(screen.getByDisplayValue("Jotai recipes"));
		await userEvent.click(screen.getByRole("button", { name: "Save" }));
		expect(screen.getByText("Give the post a title.")).toBeTruthy();
		expect(client.saveNote).not.toHaveBeenCalled();
	});

	it("links back to the list of posts", () => {
		renderForm();
		expect(
			screen
				.getByRole("link", { name: "Back to the posts" })
				.getAttribute("href"),
		).toBe("/posts");
	});
});
