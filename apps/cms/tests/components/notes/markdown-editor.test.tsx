// @vitest-environment jsdom
import { EditorView } from "@codemirror/view";
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MarkdownEditor } from "@/components/notes/markdown-editor";
import { typeInEditor } from "./editor";

function editorProps(onChange = vi.fn()) {
	return {
		id: "body",
		label: "Body",
		defaultValue: "# Jotai",
		invalid: false,
		describedBy: "body-help",
		onChange,
	};
}

describe("MarkdownEditor", () => {
	it("shows the first text, and gives each change", async () => {
		const onChange = vi.fn();
		render(<MarkdownEditor {...editorProps(onChange)} />);
		const content = screen.getByRole("textbox", { name: "Body" });
		expect(content.id).toBe("body");
		expect(content.textContent).toBe("# Jotai");
		await typeInEditor("Body", "\n\nHi");
		expect(onChange).toHaveBeenLastCalledWith("# Jotai\n\nHi");
	});

	it("keeps its own text when the form gives a new first text", () => {
		const { rerender } = render(<MarkdownEditor {...editorProps()} />);
		rerender(<MarkdownEditor {...editorProps()} defaultValue="Other" />);
		expect(screen.getByRole("textbox", { name: "Body" }).textContent).toBe(
			"# Jotai",
		);
	});

	it("tells a screen reader when the text is not valid", () => {
		const { rerender } = render(<MarkdownEditor {...editorProps()} />);
		const content = screen.getByRole("textbox", { name: "Body" });
		expect(content.getAttribute("aria-invalid")).toBe("false");
		rerender(
			<MarkdownEditor {...editorProps()} invalid describedBy="body-error" />,
		);
		expect(content.getAttribute("aria-invalid")).toBe("true");
		expect(content.getAttribute("aria-describedby")).toBe("body-error");
	});

	it("gives no change for a move of the cursor", () => {
		const onChange = vi.fn();
		render(<MarkdownEditor {...editorProps(onChange)} />);
		const view = EditorView.findFromDOM(
			screen.getByRole("textbox", { name: "Body" }),
		);
		act(() => view?.dispatch({ selection: { anchor: 2 } }));
		expect(view?.state.selection.main.head).toBe(2);
		expect(onChange).not.toHaveBeenCalled();
	});
});
