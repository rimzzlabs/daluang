// @vitest-environment jsdom

import { createSettingsStore } from "@daluang/settings/settings-store";
import { R } from "@mobily/ts-belt";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SiteSettings } from "@/components/settings/site-settings";

const client = vi.hoisted(() => ({
	saveSettings: vi.fn(),
	SAVE_ERROR_MESSAGES: {
		invalid: "Invalid.",
		"signed-out": "Signed out.",
		offline: "Offline.",
		server: "Server.",
	},
}));
vi.mock("@/lib/settings/client", () => client);

const SETTINGS = {
	site: { name: "rimzzlabs", url: "https://rimzzlabs.com" },
	languages: { languages: ["en"], defaultLanguage: "en" },
	fields: [],
};

function renderPage() {
	const store = createSettingsStore(SETTINGS);
	render(<SiteSettings store={store} />);
	return store;
}

beforeEach(() => {
	client.saveSettings.mockReset();
});

describe("SiteSettings", () => {
	it("shows the stored site", () => {
		renderPage();
		expect(screen.getByLabelText("Site name")).toHaveProperty(
			"value",
			"rimzzlabs",
		);
		expect(screen.getByLabelText(/Site address/)).toHaveProperty(
			"value",
			"https://rimzzlabs.com",
		);
	});

	it("saves the site, writes the store, and says that it saved", async () => {
		const site = { name: "Catatan", url: null };
		client.saveSettings.mockResolvedValue(
			R.Ok({ site, languages: SETTINGS.languages }),
		);
		const store = renderPage();
		await userEvent.clear(screen.getByLabelText("Site name"));
		await userEvent.type(screen.getByLabelText("Site name"), "Catatan");
		await userEvent.clear(screen.getByLabelText(/Site address/));
		await userEvent.click(screen.getByRole("button", { name: "Save" }));
		expect(client.saveSettings).toHaveBeenCalledWith({ site });
		expect(store.read().site).toEqual(site);
		expect(screen.getByRole("status").textContent).toBe("Saved");
	});

	it("refuses an empty name, and focuses the field", async () => {
		renderPage();
		await userEvent.clear(screen.getByLabelText("Site name"));
		await userEvent.click(screen.getByRole("button", { name: "Save" }));
		expect(screen.getByRole("alert").textContent).toBe(
			"Give your site a name.",
		);
		expect(document.activeElement).toBe(screen.getByLabelText("Site name"));
		expect(client.saveSettings).not.toHaveBeenCalled();
	});

	it("shows why a save failed, and keeps the store", async () => {
		client.saveSettings.mockResolvedValue(R.Error("signed-out"));
		const store = renderPage();
		await userEvent.type(screen.getByLabelText("Site name"), "!");
		await userEvent.click(screen.getByRole("button", { name: "Save" }));
		expect(screen.getByRole("status").textContent).toBe("Signed out.");
		expect(store.read()).toBe(SETTINGS);
	});

	it("keeps the store when the stored settings are not complete", async () => {
		client.saveSettings.mockResolvedValue(
			R.Ok({ site: SETTINGS.site, languages: null }),
		);
		const store = renderPage();
		await userEvent.click(screen.getByRole("button", { name: "Save" }));
		expect(store.read()).toBe(SETTINGS);
		expect(screen.getByRole("status").textContent).toBe("Saved");
	});

	it("clears the result of a save when the writer types", async () => {
		client.saveSettings.mockResolvedValue(R.Ok(SETTINGS));
		renderPage();
		await userEvent.click(screen.getByRole("button", { name: "Save" }));
		await userEvent.type(screen.getByLabelText("Site name"), "x");
		expect(screen.getByRole("status").textContent).toBe("");
	});
});
