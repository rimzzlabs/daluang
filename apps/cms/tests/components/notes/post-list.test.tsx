// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PostList } from "@/components/notes/post-list";

function summary(id: string, status: "draft" | "published") {
	return {
		id,
		title: `Post ${id}`,
		slug: `post-${id}`,
		language: "id",
		status,
		publishedAt: null,
		updatedAt: "2026-10-18T12:00:00.000Z",
		mark: null,
	};
}

describe("PostList", () => {
	it("shows each post with its language, its status, and its change", () => {
		render(
			<PostList
				posts={[
					{ note: summary("a", "draft"), change: "publish" },
					{ note: summary("b", "published"), change: null },
				]}
			/>,
		);
		const [first, second] = within(
			screen.getByRole("list", { name: "Posts" }),
		).getAllByRole("listitem");
		expect(first?.textContent).toMatch(
			/^Post apost-a · Changed Oct 1[789], 2026idDraftTo publish$/,
		);
		expect(second?.textContent).toMatch(/Published$/);
	});
});
