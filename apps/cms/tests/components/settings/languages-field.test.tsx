// @vitest-environment jsdom

import type { LanguagesChoice } from "@daluang/settings/languages-choice";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { LanguagesField } from "@/components/settings/languages-field";

interface HarnessProps {
	initial: LanguagesChoice;
	onChange: (next: LanguagesChoice) => void;
}

function Harness(props: HarnessProps) {
	const [value, setValue] = useState(props.initial);
	return (
		<LanguagesField
			value={value}
			onChange={(next) => {
				setValue(next);
				props.onChange(next);
			}}
		/>
	);
}

function renderField(initial: LanguagesChoice) {
	const onChange = vi.fn();
	render(<Harness initial={initial} onChange={onChange} />);
	return onChange;
}

function chip(name: RegExp) {
	return screen.getByRole("button", { name });
}

describe("LanguagesField", () => {
	it("marks each chosen language as pressed", () => {
		renderField({ languages: ["en", "id"], defaultLanguage: "en" });
		expect(chip(/English/).getAttribute("aria-pressed")).toBe("true");
		expect(chip(/Indonesia/).getAttribute("aria-pressed")).toBe("true");
		expect(chip(/Español/).getAttribute("aria-pressed")).toBe("false");
	});

	it("shows the most used languages by their own name", () => {
		renderField({ languages: ["en"], defaultLanguage: "en" });
		expect(chip(/中文/)).toBeTruthy();
		expect(chip(/हिन्दी/)).toBeTruthy();
		expect(chip(/العربية/)).toBeTruthy();
		expect(
			screen.queryByRole("button", { name: /Sundanese|Javanese/ }),
		).toBeNull();
	});

	it("gives the default to the next language when the default leaves", async () => {
		const onChange = renderField({
			languages: ["en", "id"],
			defaultLanguage: "en",
		});
		await userEvent.click(chip(/English/));
		expect(onChange).toHaveBeenLastCalledWith({
			languages: ["id"],
			defaultLanguage: "id",
		});
	});

	it("keeps the last language", async () => {
		const onChange = renderField({ languages: ["en"], defaultLanguage: "en" });
		await userEvent.click(chip(/English/));
		expect(chip(/English/).getAttribute("aria-pressed")).toBe("true");
		expect(onChange).not.toHaveBeenCalledWith(
			expect.objectContaining({ languages: [] }),
		);
	});

	it("tells the writer the default when there is one language", () => {
		renderField({ languages: ["en"], defaultLanguage: "en" });
		expect(
			screen.getByText(
				"English. Select one more language to choose another one.",
			),
		).toBeTruthy();
		expect(screen.queryByRole("radio")).toBeNull();
	});

	it("sets the language of a new note", async () => {
		const onChange = renderField({
			languages: ["en", "id"],
			defaultLanguage: "en",
		});
		await userEvent.click(screen.getByRole("radio", { name: "Indonesia" }));
		expect(onChange).toHaveBeenLastCalledWith({
			languages: ["en", "id"],
			defaultLanguage: "id",
		});
	});

	it("adds a typed language, which stays a choice after the writer unselects it", async () => {
		const onChange = renderField({ languages: ["en"], defaultLanguage: "en" });
		const field = screen.getByLabelText("Another language");
		await userEvent.type(field, "pt-br{Enter}");
		expect(onChange).toHaveBeenLastCalledWith({
			languages: ["en", "pt-BR"],
			defaultLanguage: "en",
		});
		expect(field).toHaveProperty("value", "");
		await userEvent.click(chip(/pt-BR/));
		expect(chip(/pt-BR/).getAttribute("aria-pressed")).toBe("false");
	});

	it("adds a typed language with the button", async () => {
		const onChange = renderField({ languages: ["en"], defaultLanguage: "en" });
		await userEvent.type(screen.getByLabelText("Another language"), "nl");
		await userEvent.click(screen.getByRole("button", { name: "Add" }));
		expect(onChange).toHaveBeenLastCalledWith({
			languages: ["en", "nl"],
			defaultLanguage: "en",
		});
	});

	it("refuses a word that is not a language tag", async () => {
		const onChange = renderField({ languages: ["en"], defaultLanguage: "en" });
		await userEvent.type(
			screen.getByLabelText("Another language"),
			"english{Enter}",
		);
		expect(screen.getByRole("alert").textContent).toContain(
			'"english" is not a language tag.',
		);
		expect(onChange).not.toHaveBeenCalled();
	});
});
