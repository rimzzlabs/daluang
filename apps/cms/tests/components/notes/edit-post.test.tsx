// @vitest-environment jsdom
import { R } from "@mobily/ts-belt";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EditPost } from "@/components/notes/edit-post";
import { createChangesStore } from "@/lib/notes/changes-store";
import { settingsStore } from "../../settings";

const client = vi.hoisted(() => ({
	readNote: vi.fn(),
	saveNote: vi.fn(),
	refreshChangeCount: vi.fn(),
	NOTES_ERROR_MESSAGES: { "not-found": "Not found.", offline: "Offline." },
}));

vi.mock("@/lib/notes/client", () => client);

// The page gives its note to Translate. The title of that note shows which note the page keeps.
vi.mock("@/components/notes/translate-post", () => ({
	TranslatePost: (props: { note: { title: string } }) => (
		<button type="button" data-title={props.note.title}>
			Translate
		</button>
	),
}));

function translatedTitle() {
	return screen
		.getByRole("button", { name: "Translate" })
		.getAttribute("data-title");
}

const NOTE = {
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

const DRAFT = { ...NOTE, status: "draft", publishedAt: null };

/** The answer of a save that the server sent before Publish changes. */
const SAVED_DRAFT = { ...DRAFT, title: "Jotai recipes!" };

beforeEach(() => {
	client.readNote.mockReset();
	client.saveNote.mockReset();
	client.saveNote.mockResolvedValue(R.Ok(NOTE));
});

function renderEditPost(onSaved = vi.fn(), changes = createChangesStore(0)) {
	render(
		<EditPost
			id="n1"
			settings={settingsStore()}
			changes={changes}
			linkKind="anchor"
			onOpenPost={vi.fn()}
			onSaved={onSaved}
		/>,
	);
	return onSaved;
}

describe("EditPost", () => {
	it("reads the post, and shows its form and its status", async () => {
		client.readNote.mockResolvedValue(R.Ok(NOTE));
		renderEditPost();
		expect(screen.getByRole("status").textContent).toBe("Loading the post");
		expect(await screen.findByDisplayValue("Jotai recipes")).toBeTruthy();
		expect(screen.getByText("Published")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Translate" })).toBeTruthy();
		expect(client.readNote).toHaveBeenCalledWith("n1");
	});

	it("tells when the post does not exist, with a way back", async () => {
		client.readNote.mockResolvedValue(R.Error("not-found"));
		renderEditPost();
		expect((await screen.findByRole("alert")).textContent).toContain(
			"Not found.",
		);
		expect(
			screen
				.getByRole("link", { name: "Back to the posts" })
				.getAttribute("href"),
		).toBe("/posts");
	});

	it("tells the page after a save, so the list reads the post again", async () => {
		client.readNote.mockResolvedValue(R.Ok(NOTE));
		client.saveNote.mockResolvedValue(R.Ok(NOTE));
		const onSaved = renderEditPost();
		const title = await screen.findByDisplayValue("Jotai recipes");
		await userEvent.type(title, "!{Control>}s{/Control}");
		await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
	});

	it("reads the post again after Publish changes, and keeps the text of the form", async () => {
		client.readNote
			.mockResolvedValueOnce(R.Ok(DRAFT))
			.mockResolvedValue(R.Ok(NOTE));
		const changes = createChangesStore(1);
		renderEditPost(vi.fn(), changes);
		const title = await screen.findByDisplayValue("Jotai recipes");
		expect(screen.getByText("Draft")).toBeTruthy();
		await userEvent.type(title, "!");
		act(() => changes.markPublished());
		expect(await screen.findByText("Published")).toBeTruthy();
		expect(client.readNote).toHaveBeenCalledTimes(2);
		expect(screen.getByDisplayValue("Jotai recipes!")).toBeTruthy();
	});

	it("keeps the form and the status when the read after Publish changes fails", async () => {
		const read = Promise.withResolvers<unknown>();
		client.readNote
			.mockResolvedValueOnce(R.Ok(NOTE))
			.mockReturnValueOnce(read.promise);
		const changes = createChangesStore(1);
		renderEditPost(vi.fn(), changes);
		await screen.findByDisplayValue("Jotai recipes");
		act(() => changes.markPublished());
		expect(client.readNote).toHaveBeenCalledTimes(2);
		await act(async () => read.resolve(R.Error("offline")));
		expect(screen.getByDisplayValue("Jotai recipes")).toBeTruthy();
		expect(screen.getByText("Published")).toBeTruthy();
		expect(screen.queryByText("Offline.")).toBeNull();
	});

	it("keeps the saved title when the read after Publish changes gives an older one", async () => {
		const read = Promise.withResolvers<unknown>();
		client.readNote
			.mockResolvedValueOnce(R.Ok(DRAFT))
			.mockReturnValueOnce(read.promise);
		client.saveNote.mockResolvedValue(R.Ok(SAVED_DRAFT));
		const changes = createChangesStore(1);
		const onSaved = renderEditPost(vi.fn(), changes);
		const title = await screen.findByDisplayValue("Jotai recipes");
		await userEvent.type(title, "!{Control>}s{/Control}");
		await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
		expect(translatedTitle()).toBe("Jotai recipes!");
		act(() => changes.markPublished());
		await act(async () => read.resolve(R.Ok(NOTE)));
		expect(screen.getByText("Published")).toBeTruthy();
		expect(translatedTitle()).toBe("Jotai recipes!");
	});

	it("keeps the status Published when a save answers after the read", async () => {
		const saved = Promise.withResolvers<unknown>();
		client.readNote
			.mockResolvedValueOnce(R.Ok(DRAFT))
			.mockResolvedValueOnce(R.Ok(NOTE));
		client.saveNote.mockReturnValueOnce(saved.promise);
		const changes = createChangesStore(1);
		const onSaved = renderEditPost(vi.fn(), changes);
		const title = await screen.findByDisplayValue("Jotai recipes");
		await userEvent.type(title, "!{Control>}s{/Control}");
		expect(client.saveNote).toHaveBeenCalledOnce();
		act(() => changes.markPublished());
		expect(await screen.findByText("Published")).toBeTruthy();
		await act(async () => saved.resolve(R.Ok(SAVED_DRAFT)));
		expect(onSaved).toHaveBeenCalledOnce();
		expect(screen.getByText("Published")).toBeTruthy();
		expect(translatedTitle()).toBe("Jotai recipes!");
	});

	it("tells when Publish changes deleted the post", async () => {
		client.readNote
			.mockResolvedValueOnce(R.Ok(NOTE))
			.mockResolvedValue(R.Error("not-found"));
		const changes = createChangesStore(1);
		renderEditPost(vi.fn(), changes);
		await screen.findByDisplayValue("Jotai recipes");
		act(() => changes.markPublished());
		expect((await screen.findByRole("alert")).textContent).toContain(
			"Not found.",
		);
	});
});
