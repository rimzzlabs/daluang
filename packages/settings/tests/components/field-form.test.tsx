// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FieldForm } from "../../src/components/field-form";
import { newFieldDraft } from "../../src/field-drafts";

describe("FieldForm", () => {
	it("marks a field with an error and shows the message", () => {
		render(
			<FieldForm
				draft={newFieldDraft()}
				errors={{ label: "Give the field a label.", name: "Bad name." }}
				onChange={() => {}}
			/>,
		);
		expect(screen.getByLabelText("Label").getAttribute("aria-invalid")).toBe(
			"true",
		);
		expect(
			screen.getAllByRole("alert").map((alert) => alert.textContent),
		).toEqual(["Give the field a label.", "Bad name."]);
	});
});
