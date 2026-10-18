import { EditorView } from "@codemirror/view";
import { act, screen } from "@testing-library/react";

/**
 * Types text at the end of the Markdown editor with the label, after the editor loads. jsdom sends no input events
 * that CodeMirror reads, so the helper gives the change to CodeMirror, as its input does.
 */
export async function typeInEditor(label: string, text: string): Promise<void> {
	const content = await screen.findByRole("textbox", { name: label });
	const view = EditorView.findFromDOM(content);
	if (view === null) throw new Error(`No editor has the label ${label}.`);
	act(() => {
		view.dispatch({ changes: { from: view.state.doc.length, insert: text } });
	});
}
