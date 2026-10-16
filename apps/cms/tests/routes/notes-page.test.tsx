// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NotesPage } from "@/routes/notes-page";
import { settingsStore } from "../settings";

describe("NotesPage", () => {
	it("links to each setting that a site needs after the onboarding", () => {
		render(<NotesPage settings={settingsStore()} linkKind="anchor" />);
		expect(screen.getByRole("heading", { name: "No notes yet" })).toBeTruthy();
		expect(
			screen.getAllByRole("link").map((link) => link.getAttribute("href")),
		).toEqual([
			"/settings/fields",
			"/settings/api-tokens",
			"/settings/webhooks",
		]);
	});
});
