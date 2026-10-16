// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { focusSiteError, SiteFields } from "../../src/components/site-fields";

describe("SiteFields", () => {
	it("gives each change of a field", async () => {
		const onChange = vi.fn();
		render(
			<SiteFields
				value={{ name: "", url: "" }}
				errors={{}}
				onChange={onChange}
			/>,
		);
		await userEvent.type(screen.getByLabelText("Site name"), "r");
		expect(onChange).toHaveBeenLastCalledWith({ name: "r", url: "" });
		await userEvent.type(screen.getByLabelText(/Site address/), "h");
		expect(onChange).toHaveBeenLastCalledWith({ name: "", url: "h" });
	});

	it("marks a field with an error and shows the message", () => {
		render(
			<SiteFields
				value={{ name: "", url: "x" }}
				errors={{ url: "Use an address." }}
				onChange={() => {}}
			/>,
		);
		const url = screen.getByLabelText(/Site address/);
		expect(url.getAttribute("aria-invalid")).toBe("true");
		expect(screen.getByRole("alert").textContent).toBe("Use an address.");
	});
});

describe("focusSiteError", () => {
	it("focuses the name first, then the address", () => {
		render(
			<form data-testid="form">
				<input name="name" />
				<input name="url" />
			</form>,
		);
		const form = screen.getByTestId("form");
		if (!(form instanceof HTMLFormElement)) throw new Error("No form.");
		focusSiteError({ form, errors: { name: "No name.", url: "No URL." } });
		expect(document.activeElement?.getAttribute("name")).toBe("name");
		focusSiteError({ form, errors: { url: "No URL." } });
		expect(document.activeElement?.getAttribute("name")).toBe("url");
	});
});
