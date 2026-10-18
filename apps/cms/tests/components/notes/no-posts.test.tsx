// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NoPosts } from "@/components/notes/no-posts";

describe("NoPosts", () => {
	it("links to a new post", () => {
		render(<NoPosts linkKind="anchor" />);
		expect(screen.getByRole("heading", { name: "No posts yet" })).toBeTruthy();
		expect(
			screen.getByRole("link", { name: "New post" }).getAttribute("href"),
		).toBe("/posts/new");
	});
});
