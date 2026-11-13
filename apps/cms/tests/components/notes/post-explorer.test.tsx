// @vitest-environment jsdom
import type { ListedNote } from "@daluang/notes/note-list";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PostExplorer } from "@/components/notes/post-explorer";
import type { PostListState } from "@/hooks/notes/use-post-list";

vi.mock("@/lib/notes/client", () => ({
	NOTES_ERROR_MESSAGES: { offline: "Offline." },
}));

function listed(id: string, title: string, published = false): ListedNote {
	return {
		note: {
			id,
			title,
			slug: id,
			language: "en",
			status: published ? "published" : "draft",
			publishedAt: published ? "2026-10-18T12:00:00.000Z" : null,
			updatedAt: "2026-10-18T12:00:00.000Z",
			mark: null,
		},
		change: null,
	};
}

const READY: PostListState = {
	status: "ready",
	posts: [
		listed("jotai", "Jotai recipes"),
		listed("lefthook", "Git hooks with Lefthook", true),
	],
};

function renderExplorer(list: PostListState, onRetry = vi.fn()) {
	render(
		<PostExplorer
			list={list}
			activeId="jotai"
			linkKind="anchor"
			onRetry={onRetry}
		/>,
	);
	return onRetry;
}

function titles(): readonly string[] {
	const panel = screen.getByRole("complementary", { name: "Posts" });
	return within(panel)
		.queryAllByRole("link")
		.map((link) => link.querySelector("span")?.textContent ?? "");
}

describe("PostExplorer", () => {
	it("links each post, and marks the open one", () => {
		renderExplorer(READY);
		expect(titles()).toEqual(["Jotai recipes", "Git hooks with Lefthook"]);
		expect(screen.getByText("2 posts")).toBeTruthy();
		const open = screen.getByRole("link", { current: "page" });
		expect(open.getAttribute("href")).toBe("/posts/jotai");
	});

	it("finds the posts of a search and of a status", async () => {
		renderExplorer(READY);
		await userEvent.type(
			screen.getByRole("searchbox", { name: "Search the posts" }),
			"hooks",
		);
		expect(titles()).toEqual(["Git hooks with Lefthook"]);
		expect(screen.getByText("1 post")).toBeTruthy();
		await userEvent.click(screen.getByRole("button", { name: "Drafts" }));
		expect(titles()).toEqual([]);
		expect(screen.getByText("No post matches.")).toBeTruthy();
		await userEvent.click(screen.getByRole("button", { name: "Drafts" }));
		expect(titles()).toEqual(["Git hooks with Lefthook"]);
	});

	it("shows the loading state", () => {
		renderExplorer({ status: "loading" });
		expect(screen.getByRole("status").textContent).toBe("Loading the posts");
	});

	it("shows the error, and reads the posts again on Try again", async () => {
		const onRetry = renderExplorer({ status: "failed", error: "offline" });
		expect(screen.getByRole("alert").textContent).toContain("Offline.");
		await userEvent.click(screen.getByRole("button", { name: "Try again" }));
		expect(onRetry).toHaveBeenCalledOnce();
	});
});
