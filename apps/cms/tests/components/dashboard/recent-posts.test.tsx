// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RecentPosts } from "@/components/dashboard/recent-posts";

vi.mock("@/lib/notes/client", () => ({
	NOTES_ERROR_MESSAGES: { offline: "Offline." },
}));

function post(id: string, change: "publish" | null = null) {
	return {
		note: {
			id,
			title: `Post ${id}`,
			slug: `post-${id}`,
			language: "en",
			status: "draft" as const,
			publishedAt: null,
			updatedAt: "2026-10-18T12:00:00.000Z",
			mark: null,
		},
		change,
	};
}

describe("RecentPosts", () => {
	it("shows the last six posts, each with a link and its state", () => {
		const posts = [
			post("a", "publish"),
			...["b", "c", "d", "e", "f", "g"].map((id) => post(id)),
		];
		render(
			<RecentPosts
				list={{ status: "ready", posts }}
				linkKind="anchor"
				onRetry={vi.fn()}
			/>,
		);
		const items = within(
			screen.getByRole("list", { name: "Recent posts" }),
		).getAllByRole("listitem");
		expect(items).toHaveLength(6);
		expect(
			screen.getByRole("link", { name: "Post a" }).getAttribute("href"),
		).toBe("/posts/a");
		expect(items[0]?.textContent).toMatch(/To publish$/);
		expect(items[1]?.textContent).toMatch(/Draft$/);
	});

	it("tells when no post exists", () => {
		render(
			<RecentPosts
				list={{ status: "ready", posts: [] }}
				linkKind="anchor"
				onRetry={vi.fn()}
			/>,
		);
		expect(screen.getByText(/No posts yet/)).toBeTruthy();
	});

	it("shows the loading state, and the error with Try again", async () => {
		const onRetry = vi.fn();
		const { rerender } = render(
			<RecentPosts
				list={{ status: "loading" }}
				linkKind="anchor"
				onRetry={onRetry}
			/>,
		);
		expect(screen.getByRole("status").textContent).toBe("Loading the posts");
		rerender(
			<RecentPosts
				list={{ status: "failed", error: "offline" }}
				linkKind="anchor"
				onRetry={onRetry}
			/>,
		);
		expect(screen.getByRole("alert").textContent).toContain("Offline.");
		await userEvent.click(screen.getByRole("button", { name: "Try again" }));
		expect(onRetry).toHaveBeenCalledOnce();
	});
});
