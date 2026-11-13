// @vitest-environment jsdom
import { R } from "@mobily/ts-belt";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewPost } from "@/components/notes/new-post";
import { settingsStore } from "../../settings";

const client = vi.hoisted(() => ({
	addNote: vi.fn(),
	listNotesOfCms: vi.fn(),
	NOTES_ERROR_MESSAGES: { offline: "Offline.", "slug-taken": "Slug taken." },
}));

vi.mock("@/lib/notes/client", () => client);

beforeEach(() => {
	client.addNote.mockReset();
	client.listNotesOfCms.mockReset();
	client.listNotesOfCms.mockResolvedValue(R.Ok([]));
});

function renderNewPost(onCreated = vi.fn()) {
	render(
		<NewPost
			settings={settingsStore()}
			linkKind="anchor"
			onCreated={onCreated}
		/>,
	);
	return onCreated;
}

describe("NewPost", () => {
	it("adds an untitled draft with a free slug, then opens it", async () => {
		client.listNotesOfCms.mockResolvedValue(
			R.Ok([{ slug: "untitled", language: "en" }]),
		);
		client.addNote.mockResolvedValue(R.Ok({ id: "n9" }));
		const onCreated = renderNewPost();
		expect(screen.getByRole("status").textContent).toBe("Adding the draft");
		await waitFor(() => expect(onCreated).toHaveBeenCalledWith("n9"));
		expect(client.addNote).toHaveBeenCalledWith({
			title: "Untitled 2",
			slug: "untitled-2",
			language: "en",
			description: "",
			keywords: [],
			fields: {},
			body: "",
		});
	});

	it("shows the error of a refused draft, and tries again", async () => {
		client.addNote.mockResolvedValue(R.Error("slug-taken"));
		const onCreated = renderNewPost();
		expect((await screen.findByRole("alert")).textContent).toContain(
			"Slug taken.",
		);
		client.addNote.mockResolvedValue(R.Ok({ id: "n9" }));
		await userEvent.click(screen.getByRole("button", { name: "Try again" }));
		await waitFor(() => expect(onCreated).toHaveBeenCalledWith("n9"));
	});

	it("adds no draft when the list of posts fails", async () => {
		client.listNotesOfCms.mockResolvedValue(R.Error("offline"));
		renderNewPost();
		expect((await screen.findByRole("alert")).textContent).toContain(
			"Offline.",
		);
		expect(client.addNote).not.toHaveBeenCalled();
		expect(
			screen
				.getByRole("link", { name: "Back to the posts" })
				.getAttribute("href"),
		).toBe("/posts");
	});

	it("opens nothing when the page closes before the answer", async () => {
		const answer = Promise.withResolvers<unknown>();
		client.listNotesOfCms.mockReturnValue(answer.promise);
		const onCreated = vi.fn();
		const { unmount } = render(
			<NewPost
				settings={settingsStore()}
				linkKind="anchor"
				onCreated={onCreated}
			/>,
		);
		unmount();
		answer.resolve(R.Error("offline"));
		await answer.promise;
		expect(onCreated).not.toHaveBeenCalled();
	});
});
