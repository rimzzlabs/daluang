// @vitest-environment jsdom
import { R } from "@mobily/ts-belt";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EditPost } from "@/components/notes/edit-post";
import { createChangesStore } from "@/lib/notes/changes-store";
import { settingsStore } from "../../settings";

const client = vi.hoisted(() => ({
	readNote: vi.fn(),
	NOTES_ERROR_MESSAGES: { "not-found": "Not found.", offline: "Offline." },
}));

vi.mock("@/lib/notes/client", () => client);

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

beforeEach(() => {
	client.readNote.mockReset();
});

function renderEditPost(changes = createChangesStore(0)) {
	render(
		<EditPost
			id="n1"
			settings={settingsStore()}
			changes={changes}
			linkKind="anchor"
			onOpenPost={vi.fn()}
		/>,
	);
	return changes;
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
});
