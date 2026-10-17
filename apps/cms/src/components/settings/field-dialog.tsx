import type { FieldDefinition } from "@daluang/notes/field-definitions";
import {
	type FieldDraft,
	type FieldErrors,
	fieldDrafts,
	parseFieldDrafts,
} from "@daluang/settings/field-drafts";
import { Button } from "@daluang/ui/components/button";
import {
	ResponsiveDialog,
	ResponsiveDialogClose,
	ResponsiveDialogContent,
	ResponsiveDialogDescription,
	ResponsiveDialogFooter,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
} from "@daluang/ui/components/responsive-dialog";
import { Spinner } from "@daluang/ui/components/spinner";
import { A, R } from "@mobily/ts-belt";
import { type FormEvent, useState } from "react";
import {
	SAVE_ERROR_MESSAGES,
	type SaveSettingsError,
} from "@/lib/settings/client";
import { FieldForm } from "./field-form";

/** What the dialog does: add a field, or change the field at `index`. */
export type FieldEdit =
	| { kind: "add"; draft: FieldDraft }
	| { kind: "edit"; draft: FieldDraft; index: number };

export interface FieldDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** The edit of this opening. The dialog keeps it while it closes. */
	edit: FieldEdit;
	/** The stored fields. The new list replaces them. */
	fields: readonly FieldDefinition[];
	onSave: (
		fields: readonly FieldDefinition[],
	) => Promise<R.Result<true, SaveSettingsError>>;
}

type SaveState =
	| { status: "idle"; errors: FieldErrors }
	| { status: "saving" }
	| { status: "failed"; error: SaveSettingsError };

const NO_ERRORS: FieldErrors = { rows: {} };

interface DraftPlace {
	fields: readonly FieldDefinition[];
	edit: FieldEdit;
	draft: FieldDraft;
}

/** The list of drafts with the draft of the edit in its place. */
function withDraft(params: DraftPlace): readonly FieldDraft[] {
	const drafts = fieldDrafts(params.fields);
	if (params.edit.kind === "add") return [...drafts, params.draft];
	const { index } = params.edit;
	return A.mapWithIndex(drafts, (at, item) =>
		at === index ? params.draft : item,
	);
}

interface FieldDialogBodyProps extends FieldDialogProps {
	onPendingChange: (pending: boolean) => void;
}

function FieldDialogBody(props: FieldDialogBodyProps) {
	const [draft, setDraft] = useState(props.edit.draft);
	const [state, setState] = useState<SaveState>({
		status: "idle",
		errors: NO_ERRORS,
	});
	const errors = state.status === "idle" ? state.errors : NO_ERRORS;
	const pending = state.status === "saving";

	async function save(next: readonly FieldDefinition[]) {
		setState({ status: "saving" });
		props.onPendingChange(true);
		const saved = await props.onSave(next);
		props.onPendingChange(false);
		R.match(
			saved,
			() => props.onOpenChange(false),
			(error) => setState({ status: "failed", error }),
		);
	}

	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		R.match(
			parseFieldDrafts(
				withDraft({ fields: props.fields, edit: props.edit, draft }),
			),
			(next) => {
				save(next);
			},
			(found) => setState({ status: "idle", errors: found }),
		);
	}

	return (
		<form className="flex flex-col gap-6" noValidate onSubmit={submit}>
			<FieldForm
				draft={draft}
				errors={errors.rows[draft.key] ?? {}}
				onChange={(next) => {
					setDraft(next);
					setState({ status: "idle", errors: NO_ERRORS });
				}}
			/>
			{errors.list === undefined && state.status !== "failed" ? null : (
				<p role="alert" className="text-sm text-destructive">
					{state.status === "failed"
						? SAVE_ERROR_MESSAGES[state.error]
						: errors.list}
				</p>
			)}
			<ResponsiveDialogFooter>
				<ResponsiveDialogClose variant="outline" disabled={pending}>
					Cancel
				</ResponsiveDialogClose>
				<Button type="submit" disabled={pending}>
					{pending ? <Spinner data-icon="inline-start" /> : null}
					{props.edit.kind === "add" ? "Add the field" : "Save the field"}
				</Button>
			</ResponsiveDialogFooter>
		</form>
	);
}

/** The dialog that adds an extra field or changes one, and saves the list at once. */
export function FieldDialog(props: FieldDialogProps) {
	const [pending, setPending] = useState(false);
	const adding = props.edit.kind === "add";
	return (
		<ResponsiveDialog
			open={props.open}
			onOpenChange={(open) => {
				if (!pending) props.onOpenChange(open);
			}}
		>
			<ResponsiveDialogContent showCloseButton={false}>
				<ResponsiveDialogHeader>
					<ResponsiveDialogTitle>
						{adding ? "Add a field" : `Change ${props.edit.draft.label}`}
					</ResponsiveDialogTitle>
					<ResponsiveDialogDescription>
						The editor shows an input for the field on each post. Your site
						reads it by its name in the frontmatter.
					</ResponsiveDialogDescription>
				</ResponsiveDialogHeader>
				<FieldDialogBody
					key={props.edit.draft.key}
					{...props}
					onPendingChange={setPending}
				/>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
}
