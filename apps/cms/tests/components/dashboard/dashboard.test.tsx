// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Dashboard } from "@/components/dashboard/dashboard";
import { createSettingsStore } from "@/lib/settings/settings-store";
import { SETTINGS, settingsStore } from "../../settings";

describe("Dashboard", () => {
	it("shows the site with a link to it, a new post, and the steps to set it up", () => {
		render(<Dashboard settings={settingsStore()} linkKind="anchor" />);
		expect(
			screen.getByRole("heading", { level: 1, name: "rimzzlabs" }),
		).toBeTruthy();
		expect(
			screen.getByRole("link", { name: "rimzzlabs.com" }).getAttribute("href"),
		).toBe("https://rimzzlabs.com");
		expect(
			screen.getByRole("link", { name: "New post" }).getAttribute("href"),
		).toBe("/posts/new");
		expect(
			screen.getByRole("heading", { name: "Set up your site" }),
		).toBeTruthy();
	});

	it("asks for the address of a site with none", () => {
		const settings = createSettingsStore({
			...SETTINGS,
			site: { name: "Catatan", url: null },
		});
		render(<Dashboard settings={settings} linkKind="anchor" />);
		expect(screen.getByText(/Your site has no address yet/)).toBeTruthy();
	});
});
