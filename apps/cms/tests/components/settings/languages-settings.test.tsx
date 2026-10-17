// @vitest-environment jsdom

import { R } from "@mobily/ts-belt";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguagesSettings } from "@/components/settings/languages-settings";
import { createSettingsStore } from "@/lib/settings/settings-store";

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
	site: { name: "rimzzlabs", url: null },
	languages: { languages: ["en", "id"], defaultLanguage: "en" },
	fields: [],
};

function renderPage() {
	const store = createSettingsStore(SETTINGS);
	render(<LanguagesSettings store={store} />);
	return store;
}

beforeEach(() => {
	client.saveSettings.mockReset();
});

describe("LanguagesSettings", () => {
	it("saves the languages and writes the store", async () => {
		const languages = { languages: ["id"], defaultLanguage: "id" };
		client.saveSettings.mockResolvedValue(
			R.Ok({ site: SETTINGS.site, languages }),
		);
		const store = renderPage();
		await userEvent.click(screen.getByRole("button", { name: /English/ }));
		await userEvent.click(screen.getByRole("button", { name: "Save" }));
		expect(client.saveSettings).toHaveBeenCalledWith({ languages });
		expect(store.read().languages).toEqual(languages);
		expect(screen.getByRole("status").textContent).toBe("Saved");
	});

	it("shows why a save failed", async () => {
		client.saveSettings.mockResolvedValue(R.Error("server"));
		const store = renderPage();
		await userEvent.click(screen.getByRole("button", { name: "Save" }));
		expect(screen.getByRole("status").textContent).toBe("Server.");
		expect(store.read()).toBe(SETTINGS);
	});

	it("keeps the store when the stored settings are not complete", async () => {
		client.saveSettings.mockResolvedValue(
			R.Ok({ site: null, languages: SETTINGS.languages }),
		);
		const store = renderPage();
		await userEvent.click(screen.getByRole("button", { name: "Save" }));
		expect(store.read()).toBe(SETTINGS);
	});

	it("clears the result of a save after a change", async () => {
		client.saveSettings.mockResolvedValue(R.Ok(SETTINGS));
		renderPage();
		await userEvent.click(screen.getByRole("button", { name: "Save" }));
		await userEvent.click(screen.getByRole("radio", { name: "Indonesia" }));
		expect(screen.getByRole("status").textContent).toBe("");
	});
});
