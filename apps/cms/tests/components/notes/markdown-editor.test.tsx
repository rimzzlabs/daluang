// @vitest-environment jsdom
import { EditorView } from "@codemirror/view";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, onTestFinished, vi } from "vitest";
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

	it("applies a toolbar action to the selection, and undoes it", async () => {
		const onChange = vi.fn();
		render(<MarkdownEditor {...editorProps(onChange)} />);
		const view = EditorView.findFromDOM(
			screen.getByRole("textbox", { name: "Body" }),
		);
		act(() => view?.dispatch({ selection: { anchor: 2, head: 7 } }));
		await userEvent.click(screen.getByRole("button", { name: "Bold" }));
		expect(onChange).toHaveBeenLastCalledWith("# **Jotai**");
		expect(
			view?.state.sliceDoc(
				view.state.selection.main.from,
				view.state.selection.main.to,
			),
		).toBe("Jotai");
		await userEvent.click(screen.getByRole("button", { name: "Undo" }));
		expect(onChange).toHaveBeenLastCalledWith("# Jotai");
		await userEvent.click(screen.getByRole("button", { name: "Redo" }));
		expect(onChange).toHaveBeenLastCalledWith("# **Jotai**");
	});

	it("applies bold, italic, and link with the keys of the editor", () => {
		const onChange = vi.fn();
		render(<MarkdownEditor {...editorProps(onChange)} />);
		const content = screen.getByRole("textbox", { name: "Body" });
		const view = EditorView.findFromDOM(content);
		act(() => view?.dispatch({ selection: { anchor: 7 } }));
		for (const key of ["b", "i", "k"]) {
			act(() => {
				fireEvent.keyDown(content, { key, ctrlKey: true });
			});
		}
		expect(onChange).toHaveBeenLastCalledWith("# Jotai**_[text](https://)_**");
	});

	it("numbers the lines", () => {
		render(<MarkdownEditor {...editorProps()} />);
		expect(document.querySelector(".cm-lineNumbers")?.textContent).toContain(
			"1",
		);
	});

	// jsdom does not apply a policy. In a browser, the meta is in the head before the editor
	// loads, so the style element has the nonce when CodeMirror inserts it.
	it("gives the nonce of the page to CodeMirror and to its style element", () => {
		const meta = document.createElement("meta");
		meta.setAttribute("property", "csp-nonce");
		meta.nonce = "abc=";
		document.head.appendChild(meta);
		onTestFinished(() => {
			meta.remove();
		});
		render(<MarkdownEditor {...editorProps()} />);
		const host = document.querySelector<HTMLElement>(".cm-editor");
		const editor = host === null ? null : EditorView.findFromDOM(host);
		expect(editor?.state.facet(EditorView.cspNonce)).toBe("abc=");
		const style = Array.from(document.head.querySelectorAll("style")).find(
			(element) => element.textContent?.includes(".cm-") ?? false,
		);
		expect(style?.nonce).toBe("abc=");
	});
});
