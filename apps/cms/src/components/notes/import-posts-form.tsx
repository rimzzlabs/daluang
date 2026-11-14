import type { FieldDefinition } from "@daluang/notes/field-definitions";
import type { LanguagesSetting } from "@daluang/notes/languages-setting";
import { languageLabel } from "@daluang/settings/language-label";
import { Button } from "@daluang/ui/components/button";
import {
	Field,
	FieldDescription,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@daluang/ui/components/field";
import {
	ResponsiveDialogClose,
	ResponsiveDialogFooter,
} from "@daluang/ui/components/responsive-dialog";
import { Spinner } from "@daluang/ui/components/spinner";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@daluang/ui/components/toggle-group";
import { A } from "@mobily/ts-belt";
import { useId } from "react";
import { match } from "ts-pattern";
import type { ImportRunHandle, RunState } from "@/hooks/notes/use-import-run";
import { importFailureMessage } from "@/lib/notes/import-messages";
import {
	finishedCount,
	type ImportRow,
	importSummary,
	importSummaryText,
	isToSend,
} from "@/lib/notes/import-run";
import { ImportRowItem } from "./import-row-item";

/** The line that a screen reader hears: the progress during a run, then the summary. */
function statusText(run: RunState, rows: readonly ImportRow[]): string {
	return match(run)
		.with({ status: "idle" }, () => "")
		.with(
			{ status: "running" },
			() =>
				`Import in progress: ${finishedCount(rows)} of ${A.length(rows)} files done.`,
		)
		.with({ status: "stopped" }, { status: "done" }, () =>
			importSummaryText(importSummary(rows)),
		)
		.exhaustive();
}

export interface ImportFormProps {
	languages: LanguagesSetting;
	fields: readonly FieldDefinition[];
	language: string;
	onLanguageChange: (language: string) => void;
	importRun: ImportRunHandle;
}

/**
 * The content of the Import dialog: the files, the language, a row for each file, the
 * status line, and the buttons. The state of the run comes from `importRun`.
 */
export function ImportForm(props: ImportFormProps) {
	const id = useId();
	const { languages, language } = props;
	const { rows, run, choose } = props.importRun;
	const running = run.status === "running";
	const idle = run.status === "idle";
	const summary = importSummary(rows);

	return (
		<div className="flex flex-col gap-5 text-sm">
			<Field>
				<FieldLabel htmlFor={`${id}-files`}>Markdown or MDX files</FieldLabel>
				<input
					id={`${id}-files`}
					type="file"
					multiple
					accept=".md,.mdx,text/markdown"
					disabled={!idle}
					aria-describedby={`${id}-files-help`}
					className="text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1"
					onChange={(event) => choose(Array.from(event.target.files ?? []))}
				/>
				<FieldDescription id={`${id}-files-help`}>
					{idle
						? "Each file becomes a draft. The frontmatter gives the title, the dates, and the other values."
						: "To import other files, select Done, then select Import again."}
				</FieldDescription>
			</Field>
			{A.length(languages.languages) > 1 ? (
				<FieldSet>
					<FieldLegend variant="label">Language</FieldLegend>
					<ToggleGroup
						variant="outline"
						size="sm"
						aria-label="Language"
						className="flex-wrap"
						disabled={!idle}
						value={[language]}
						onValueChange={(values) => {
							const [next] = values;
							if (typeof next === "string") props.onLanguageChange(next);
						}}
					>
						{A.map(languages.languages, (tag) => (
							<ToggleGroupItem key={tag} value={tag}>
								{languageLabel(tag)}
							</ToggleGroupItem>
						))}
					</ToggleGroup>
					<FieldDescription>
						Each file of this import gets this language.
					</FieldDescription>
				</FieldSet>
			) : null}
			{A.isEmpty(rows) ? null : (
				<ol className="flex max-h-80 flex-col gap-2 overflow-y-auto">
					{A.mapWithIndex(rows, (index, row) => (
						// Two files can have one name. The rows never change their order.
						<ImportRowItem key={index} row={row} fields={props.fields} />
					))}
				</ol>
			)}
			<p role="status">{statusText(run, rows)}</p>
			{run.status === "stopped" ? (
				<p role="alert" className="text-destructive">
					The import stopped. {importFailureMessage(run.failure)}
				</p>
			) : null}
			{run.status === "done" && summary.toPublish > 0 ? (
				<p>Select Publish changes to publish the posts with the mark.</p>
			) : null}
			{run.status === "done" && summary.imported > summary.toPublish ? (
				<p>Open each post with the label Draft, check it, then publish it.</p>
			) : null}
			<ResponsiveDialogFooter>
				<ResponsiveDialogClose variant="outline" disabled={running}>
					{idle ? "Cancel" : "Done"}
				</ResponsiveDialogClose>
				<Button
					type="button"
					disabled={running || !A.some(rows, isToSend)}
					onClick={() => props.importRun.start(language)}
				>
					{running ? <Spinner aria-hidden data-icon="inline-start" /> : null}
					Import
				</Button>
			</ResponsiveDialogFooter>
		</div>
	);
}
