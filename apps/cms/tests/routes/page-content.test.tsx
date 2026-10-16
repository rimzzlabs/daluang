import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { APP_PAGES } from "@/lib/app-pages";
import { PAGE_COMPONENTS, PageContent } from "@/routes/page-content";

describe("PageContent", () => {
	it("renders the page of a path", () => {
		render(<PageContent pathname="/settings/languages/" />);
		expect(screen.getByRole("heading", { name: "Languages" })).toBeTruthy();
	});

	it("renders nothing for a path with no page", () => {
		const { container } = render(<PageContent pathname="/nope" />);
		expect(container.innerHTML).toBe("");
	});

	it("has a component for each page", () => {
		for (const page of APP_PAGES)
			expect(PAGE_COMPONENTS[page.path]).toBeTypeOf("function");
	});
});
