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

const SITE = { name: "rimzzlabs", url: null };
const LANGUAGES = { languages: ["en"], defaultLanguage: "en" };

function renderPage(fields: FieldDefinition[] = []) {
	const store = createSettingsStore({
		site: SITE,
		languages: LANGUAGES,
		fields,
	});
	render(<FieldsSettings store={store} />);
	return store;
}

/** The server answers with the fields that the page sent. */
function saveAnswersWithPatch() {
	client.saveSettings.mockImplementation((patch: { fields: unknown }) =>
		Promise.resolve(
			R.Ok({ site: SITE, languages: LANGUAGES, fields: patch.fields }),
		),
	);
}

beforeEach(() => {
	client.saveSettings.mockReset();
});

describe("FieldsSettings", () => {
	it("shows the core fields, and an empty state with the common fields", () => {
		renderPage();
		const core = screen.getByRole("list", { name: "Core fields" });
		expect(within(core).getByText("publishedAt")).toBeTruthy();
		expect(screen.getByText("No extra fields")).toBeTruthy();
		expect(
			screen.getByRole("button", { name: "Add the field featured" }),
		).toBeTruthy();
	});

	it("adds a common field in a dialog, and saves it at once", async () => {
		saveAnswersWithPatch();
		const store = renderPage();
		await userEvent.click(
			screen.getByRole("button", { name: "Add the field featured" }),
		);
		const dialog = screen.getByRole("dialog");
		expect(within(dialog).getByLabelText("Label")).toHaveProperty(
			"value",
			"Featured",
		);
		await userEvent.click(
			within(dialog).getByRole("button", { name: "Add the field" }),
		);
		expect(client.saveSettings).toHaveBeenCalledWith({ fields: [FEATURED] });
		expect(store.read().fields).toEqual([FEATURED]);
		expect(
			await screen.findByRole("list", { name: "Extra fields" }),
		).toBeTruthy();
		expect(
			screen.queryByRole("button", { name: "Add the field featured" }),
		).toBeNull();
	});

	it("makes the name from the label, with a type and Required", async () => {
		saveAnswersWithPatch();
		renderPage();
		await userEvent.click(screen.getByRole("button", { name: "Add a field" }));
		await userEvent.type(screen.getByLabelText("Label"), "Reading time");
		expect(screen.getByLabelText("Name in the frontmatter")).toHaveProperty(
			"value",
			"readingTime",
		);
		await userEvent.click(screen.getByRole("button", { name: "Number" }));
		await userEvent.click(screen.getByRole("checkbox", { name: /Required/ }));
		await userEvent.click(
			screen.getByRole("button", { name: "Add the field" }),
		);
		expect(client.saveSettings).toHaveBeenCalledWith({
			fields: [
				{
					name: "readingTime",
					label: "Reading time",
					type: "number",
					required: true,
				},
			],
		});
	});

	it("keeps the type when the writer presses the pressed type again", async () => {
		renderPage();
		await userEvent.click(screen.getByRole("button", { name: "Add a field" }));
		await userEvent.click(screen.getByRole("button", { name: "Text" }));
		expect(
			screen.getByRole("button", { name: "Text" }).getAttribute("aria-pressed"),
		).toBe("true");
	});

	it("shows the errors of a field, and saves nothing", async () => {
		renderPage([FEATURED]);
		await userEvent.click(screen.getByRole("button", { name: "Add a field" }));
		await userEvent.type(screen.getByLabelText("Label"), "Featured");
		await userEvent.click(
			screen.getByRole("button", { name: "Add the field" }),
		);
		expect(screen.getByRole("alert").textContent).toBe(
			"Another field has this name. Give each field its own name.",
		);
		expect(client.saveSettings).not.toHaveBeenCalled();
		await userEvent.type(screen.getByLabelText("Name in the frontmatter"), "2");
		expect(screen.queryByRole("alert")).toBeNull();
	});

	it("changes a field in a dialog", async () => {
		saveAnswersWithPatch();
		const store = renderPage([FEATURED]);
		await userEvent.click(
			screen.getByRole("button", { name: "Change Featured" }),
		);
		expect(
			screen.getByRole("heading", { name: "Change Featured" }),
		).toBeTruthy();
		await userEvent.click(screen.getByRole("checkbox", { name: /Required/ }));
		await userEvent.click(
			screen.getByRole("button", { name: "Save the field" }),
		);
		expect(store.read().fields).toEqual([{ ...FEATURED, required: true }]);
		expect(await screen.findByText("Required")).toBeTruthy();
	});

	it("shows why a save failed, and keeps the dialog open", async () => {
		client.saveSettings.mockResolvedValue(R.Error("offline"));
		const store = renderPage();
		await userEvent.click(
			screen.getByRole("button", { name: "Add the field featured" }),
		);
		await userEvent.click(
			screen.getByRole("button", { name: "Add the field" }),
		);
		expect(screen.getByRole("alert").textContent).toBe("Offline.");
		expect(screen.getByRole("dialog")).toBeTruthy();
		expect(store.read().fields).toEqual([]);
	});

	it("removes a field after a confirmation", async () => {
		saveAnswersWithPatch();
		const store = renderPage([FEATURED]);
		await userEvent.click(
			screen.getByRole("button", { name: "Remove Featured" }),
		);
		expect(
			screen.getByRole("heading", { name: "Remove Featured?" }),
		).toBeTruthy();
		await userEvent.click(
			screen.getByRole("button", { name: "Remove the field" }),
		);
		expect(client.saveSettings).toHaveBeenCalledWith({ fields: [] });
		expect(store.read().fields).toEqual([]);
		expect(await screen.findByText("No extra fields")).toBeTruthy();
	});

	it("shows why a remove failed", async () => {
		client.saveSettings.mockResolvedValue(R.Error("signed-out"));
		renderPage([FEATURED]);
		await userEvent.click(
			screen.getByRole("button", { name: "Remove Featured" }),
		);
		await userEvent.click(
			screen.getByRole("button", { name: "Remove the field" }),
		);
		expect(screen.getByRole("alert").textContent).toBe("Signed out.");
		await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
	});

	it("keeps the store when the stored settings are not complete", async () => {
		client.saveSettings.mockResolvedValue(
			R.Ok({ site: null, languages: null, fields: [FEATURED] }),
		);
		const store = renderPage();
		await userEvent.click(
			screen.getByRole("button", { name: "Add the field featured" }),
		);
		await userEvent.click(
			screen.getByRole("button", { name: "Add the field" }),
		);
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
