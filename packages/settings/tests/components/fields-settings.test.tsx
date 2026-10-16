// @vitest-environment jsdom
import type { FieldDefinition } from "@daluang/notes/field-definitions";
import { R } from "@mobily/ts-belt";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FieldsSettings } from "../../src/components/fields-settings";
import { createSettingsStore } from "../../src/settings-store";

const client = vi.hoisted(() => ({
	saveSettings: vi.fn(),
	SAVE_ERROR_MESSAGES: {
		invalid: "Invalid.",
		"signed-out": "Signed out.",
		offline: "Offline.",
		server: "Server.",
	},
}));
vi.mock("../../src/client", () => client);

const FEATURED: FieldDefinition = {
	name: "featured",
	label: "Featured",
	type: "boolean",
	required: false,
};

const SETTINGS = {
	site: { name: "rimzzlabs", url: null },
	languages: { languages: ["en"], defaultLanguage: "en" },
	fields: [],
};

function renderPage(fields: FieldDefinition[] = []) {
	const store = createSettingsStore({ ...SETTINGS, fields });
	render(<FieldsSettings store={store} />);
	return store;
}

beforeEach(() => {
	client.saveSettings.mockReset();
});

describe("FieldsSettings", () => {
	it("shows the core fields and an empty list", () => {
		renderPage();
		const core = screen.getByRole("list", { name: "Core fields" });
		expect(within(core).getByText("publishedAt")).toBeTruthy();
		expect(screen.getByText(/No extra fields/)).toBeTruthy();
	});

	it("adds a common field, and hides its suggestion", async () => {
		renderPage();
		await userEvent.click(
			screen.getByRole("button", { name: "Add the field featured" }),
		);
		expect(screen.getByLabelText("Label")).toHaveProperty("value", "Featured");
		expect(
			screen.queryByRole("button", { name: "Add the field featured" }),
		).toBeNull();
	});

	it("adds an empty field with the focus on its label, and keeps the focus while the writer types", async () => {
		renderPage();
		await userEvent.click(screen.getByRole("button", { name: "Add a field" }));
		const label = screen.getByLabelText("Label");
		expect(document.activeElement).toBe(label);
		await userEvent.type(label, "Reading time");
		expect(document.activeElement).toBe(label);
		expect(screen.getByLabelText("Name in the frontmatter")).toHaveProperty(
			"value",
			"readingTime",
		);
		await userEvent.type(screen.getByLabelText("Name in the frontmatter"), "s");
		expect(document.activeElement).toBe(
			screen.getByLabelText("Name in the frontmatter"),
		);
	});

	it("saves the type and the required state of each field", async () => {
		const fields: FieldDefinition[] = [
			{ ...FEATURED, type: "number", required: true },
		];
		client.saveSettings.mockResolvedValue(
			R.Ok({ site: SETTINGS.site, languages: SETTINGS.languages, fields }),
		);
		const store = renderPage([FEATURED]);
		await userEvent.click(screen.getByRole("button", { name: "Number" }));
		await userEvent.click(screen.getByRole("checkbox", { name: "Required" }));
		await userEvent.click(screen.getByRole("button", { name: "Save" }));
		expect(client.saveSettings).toHaveBeenCalledWith({ fields });
		expect(store.read().fields).toEqual(fields);
		expect(screen.getByRole("status").textContent).toBe("Saved");
	});

	it("keeps the type when the writer presses the pressed type again", async () => {
		renderPage([FEATURED]);
		await userEvent.click(screen.getByRole("button", { name: "Yes or no" }));
		expect(
			screen
				.getByRole("button", { name: "Yes or no" })
				.getAttribute("aria-pressed"),
		).toBe("true");
	});

	it("removes a field", async () => {
		renderPage([FEATURED]);
		await userEvent.click(
			screen.getByRole("button", { name: "Remove Featured" }),
		);
		expect(screen.getByText(/No extra fields/)).toBeTruthy();
	});

	it("shows the error of a row and saves nothing", async () => {
		renderPage();
		await userEvent.click(screen.getByRole("button", { name: "Add a field" }));
		await userEvent.click(screen.getByRole("button", { name: "Save" }));
		expect(
			screen.getAllByRole("alert").map((alert) => alert.textContent),
		).toEqual([
			"Give the field a label.",
			"Start the name with a letter. Then use letters, digits, or _: relatedPosts.",
		]);
		expect(client.saveSettings).not.toHaveBeenCalled();
	});

	it("shows why a save failed", async () => {
		client.saveSettings.mockResolvedValue(R.Error("offline"));
		const store = renderPage([FEATURED]);
		await userEvent.click(screen.getByRole("button", { name: "Save" }));
		expect(screen.getByRole("status").textContent).toBe("Offline.");
		expect(store.read().fields).toEqual([FEATURED]);
	});

	it("keeps the store when the stored settings are not complete", async () => {
		client.saveSettings.mockResolvedValue(
			R.Ok({ site: null, languages: null, fields: [FEATURED] }),
		);
		const store = renderPage();
		await userEvent.click(screen.getByRole("button", { name: "Save" }));
		expect(store.read().fields).toEqual([]);
	});

	it("turns off Add at the most fields", () => {
		const fields = Array.from({ length: 30 }, (_, index) => ({
			...FEATURED,
			name: `field${index}`,
		}));
		renderPage(fields);
		expect(
			screen
				.getByRole("button", { name: "Add a field" })
				.hasAttribute("disabled"),
		).toBe(true);
		expect(screen.queryByText("Common fields:")).toBeNull();
	});
});
