// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LanguageFilter } from "@/components/notes/language-filter";

describe("LanguageFilter", () => {
	it("names each language, and gives the chosen one", async () => {
		const onChange = vi.fn();
		render(
			<LanguageFilter
				languages={["en", "id"]}
				value={null}
				onChange={onChange}
			/>,
		);
		expect(
			screen.getByRole("button", { name: "All" }).getAttribute("aria-pressed"),
		).toBe("true");
		await userEvent.click(screen.getByRole("button", { name: "Indonesia" }));
		expect(onChange).toHaveBeenLastCalledWith("id");
	});

	it("gives null for All, and for a click on the chosen language", async () => {
		const onChange = vi.fn();
		render(
			<LanguageFilter
				languages={["en", "id"]}
				value="en"
				onChange={onChange}
			/>,
		);
		await userEvent.click(screen.getByRole("button", { name: "English" }));
		expect(onChange).toHaveBeenLastCalledWith(null);
		await userEvent.click(screen.getByRole("button", { name: "All" }));
		expect(onChange).toHaveBeenLastCalledWith(null);
	});
});
