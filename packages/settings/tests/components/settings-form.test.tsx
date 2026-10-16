// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	type SaveState,
	SettingsForm,
} from "../../src/components/settings-form";

function renderForm(save: SaveState) {
	render(
		<SettingsForm
			title="Site"
			description="The site that shows your notes."
			save={save}
			onSubmit={(event) => event.preventDefault()}
		>
			<p>Fields</p>
		</SettingsForm>,
	);
}

describe("SettingsForm", () => {
	it("shows the title, the description, and the fields", () => {
		renderForm({ status: "idle" });
		expect(screen.getByRole("heading", { name: "Site" })).toBeTruthy();
		expect(screen.getByText("The site that shows your notes.")).toBeTruthy();
		expect(screen.getByText("Fields")).toBeTruthy();
		expect(screen.getByRole("status").textContent).toBe("");
	});

	it("turns off the save button during a save", () => {
		renderForm({ status: "saving" });
		expect(
			screen.getByRole("button", { name: /Save/ }).hasAttribute("disabled"),
		).toBe(true);
	});

	it("says that the settings saved", () => {
		renderForm({ status: "saved" });
		expect(screen.getByRole("status").textContent).toBe("Saved");
	});

	it("gives the message of a failed save", () => {
		renderForm({ status: "failed", error: "offline" });
		expect(screen.getByRole("status").textContent).toBe(
			"Daluang could not reach the server. Check your connection, then try again.",
		);
	});
});
