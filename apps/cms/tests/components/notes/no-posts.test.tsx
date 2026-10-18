// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NoPosts } from "@/components/notes/no-posts";

describe("NoPosts", () => {
	it("links to each setting that a site needs after the onboarding", () => {
		render(<NoPosts linkKind="anchor" />);
		expect(screen.getByRole("heading", { name: "No posts yet" })).toBeTruthy();
		expect(
			screen.getAllByRole("link").map((link) => link.getAttribute("href")),
		).toEqual([
			"/settings/fields",
			"/settings/api-tokens",
			"/settings/webhooks",
		]);
	});
});
