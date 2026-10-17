import { EXTRA_FIELDS_MAX } from "@daluang/notes/extra-fields";
import type { FieldDefinition } from "@daluang/notes/field-definitions";
import { CORE_FIELDS } from "@daluang/notes/metadata";
import { Badge } from "@daluang/ui/components/badge";
import { Button } from "@daluang/ui/components/button";
import { ConfirmDialog } from "@daluang/ui/components/confirm-dialog";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@daluang/ui/components/empty";
import {
	Page,
	PageActions,
	PageDescription,
	PageHeader,
	PageHeading,
	PageTitle,
} from "@daluang/ui/components/page";
import { A, R } from "@mobily/ts-belt";
import { ListDashesIcon, PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import {
	SAVE_ERROR_MESSAGES,
	type SaveSettingsError,
	saveSettings,
} from "../client";
import { fieldDrafts, newFieldDraft, openSuggestions } from "../field-drafts";
import { FIELD_SUGGESTIONS } from "../field-suggestions";
import { settingsState } from "../settings";
import { type SettingsStore, useSettings } from "../settings-store";
import { FieldDialog, type FieldEdit } from "./field-dialog";
import { FieldList } from "./field-list";

export interface FieldsSettingsProps {
	store: SettingsStore;
}

interface EditTarget {
	open: boolean;
	edit: FieldEdit;
}

interface RemoveTarget {
	open: boolean;
	/** The dialog keeps the field while it closes, so its title does not change. */
	index: number;
	field: FieldDefinition | null;
}

type RemoveState =
	| { status: "idle" }
	| { status: "removing" }
	| { status: "failed"; error: SaveSettingsError };

/**
 * The settings page of the extra fields: the fields that the site reads from each note,
 * after the core fields. Each change happens in a dialog, and saves at once.
 */
export function FieldsSettings(props: FieldsSettingsProps) {
	const { fields } = useSettings(props.store);
	const [editing, setEditing] = useState<EditTarget>({
		open: false,
		edit: { kind: "add", draft: newFieldDraft() },
	});
	const [removing, setRemoving] = useState<RemoveTarget>({
		open: false,
		index: -1,
		field: null,
	});
	const [remove, setRemove] = useState<RemoveState>({ status: "idle" });
	const suggestions = openSuggestions({
		suggestions: FIELD_SUGGESTIONS,
		drafts: fieldDrafts(fields),
	});
	const full = A.length(fields) >= EXTRA_FIELDS_MAX;

	async function saveFields(
		next: readonly FieldDefinition[],
	): Promise<R.Result<true, SaveSettingsError>> {
		const saved = await saveSettings({ fields: [...next] });
		return R.map(saved, (stored) => {
			const state = settingsState(stored);
			if (state.status === "complete") props.store.write(state.settings);
			return true as const;
		});
	}

	function add(suggestion?: FieldDefinition) {
		setEditing({
			open: true,
			edit: { kind: "add", draft: newFieldDraft(suggestion) },
		});
	}

	async function removeNow() {
		setRemove({ status: "removing" });
		const saved = await saveFields(A.removeAt(fields, removing.index));
		R.match(
			saved,
			() => {
				setRemove({ status: "idle" });
				setRemoving({ ...removing, open: false });
			},
			(error) => setRemove({ status: "failed", error }),
		);
	}

	const addButton = (
		<Button type="button" disabled={full} onClick={() => add()}>
			<PlusIcon data-icon="inline-start" />
			Add a field
		</Button>
	);

	const commonFields =
		A.isEmpty(suggestions) || full ? null : (
			<div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
				<span>Common fields:</span>
				{A.map(suggestions, (suggestion) => (
					<Button
						key={suggestion.name}
						type="button"
						variant="outline"
						size="sm"
						className="font-mono max-sm:h-11"
						aria-label={`Add the field ${suggestion.name}`}
						onClick={() => add(suggestion)}
					>
						<PlusIcon data-icon="inline-start" />
						{suggestion.name}
					</Button>
				))}
			</div>
		);

	return (
		<Page>
			<PageHeader>
				<PageHeading>
					<PageTitle>Fields</PageTitle>
					<PageDescription>
						The fields that your site reads from each note, after the core
						fields. The editor shows an input for each one.
					</PageDescription>
				</PageHeading>
				<PageActions>{addButton}</PageActions>
			</PageHeader>

			<div className="flex flex-col gap-2">
				<p className="text-sm font-medium">Each note has these core fields</p>
				<ul className="flex flex-wrap gap-1.5" aria-label="Core fields">
					{A.map(CORE_FIELDS, (field) => (
						<li key={field}>
							<Badge variant="secondary" className="font-mono">
								{field}
							</Badge>
						</li>
					))}
				</ul>
			</div>

			{A.isEmpty(fields) ? (
				<Empty className="flex-none border border-border p-8">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<ListDashesIcon />
						</EmptyMedia>
						<EmptyTitle>No extra fields</EmptyTitle>
						<EmptyDescription>
							Add a field when your site reads more than the core fields, for
							example featured or relatedPosts.
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>{commonFields}</EmptyContent>
				</Empty>
			) : (
				<div className="flex flex-col gap-3">
					<FieldList
						fields={fields}
						onEdit={(index) => {
							const [draft] = fieldDrafts(A.slice(fields, index, 1));
							if (draft !== undefined)
								setEditing({
									open: true,
									edit: { kind: "edit", draft, index },
								});
						}}
						onRemove={(index) =>
							setRemoving({ open: true, index, field: fields[index] ?? null })
						}
					/>
					{commonFields}
				</div>
			)}

			<FieldDialog
				open={editing.open}
				onOpenChange={(open) => setEditing({ ...editing, open })}
				edit={editing.edit}
				fields={fields}
				onSave={saveFields}
			/>
			<ConfirmDialog
				open={removing.open}
				onOpenChange={(open) => {
					if (remove.status === "removing") return;
					setRemoving({ ...removing, open });
					setRemove({ status: "idle" });
				}}
				title={`Remove ${removing.field?.label ?? "the field"}?`}
				description="The editor no longer shows the field. Your site reads the notes with no such field."
				confirmLabel="Remove the field"
				destructive
				pending={remove.status === "removing"}
				error={
					remove.status === "failed" ? SAVE_ERROR_MESSAGES[remove.error] : null
				}
				onConfirm={removeNow}
			/>
		</Page>
	);
}
