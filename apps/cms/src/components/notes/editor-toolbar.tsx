import type { MarkdownEdit } from "@daluang/notes/markdown-edit";
import { Button } from "@daluang/ui/components/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@daluang/ui/components/tooltip";
import { A, pipe } from "@mobily/ts-belt";
import {
	ArrowUUpLeftIcon,
	ArrowUUpRightIcon,
	CodeBlockIcon,
	CodeIcon,
	type Icon,
	LinkSimpleIcon,
	ListBulletsIcon,
	ListNumbersIcon,
	MinusIcon,
	NoteIcon,
	QuotesIcon,
	TableIcon,
	TextBIcon,
	TextHIcon,
	TextItalicIcon,
	TextStrikethroughIcon,
} from "@phosphor-icons/react";
import { type KeyboardEvent, useState } from "react";

/** An action of the toolbar: a text change, or a command of the undo history. */
export type ToolbarAction = MarkdownEdit | "undo" | "redo";

interface ToolbarItem {
	action: ToolbarAction;
	label: string;
	icon: Icon;
}

// The groups follow the work of a writer: the history, the text, the lines, the blocks.
const GROUPS: readonly (readonly ToolbarItem[])[] = [
	[
		{ action: "undo", label: "Undo", icon: ArrowUUpLeftIcon },
		{ action: "redo", label: "Redo", icon: ArrowUUpRightIcon },
	],
	[
		{ action: "heading", label: "Heading", icon: TextHIcon },
		{ action: "bold", label: "Bold", icon: TextBIcon },
		{ action: "italic", label: "Italic", icon: TextItalicIcon },
		{
			action: "strikethrough",
			label: "Strikethrough",
			icon: TextStrikethroughIcon,
		},
		{ action: "code", label: "Inline code", icon: CodeIcon },
	],
	[
		{ action: "quote", label: "Quote", icon: QuotesIcon },
		{ action: "bullet-list", label: "Bullet list", icon: ListBulletsIcon },
		{ action: "numbered-list", label: "Numbered list", icon: ListNumbersIcon },
	],
	[
		{ action: "link", label: "Link", icon: LinkSimpleIcon },
		{ action: "code-block", label: "Code block", icon: CodeBlockIcon },
		{ action: "table", label: "Table", icon: TableIcon },
		{ action: "rule", label: "Horizontal rule", icon: MinusIcon },
		{ action: "callout", label: "Callout component", icon: NoteIcon },
	],
];

const ITEMS = A.flat(GROUPS);

const MOVES: Record<string, (index: number, last: number) => number> = {
	ArrowRight: (index, last) => (index === last ? 0 : index + 1),
	ArrowLeft: (index, last) => (index === 0 ? last : index - 1),
	Home: () => 0,
	End: (_, last) => last,
};

export interface EditorToolbarProps {
	onAction: (action: ToolbarAction) => void;
}

/**
 * The toolbar above the body. It is a toolbar of WAI-ARIA: Tab goes to one button, and the
 * arrow keys, Home, and End move between the buttons.
 */
export function EditorToolbar(props: EditorToolbarProps) {
	const [focused, setFocused] = useState(0);
	const last = A.length(ITEMS) - 1;

	function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		const move = MOVES[event.key];
		if (move === undefined) return;
		event.preventDefault();
		const next = move(focused, last);
		setFocused(next);
		const buttons = event.currentTarget.querySelectorAll("button");
		buttons.item(next).focus();
	}

	return (
		<div
			role="toolbar"
			aria-label="Formatting"
			className="flex flex-wrap items-center gap-0.5 border-b border-border p-1"
			onKeyDown={onKeyDown}
		>
			{A.mapWithIndex(GROUPS, (groupIndex, group) => (
				<div key={groupIndex} className="flex items-center gap-0.5">
					{groupIndex === 0 ? null : (
						<span aria-hidden className="mx-1 h-5 w-px bg-border" />
					)}
					{A.map(group, (item) => {
						const index = pipe(
							ITEMS,
							A.getIndexBy((other) => other.action === item.action),
						);
						return (
							<Tooltip key={item.action}>
								<TooltipTrigger
									render={
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											aria-label={item.label}
											tabIndex={index === focused ? 0 : -1}
											onFocus={() => setFocused(index ?? 0)}
											onClick={() => props.onAction(item.action)}
										/>
									}
								>
									<item.icon />
								</TooltipTrigger>
								<TooltipContent>{item.label}</TooltipContent>
							</Tooltip>
						);
					})}
				</div>
			))}
		</div>
	);
}
