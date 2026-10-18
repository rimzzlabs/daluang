// @vitest-environment jsdom
import type { Note } from "@daluang/notes/note";
import { R } from "@mobily/ts-belt";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TranslatePost } from "@/components/notes/translate-post";

const client = vi.hoisted(() => ({
	listNotesOfCms: vi.fn(),
	addNote: vi.fn(),
	NOTES_ERROR_MESSAGES: { "slug-taken": "Slug taken.", offline: "Offline." },
}));

vi.mock("@/lib/notes/client", () => client);

const NOTE: Note = {
	id: "n1",
	title: "Lefthook",
	slug: "lefthook",
	language: "en",
	description: "Git hooks.",
	keywords: ["git"],
	status: "draft",
	publishedAt: null,
	updatedAt: "2026-10-18T12:00:00.000Z",
	createdAt: "2026-10-18T12:00:00.000Z",
	fields: {},
	body: "# Lefthook",
	published: null,
	mark: null,
};

const SUMMARY = {
	id: "n2",
	title: "Lefthook",
	slug: "lefthook",
	language: "id",
	status: "draft",
	publishedAt: null,
	updatedAt: "2026-10-18T12:00:00.000Z",
	mark: null,
};

beforeEach(() => {
	client.listNotesOfCms.mockReset();
	client.addNote.mockReset();
});

function renderTranslate(languages = ["en", "id", "ja"]) {
	const onTranslated = vi.fn();
	render(
		<TranslatePost
			note={NOTE}
			languages={languages}
			onTranslated={onTranslated}
		/>,
	);
	return onTranslated;
}

describe("TranslatePost", () => {
	it("adds a copy in a language with no translation, then opens it", async () => {
		client.listNotesOfCms.mockResolvedValue(R.Ok([SUMMARY]));
		client.addNote.mockResolvedValue(
			R.Ok({ ...NOTE, id: "n3", language: "ja" }),
		);
		const onTranslated = renderTranslate();
		await userEvent.click(screen.getByRole("button", { name: "Translate" }));
		const dialog = await screen.findByRole("dialog");
		expect(
			await within(dialog).findByRole("button", { name: "日本語" }),
		).toBeTruthy();
		expect(
			within(dialog).queryByRole("button", { name: "Indonesia" }),
		).toBeNull();
		await userEvent.click(
			within(dialog).getByRole("button", { name: "日本語" }),
		);
		expect(client.addNote).toHaveBeenCalledWith({
			title: "Lefthook",
			slug: "lefthook",
			language: "ja",
			description: "Git hooks.",
			keywords: ["git"],
			fields: {},
			body: "# Lefthook",
		});
		expect(onTranslated).toHaveBeenCalledWith("n3");
	});

	it("tells when each language has the post", async () => {
		client.listNotesOfCms.mockResolvedValue(R.Ok([SUMMARY]));
		renderTranslate(["en", "id"]);
		await userEvent.click(screen.getByRole("button", { name: "Translate" }));
		expect(
			await screen.findByText("Each language of the CMS has this post."),
		).toBeTruthy();
	});

	it("shows the message of a refused copy", async () => {
		client.listNotesOfCms.mockResolvedValue(R.Ok([]));
		client.addNote.mockResolvedValue(R.Error("slug-taken"));
		const onTranslated = renderTranslate(["en", "id"]);
		await userEvent.click(screen.getByRole("button", { name: "Translate" }));
		await userEvent.click(
			await screen.findByRole("button", { name: "Indonesia" }),
		);
		expect((await screen.findByRole("alert")).textContent).toBe("Slug taken.");
		expect(onTranslated).not.toHaveBeenCalled();
	});

	it("shows the message of a failed list", async () => {
		client.listNotesOfCms.mockResolvedValue(R.Error("offline"));
		renderTranslate();
		await userEvent.click(screen.getByRole("button", { name: "Translate" }));
		expect((await screen.findByRole("alert")).textContent).toBe("Offline.");
	});

	it("shows nothing in a CMS with one language", () => {
		const { container } = render(
			<TranslatePost note={NOTE} languages={["en"]} onTranslated={vi.fn()} />,
		);
		expect(container.innerHTML).toBe("");
	});
});
