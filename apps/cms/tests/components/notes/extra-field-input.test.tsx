// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ExtraFieldInput } from "@/components/notes/extra-field-input";

describe("ExtraFieldInput", () => {
	it("gives yes or no for a boolean field", async () => {
		const onChange = vi.fn();
		render(
			<ExtraFieldInput
				definition={{
					name: "featured",
					label: "Featured",
					type: "boolean",
					required: false,
				}}
				value={false}
				error={undefined}
				onChange={onChange}
			/>,
		);
		await userEvent.click(screen.getByRole("checkbox", { name: "Featured" }));
		expect(onChange).toHaveBeenCalledWith(true);
	});

	it("gives the text of a list field, with help for the commas", async () => {
		const onChange = vi.fn();
		render(
			<ExtraFieldInput
				definition={{
					name: "relatedPosts",
					label: "Related posts",
					type: "list",
					required: false,
				}}
				value=""
				error={undefined}
				onChange={onChange}
			/>,
		);
		const input = screen.getByRole("textbox", {
			name: "Related posts (optional)",
		});
		await userEvent.type(input, "a");
		expect(onChange).toHaveBeenLastCalledWith("a");
		expect(screen.getByText("Separate the items with commas.")).toBeTruthy();
	});

	it("asks for a decimal keyboard for a number, and shows its error", () => {
		render(
			<ExtraFieldInput
				definition={{
					name: "readingTime",
					label: "Reading time",
					type: "number",
					required: true,
				}}
				value="seven"
				error="Reading time needs a number."
				onChange={vi.fn()}
			/>,
		);
		const input = screen.getByRole("textbox", { name: "Reading time" });
		expect(input.getAttribute("inputmode")).toBe("decimal");
		expect(input.getAttribute("aria-invalid")).toBe("true");
		expect(screen.getByText("Reading time needs a number.")).toBeTruthy();
	});

	it("shows the error of a required boolean field", () => {
		render(
			<ExtraFieldInput
				definition={{
					name: "featured",
					label: "Featured",
					type: "boolean",
					required: true,
				}}
				value={true}
				error="Featured needs yes or no."
				onChange={vi.fn()}
			/>,
		);
		expect(screen.getByText("Featured needs yes or no.")).toBeTruthy();
	});
});
