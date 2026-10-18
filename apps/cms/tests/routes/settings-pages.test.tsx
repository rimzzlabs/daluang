// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createChangesStore } from "@/lib/notes/changes-store";
import { FieldsPage, LanguagesPage, SitePage } from "@/routes/settings-pages";
import { settingsStore } from "../settings";

describe("settings pages", () => {
	it("shows the site of the store on the Site page", () => {
		render(
			<SitePage
				settings={settingsStore()}
				changes={createChangesStore(0)}
				linkKind="anchor"
				pathname="/settings/site"
			/>,
		);
		expect(screen.getByRole("heading", { name: "Site" })).toBeTruthy();
		expect(screen.getByLabelText("Site name")).toHaveProperty(
			"value",
			"rimzzlabs",
		);
	});

	it("shows the languages of the store on the Languages page", () => {
		render(
			<LanguagesPage
				settings={settingsStore()}
				changes={createChangesStore(0)}
				linkKind="anchor"
				pathname="/settings/languages"
			/>,
		);
		expect(screen.getByRole("heading", { name: "Languages" })).toBeTruthy();
		expect(
			screen
				.getByRole("radio", { name: "English" })
				.getAttribute("aria-checked"),
		).toBe("true");
	});

	it("shows the core fields on the Fields page", () => {
		render(
			<FieldsPage
				settings={settingsStore()}
				changes={createChangesStore(0)}
				linkKind="anchor"
				pathname="/settings/fields"
			/>,
		);
		expect(screen.getByRole("heading", { name: "Fields" })).toBeTruthy();
		expect(screen.getByText("publishedAt")).toBeTruthy();
	});
});
