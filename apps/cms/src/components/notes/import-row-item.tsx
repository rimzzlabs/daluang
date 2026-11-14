import type { FieldDefinition } from "@daluang/notes/field-definitions";
import { Badge } from "@daluang/ui/components/badge";
import { A } from "@mobily/ts-belt";
import { match } from "ts-pattern";
import { CHANGE_LABELS, STATUS_LABELS } from "@/lib/notes/change-labels";
import {
	importFailureMessage,
	importIssueMessages,
	importWarningMessage,
} from "@/lib/notes/import-messages";
import type { ImportRow, RowState } from "@/lib/notes/import-run";

interface RowView {
	label: string;
	variant: "outline" | "secondary" | "default" | "destructive";
	/** The first line is a sentence, and each next line is an item of a list. */
	lines: readonly string[];
}

function rowView(state: RowState, fields: readonly FieldDefinition[]): RowView {
	return match(state)
		.with(
			{ status: "waiting" },
			(): RowView => ({
				label: "Not sent yet",
				variant: "outline",
				lines: [],
			}),
		)
		.with(
			{ status: "importing" },
			(): RowView => ({
				label: "In progress",
				variant: "outline",
				lines: [],
			}),
		)
		.with({ status: "imported" }, (imported): RowView => {
			const { note, warnings } = imported.post;
			const marked = note.mark === "publish";
			return {
				label: marked ? CHANGE_LABELS.publish : STATUS_LABELS.draft,
				variant: marked ? "default" : "secondary",
				lines: A.isEmpty(warnings)
					? []
					: [
							"Check the post before you publish it.",
							...A.map(warnings, importWarningMessage),
						],
			};
		})
		.with(
			{ status: "skipped" },
			(): RowView => ({
				label: "Skipped",
				variant: "secondary",
				lines: [importFailureMessage({ code: "slug-taken" })],
			}),
		)
		.with({ status: "failed" }, (failed): RowView => {
			const { failure } = failed;
			const issues =
				failure.code === "invalid-note"
					? importIssueMessages(failure.issues, fields)
					: [];
			return {
				label: "Failed",
				variant: "destructive",
				lines: [importFailureMessage(failure), ...issues],
			};
		})
		.exhaustive();
}

export interface ImportRowItemProps {
	row: ImportRow;
	fields: readonly FieldDefinition[];
}

/** One file of an import: its name, its state, and its warnings or its failure. */
export function ImportRowItem(props: ImportRowItemProps) {
	const view = rowView(props.row.state, props.fields);
	const [first, ...items] = view.lines;
	// Two issues of one list can give the same line. The line shows one time.
	const rest = A.uniq(items);
	return (
		<li className="flex flex-col gap-1 rounded-lg border border-border p-3">
			<div className="flex items-center justify-between gap-2">
				<span className="truncate font-mono text-xs">
					{props.row.file.name}
				</span>
				<Badge variant={view.variant}>{view.label}</Badge>
			</div>
			{first === undefined ? null : (
				<p className="text-muted-foreground">{first}</p>
			)}
			{A.isEmpty(rest) ? null : (
				<ul className="ml-4 flex list-disc flex-col gap-1 text-muted-foreground">
					{A.map(rest, (line) => (
						<li key={line}>{line}</li>
					))}
				</ul>
			)}
		</li>
	);
}
