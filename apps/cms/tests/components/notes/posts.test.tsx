// @vitest-environment jsdom
import { R } from "@mobily/ts-belt";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Posts } from "@/components/notes/posts";
import { createChangesStore } from "@/lib/notes/changes-store";

const client = vi.hoisted(() => ({
	listPostsOfCms: vi.fn(),
	NOTES_ERROR_MESSAGES: { offline: "Offline." },
}));

vi.mock("@/lib/notes/client", () => client);

const POST = {
	note: {
		id: "n1",
		title: "Jotai recipes",
		slug: "jotai-recipes",
		language: "en",
		status: "draft",
		publishedAt: null,
		updatedAt: "2026-10-18T12:00:00.000Z",
		mark: "publish",
	},
	change: "publish",
};

beforeEach(() => {
	client.listPostsOfCms.mockReset();
});

describe("Posts", () => {
	it("lists the posts, and gives the navbar the number of changes", async () => {
		client.listPostsOfCms.mockResolvedValue(R.Ok({ posts: [POST], count: 3 }));
		const changes = createChangesStore(0);
		render(<Posts changes={changes} linkKind="anchor" />);
		expect(screen.getByRole("status").textContent).toBe("Loading the posts");
		expect(await screen.findByText("Jotai recipes")).toBeTruthy();
		expect(screen.getByText("To publish")).toBeTruthy();
		expect(changes.read()).toBe(3);
	});

	it("shows the steps to set up a site when no post exists", async () => {
		client.listPostsOfCms.mockResolvedValue(R.Ok({ posts: [], count: 0 }));
		render(<Posts changes={createChangesStore(0)} linkKind="anchor" />);
		expect(
			await screen.findByRole("heading", { name: "No posts yet" }),
		).toBeTruthy();
	});

	it("shows the message of a failed list, and tries again", async () => {
		client.listPostsOfCms
			.mockResolvedValueOnce(R.Error("offline"))
			.mockResolvedValueOnce(R.Ok({ posts: [POST], count: 1 }));
		render(<Posts changes={createChangesStore(0)} linkKind="anchor" />);
		expect((await screen.findByRole("alert")).textContent).toContain(
			"Offline.",
		);
		await userEvent.click(screen.getByRole("button", { name: "Try again" }));
		expect(await screen.findByText("Jotai recipes")).toBeTruthy();
	});
});
