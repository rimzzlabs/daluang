import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { cn } from "cn";
import { useEffect, useEffectEvent, useRef, useState } from "react";

// The colors come from the tokens of the theme, so the editor follows the dark theme.
const MARKDOWN_STYLE = HighlightStyle.define([
	{ tag: tags.heading, fontWeight: "600" },
	{ tag: tags.strong, fontWeight: "600" },
	{ tag: tags.emphasis, fontStyle: "italic" },
	{ tag: tags.strikethrough, textDecoration: "line-through" },
	{ tag: [tags.link, tags.url], textDecoration: "underline" },
	{
		tag: [
			tags.processingInstruction,
			tags.contentSeparator,
			tags.meta,
			tags.quote,
			tags.monospace,
		],
		color: "var(--muted-foreground)",
	},
]);

const EDITOR_THEME = EditorView.theme({
	"&": { minHeight: "20rem", backgroundColor: "transparent" },
	"&.cm-focused": { outline: "none" },
	".cm-scroller": {
		fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
		lineHeight: "1.6",
	},
	".cm-content": { padding: "0.75rem", caretColor: "var(--foreground)" },
	".cm-cursor": { borderLeftColor: "var(--foreground)" },
});

export interface MarkdownEditorProps {
	/** The ID of the editable element. */
	id: string;
	/** The name of the editor for a screen reader. */
	label: string;
	/** The text when the editor opens. The editor keeps its own text after that. */
	defaultValue: string;
	invalid: boolean;
	/** The ID of the help text or of the error. */
	describedBy: string;
	onChange: (value: string) => void;
}

/**
 * The editor of the Markdown body: CodeMirror 6 with the syntax of Markdown, the undo
 * history, and the default keys. It keeps the text as the writer types it.
 */
export function MarkdownEditor(props: MarkdownEditorProps) {
	const host = useRef<HTMLDivElement>(null);
	const view = useRef<EditorView | null>(null);
	const change = useEffectEvent((value: string) => props.onChange(value));
	// A new text from the form does not make a new editor. The editor keeps its own text.
	const [initial] = useState(props.defaultValue);
	const { id, label } = props;

	// CodeMirror is an external system: it owns its DOM and its state. The effect makes the
	// editor one time and destroys it when the component goes away.
	useEffect(() => {
		const parent = host.current;
		if (parent === null) return;
		const editor = new EditorView({
			parent,
			state: EditorState.create({
				doc: initial,
				extensions: [
					history(),
					keymap.of([...defaultKeymap, ...historyKeymap]),
					markdown(),
					syntaxHighlighting(MARKDOWN_STYLE),
					EditorView.lineWrapping,
					EDITOR_THEME,
					EditorView.contentAttributes.of({ id, "aria-label": label }),
					EditorView.updateListener.of((update) => {
						if (update.docChanged) change(update.state.doc.toString());
					}),
				],
			}),
		});
		view.current = editor;
		return () => {
			editor.destroy();
			view.current = null;
		};
	}, [id, label, initial]);

	// The form knows when the text is not valid. CodeMirror keeps an attribute that its own
	// extensions do not set.
	const { invalid, describedBy } = props;
	useEffect(() => {
		const content = view.current?.contentDOM;
		content?.setAttribute("aria-invalid", String(invalid));
		content?.setAttribute("aria-describedby", describedBy);
	}, [invalid, describedBy]);

	return (
		<div
			ref={host}
			className={cn(
				"w-full overflow-hidden rounded-xl border border-input bg-input/30 text-base transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 md:text-sm",
				props.invalid &&
					"border-destructive ring-[3px] ring-destructive/20 dark:border-destructive/50 dark:ring-destructive/40",
			)}
		/>
	);
}
