// @vitest-environment jsdom
import { R } from "@mobily/ts-belt";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { firstName, Onboarding } from "../../src/components/onboarding";

const client = vi.hoisted(() => ({
	saveSettings: vi.fn(),
	openPage: vi.fn(),
	SAVE_ERROR_MESSAGES: {
		invalid: "Invalid.",
		"signed-out": "Signed out.",
		offline: "Offline.",
		server: "Server.",
	},
}));
vi.mock("../../src/client", () => client);

const LANGUAGES = { languages: ["en"], defaultLanguage: "en" };

function renderOnboarding(name = "Rizki Citra") {
	return render(
		<Onboarding
			writerName={name}
			site={{ name: "", url: "" }}
			languages={LANGUAGES}
		/>,
	);
}

async function fillSite(name: string, url = "") {
	await userEvent.type(screen.getByLabelText("Site name"), name);
	if (url !== "")
		await userEvent.type(screen.getByLabelText(/Site address/), url);
	await userEvent.click(screen.getByRole("button", { name: "Continue" }));
}

beforeEach(() => {
	client.saveSettings.mockReset();
	client.openPage.mockReset();
});

describe("firstName", () => {
	it("gives the first word of a name", () => {
		expect(firstName("  Rizki Citra ")).toBe("Rizki");
	});
});

describe("Onboarding", () => {
	it("greets the writer by the first name, at step 1 of 3", () => {
		renderOnboarding();
		expect(
			screen.getByRole("heading", { name: "Welcome, Rizki" }),
		).toBeTruthy();
		expect(screen.getByText("Step 1 of 3")).toBeTruthy();
	});

	it("greets a writer with no name", () => {
		renderOnboarding(" ");
		expect(
			screen.getByRole("heading", { name: "Welcome to Daluang" }),
		).toBeTruthy();
	});

	it("asks for a site name, and focuses the field", async () => {
		renderOnboarding();
		await userEvent.click(screen.getByRole("button", { name: "Continue" }));
		expect(screen.getByRole("alert").textContent).toBe(
			"Give your site a name.",
		);
		expect(document.activeElement).toBe(screen.getByLabelText("Site name"));
	});

	it("refuses an address that is not valid, and focuses the field", async () => {
		renderOnboarding();
		await fillSite("rimzzlabs", "my site");
		expect(screen.getByRole("alert").textContent).toBe(
			"Use an address such as https://example.com.",
		);
		expect(document.activeElement).toBe(screen.getByLabelText(/Site address/));
	});

	it("clears an error when the writer types", async () => {
		renderOnboarding();
		await userEvent.click(screen.getByRole("button", { name: "Continue" }));
		await userEvent.type(screen.getByLabelText("Site name"), "r");
		expect(screen.queryByRole("alert")).toBeNull();
	});

	it("saves the answers, then opens the notes", async () => {
		client.saveSettings.mockResolvedValue(R.Ok({}));
		renderOnboarding();
		await fillSite("rimzzlabs", "rimzzlabs.com/");

		const languagesHeading = screen.getByRole("heading", {
			name: "Which languages do you write in?",
		});
		expect(document.activeElement).toBe(languagesHeading);
		await userEvent.click(screen.getByRole("button", { name: /Indonesia/ }));
		await userEvent.click(screen.getByRole("radio", { name: "Indonesia" }));
		await userEvent.click(screen.getByRole("button", { name: "Continue" }));

		expect(screen.getByText("Step 3 of 3")).toBeTruthy();
		expect(screen.getByText("https://rimzzlabs.com")).toBeTruthy();
		expect(screen.getByText("English, Indonesia")).toBeTruthy();
		await userEvent.click(
			screen.getByRole("button", { name: "Start writing" }),
		);

		expect(client.saveSettings).toHaveBeenCalledWith({
			site: { name: "rimzzlabs", url: "https://rimzzlabs.com" },
			languages: { languages: ["en", "id"], defaultLanguage: "id" },
		});
		expect(client.openPage).toHaveBeenCalledWith("/");
	});

	it("shows why a save failed, and keeps the answers", async () => {
		client.saveSettings.mockResolvedValue(R.Error("offline"));
		renderOnboarding();
		await fillSite("rimzzlabs");
		await userEvent.click(screen.getByRole("button", { name: "Continue" }));
		await userEvent.click(
			screen.getByRole("button", { name: "Start writing" }),
		);

		expect(screen.getByRole("alert").textContent).toContain("Offline.");
		expect(client.openPage).not.toHaveBeenCalled();
		expect(
			screen
				.getByRole("button", { name: "Start writing" })
				.hasAttribute("disabled"),
		).toBe(false);
	});

	it("goes back to the step before", async () => {
		renderOnboarding();
		await fillSite("rimzzlabs");
		await userEvent.click(screen.getByRole("button", { name: "Continue" }));
		await userEvent.click(screen.getByRole("button", { name: "Back" }));
		expect(screen.getByText("Step 2 of 3")).toBeTruthy();
		await userEvent.click(screen.getByRole("button", { name: "Back" }));
		expect(screen.getByLabelText("Site name")).toHaveProperty(
			"value",
			"rimzzlabs",
		);
	});
});
