import type { Note, NoteDraft } from "@daluang/notes/note";
import {
	type NoteForm,
	type NoteFormErrors,
	noteFormOf,
	parseNoteForm,
} from "@daluang/notes/note-form";
import { Button, buttonVariants } from "@daluang/ui/components/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@daluang/ui/components/sheet";
import { useIsWide } from "@daluang/ui/hooks/use-wide";
import { A, D, pipe, R } from "@mobily/ts-belt";
import { useEffect, useEffectEvent, useState } from "react";
import { NavLink, type NavLinkKind } from "@/components/shell/nav-link";
import { AUTOSAVE_RETRY_MS, useAutosave } from "@/hooks/notes/use-autosave";
import { useSettings } from "@/hooks/settings/use-settings";
import type { ChangesStore } from "@/lib/notes/changes-store";
import {
	type AutosaveOutcome,
	NOTES_ERROR_MESSAGES,
	type NotesError,
	refreshChangeCount,
	SAVE_ERROR_OUTCOMES,
	saveNote,
} from "@/lib/notes/client";
import type { SettingsStore } from "@/lib/settings/settings-store";
import { PostBodyField, PostDetailsFields } from "./post-form";
import { PostStatusBar, type SaveState } from "./post-status-bar";
import { UnsavedPostGuard } from "./unsaved-post-guard";

export interface EditPostFormProps {
	note: Note;
	settings: SettingsStore;
	changes: ChangesStore;
	linkKind: NavLinkKind;
	/** The server saved the post. The page keeps the saved post. */
	onSaved: (note: Note) => void;
}

const RETRY_SECONDS = AUTOSAVE_RETRY_MS / 1000;

/**
 * The message of a save error. After a refused save, the writer must change a value. After
 * a failed save, the text is not saved, and the autosave tries again.
 */
function saveErrorMessage(error: NotesError): string {
	if (SAVE_ERROR_OUTCOMES[error] === "refused")
		return NOTES_ERROR_MESSAGES[error];
	const retry = `Daluang tries again in ${RETRY_SECONDS} seconds.`;
	if (error === "signed-out")
		return `Not saved: your session ended. Sign in again in another tab. The text stays on this page, and ${retry}`;
	if (error === "offline")
		return `Not saved: Daluang could not reach the server. ${retry}`;
	return `Not saved: the server could not save the post. ${retry}`;
}

/** The status after a save ends. A change during the save keeps its status "pending". */
function afterSave(next: SaveState): (current: SaveState) => SaveState {
	return (current) => (current.status === "saving" ? next : current);
}

/**
 * The form of a stored post: the body in the middle, and the details in a panel at the
 * right from 80rem (`xl`), or in a sheet on a smaller screen. It saves the working copy about 1 s after the writer stops
 * (`useAutosave`). The sites change only at Publish changes, so a save is safe. A value
 * that is not valid shows its error, and the save waits for a valid post. A save of a
 * published post changes only its working copy, so the navbar reads the number of changes
 * again.
 */
export function EditPostForm(props: EditPostFormProps) {
	const { languages, fields } = useSettings(props.settings);
	const rules = { languages, fields };
	const [form, setForm] = useState(() => noteFormOf(props.note, fields));
	const [errors, setErrors] = useState<NoteFormErrors>({});
	const [save, setSave] = useState<SaveState>({ status: "idle" });
	const [detailsOpen, setDetailsOpen] = useState(false);
	const isWide = useIsWide();

	async function saveForm(next: NoteForm): Promise<AutosaveOutcome> {
		const draft = R.match(
			parseNoteForm(next, rules),
			(valid): NoteDraft | null => valid,
			(found) => {
				setErrors(found);
				setSave({ status: "invalid" });
				return null;
			},
		);
		if (draft === null) return "refused";
		setErrors({});
		setSave({ status: "saving" });
		return R.match(
			await saveNote({ id: props.note.id, draft }),
			(note): AutosaveOutcome => {
				setSave(afterSave({ status: "saved" }));
				props.onSaved(note);
				refreshChangeCount(props.changes);
				return "saved";
			},
			(error) => {
				const message = saveErrorMessage(error);
				setSave(afterSave({ status: "failed", message }));
				return SAVE_ERROR_OUTCOMES[error];
			},
		);
	}

	const autosave = useAutosave(saveForm);

	const saveNow = useEffectEvent((event: globalThis.KeyboardEvent) => {
		if (event.key !== "s" || !(event.metaKey || event.ctrlKey)) return;
		event.preventDefault();
		autosave.flush();
	});

	// Mod-S saves at once, as in other editors. The window gets the key from each input, also
	// from the editor of the body and from the sheet of the details.
	useEffect(() => {
		window.addEventListener("keydown", saveNow, true);
		return () => window.removeEventListener("keydown", saveNow, true);
	}, []);

	const fieldProps = {
		value: form,
		errors,
		languages: languages.languages,
		definitions: fields,
		onChange: (next: NoteForm) => {
			setForm(next);
			setSave({ status: "pending" });
			autosave.schedule(next);
		},
	};
	const detailErrors = pipe(
		errors,
		D.keys,
		A.reject((path) => path === "body"),
		A.length,
	);

	return (
		<form
			noValidate
			className="flex w-full flex-1 flex-col gap-6 xl:flex-row xl:items-start"
			onSubmit={(event) => event.preventDefault()}
		>
			<div className="flex min-w-0 flex-1 flex-col gap-4">
				{isWide ? null : (
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="self-end"
						onClick={() => setDetailsOpen(true)}
					>
						Details
						{/* A flex box shows no space here, but a screen reader needs it. */}
						{detailErrors === 0 ? null : " "}
						{detailErrors === 0 ? null : (
							<span className="text-destructive">
								{detailErrors === 1 ? "1 error" : `${detailErrors} errors`}
							</span>
						)}
					</Button>
				)}
				<PostBodyField {...fieldProps} />
				<PostStatusBar body={form.body} save={save} />
				{/* The guard needs the router, so the HTML of the server has no guard. */}
				{props.linkKind === "router" ? (
					<UnsavedPostGuard
						save={save}
						hasUnsaved={autosave.hasUnsaved}
						isInvalid={() => R.isError(parseNoteForm(form, rules))}
					/>
				) : null}
				<div className="flex justify-end gap-2">
					<NavLink
						kind={props.linkKind}
						href="/posts"
						className={buttonVariants({ variant: "outline" })}
					>
						Back to the posts
					</NavLink>
				</div>
			</div>
			{/* One copy of the details at a time, so each input keeps one ID. */}
			{isWide ? (
				<aside
					aria-label="Details"
					className="w-80 shrink-0 border-l border-border pl-6"
				>
					<PostDetailsFields {...fieldProps} />
				</aside>
			) : (
				<Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
					<SheetContent side="right" className="w-full sm:max-w-md">
						<SheetHeader>
							<SheetTitle>Details</SheetTitle>
						</SheetHeader>
						<div className="overflow-y-auto px-4 pb-6">
							<PostDetailsFields {...fieldProps} />
						</div>
					</SheetContent>
				</Sheet>
			)}
		</form>
	);
}
