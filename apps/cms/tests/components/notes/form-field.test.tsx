// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormField } from "@/components/notes/form-field";

describe("FormField", () => {
	it("shows the label, the control, and the help text", () => {
		render(
			<FormField
				id="f"
				label="Keywords"
				optional
				help="Use commas."
				error={undefined}
			>
				<input id="f" aria-describedby="f-help" />
			</FormField>,
		);
		const input = screen.getByRole("textbox", { name: "Keywords (optional)" });
		expect(input.getAttribute("aria-describedby")).toBe("f-help");
		expect(document.getElementById("f-help")?.textContent).toBe("Use commas.");
	});

	it("shows the error in place of the help text", () => {
		render(
			<FormField
				id="f"
				label="Title"
				help="Help."
				error="Give the post a title."
			>
				<input id="f" />
			</FormField>,
		);
		expect(screen.getByRole("alert").textContent).toBe(
			"Give the post a title.",
		);
		expect(screen.queryByText("Help.")).toBeNull();
	});

	it("shows no help with no help text", () => {
		const { container } = render(
			<FormField id="f" label="Title" error={undefined}>
				<input id="f" />
			</FormField>,
		);
		expect(container.querySelector("#f-help")).toBeNull();
	});
});
