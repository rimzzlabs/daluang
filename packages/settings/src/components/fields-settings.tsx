import { EXTRA_FIELDS_MAX } from "@daluang/notes/extra-fields";
import { CORE_FIELDS } from "@daluang/notes/metadata";
import { Badge } from "@daluang/ui/components/badge";
import { Button } from "@daluang/ui/components/button";
import { A, R } from "@mobily/ts-belt";
import { PlusIcon } from "@phosphor-icons/react";
import { type FormEvent, useState } from "react";
import { saveSettings } from "../client";
import {
	type FieldDraft,
	type FieldErrors,
	fieldDrafts,
	newFieldDraft,
	openSuggestions,
	parseFieldDrafts,
} from "../field-drafts";
import { FIELD_SUGGESTIONS } from "../field-suggestions";
import { settingsState } from "../settings";
import { type SettingsStore, useSettings } from "../settings-store";
import { FieldRow } from "./field-row";
import { type SaveState, SettingsForm } from "./settings-form";

export interface FieldsSettingsProps {
	store: SettingsStore;
}

const NO_ERRORS: FieldErrors = { rows: {} };

/**
 * The settings page of the extra fields: the fields that the site reads from each note,
 * after the core fields. The editor shows an input for each one.
 */
export function FieldsSettings(props: FieldsSettingsProps) {
	const settings = useSettings(props.store);
	const [drafts, setDrafts] = useState(() => fieldDrafts(settings.fields));
	const [errors, setErrors] = useState<FieldErrors>(NO_ERRORS);
	const [focusKey, setFocusKey] = useState<string | null>(null);
	const [save, setSave] = useState<SaveState>({ status: "idle" });
	const suggestions = openSuggestions({
		suggestions: FIELD_SUGGESTIONS,
		drafts,
	});
	const full = A.length(drafts) >= EXTRA_FIELDS_MAX;

	function change(next: readonly FieldDraft[]) {
		setDrafts(next);
		setErrors(NO_ERRORS);
		setSave({ status: "idle" });
	}

	function add(draft: FieldDraft) {
		change([...drafts, draft]);
		setFocusKey(draft.key);
	}

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const parsed = parseFieldDrafts(drafts);
		if (R.isError(parsed)) {
			setErrors(
				R.match(
					parsed,
					() => NO_ERRORS,
					(found) => found,
				),
			);
			return;
		}
		setSave({ status: "saving" });
		const saved = await saveSettings({ fields: R.getExn(parsed) });
		R.match(
			saved,
			(stored) => {
				const state = settingsState(stored);
				if (state.status === "complete") props.store.write(state.settings);
				setSave({ status: "saved" });
			},
			(error) => setSave({ status: "failed", error }),
		);
	}

	return (
		<SettingsForm
			title="Fields"
			description="The fields that your site reads from each note, after the core fields. The editor shows an input for each one."
			save={save}
			onSubmit={submit}
		>
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

			{A.isEmpty(drafts) ? (
				<p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
					No extra fields. Add a field when your site reads more than the core
					fields, for example featured or relatedPosts.
				</p>
			) : (
				<ul className="flex flex-col gap-3" aria-label="Extra fields">
					{A.map(drafts, (draft) => (
						<FieldRow
							key={draft.key}
							draft={draft}
							errors={errors.rows[draft.key] ?? {}}
							focus={draft.key === focusKey}
							onChange={(next) =>
								change(
									A.map(drafts, (item) =>
										item.key === next.key ? next : item,
									),
								)
							}
							onRemove={() =>
								change(A.reject(drafts, (item) => item.key === draft.key))
							}
						/>
					))}
				</ul>
			)}

			{errors.list === undefined ? null : (
				<p role="alert" className="text-sm text-destructive">
					{errors.list}
				</p>
			)}

			<div className="flex flex-col gap-3">
				<Button
					type="button"
					variant="outline"
					className="self-start"
					disabled={full}
					onClick={() => add(newFieldDraft())}
				>
					<PlusIcon data-icon="inline-start" />
					Add a field
				</Button>
				{A.isEmpty(suggestions) || full ? null : (
					<div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
						<span>Common fields:</span>
						{A.map(suggestions, (suggestion) => (
							<Button
								key={suggestion.name}
								type="button"
								variant="ghost"
								size="xs"
								className="font-mono"
								aria-label={`Add the field ${suggestion.name}`}
								onClick={() => add(newFieldDraft(suggestion))}
							>
								<PlusIcon data-icon="inline-start" />
								{suggestion.name}
							</Button>
						))}
					</div>
				)}
			</div>
		</SettingsForm>
	);
}
