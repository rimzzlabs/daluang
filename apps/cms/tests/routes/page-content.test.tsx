// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createChangesStore } from "@/lib/notes/changes-store";
import { APP_PAGES } from "@/lib/shell/app-pages";
import { PAGE_COMPONENTS, PageContent } from "@/routes/page-content";
import { settingsStore } from "../settings";

describe("PageContent", () => {
	it("renders the page of a path", () => {
		render(
			<PageContent
				pathname="/settings/languages/"
				settings={settingsStore()}
				changes={createChangesStore(0)}
			/>,
		);
		expect(screen.getByRole("heading", { name: "Languages" })).toBeTruthy();
	});

	it("renders nothing for a path with no page", () => {
		const { container } = render(
			<PageContent
				pathname="/nope"
				settings={settingsStore()}
				changes={createChangesStore(0)}
			/>,
		);
		expect(container.innerHTML).toBe("");
	});

	it("has a component for each page", () => {
		for (const page of APP_PAGES)
			expect(PAGE_COMPONENTS[page.path]).toBeTypeOf("function");
	});
});
