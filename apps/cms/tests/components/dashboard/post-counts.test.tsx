// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PostCounts } from "@/components/dashboard/post-counts";

function post(id: string, status: "draft" | "published", language: string) {
	return {
		note: {
			id,
			title: id,
			slug: id,
			language,
			status,
			publishedAt: null,
			updatedAt: "2026-10-18T12:00:00.000Z",
			mark: null,
		},
		change: null,
	};
}

describe("PostCounts", () => {
	it("counts the posts by status and by language", () => {
		render(
			<PostCounts
				posts={[post("a", "draft", "en"), post("b", "published", "en")]}
				languages={["en", "id"]}
			/>,
		);
		expect(screen.getByLabelText("Posts by status").textContent).toBe(
			"Drafts1Published1",
		);
		expect(screen.getByLabelText("Posts by language").textContent).toBe(
			"English2Indonesia0",
		);
	});
});
