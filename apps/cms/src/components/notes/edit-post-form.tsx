import type { Note, NoteDraft } from "@daluang/notes/note";
import {
	type NoteForm,
	type NoteFormErrors,
	noteFormOf,
	parseNoteForm,
} from "@daluang/notes/note-form";
import { buttonVariants } from "@daluang/ui/components/button";
import { R } from "@mobily/ts-belt";
import { type KeyboardEvent, useState } from "react";
import { NavLink, type NavLinkKind } from "@/components/shell/nav-link";
import { useAutosave } from "@/hooks/notes/use-autosave";
import { useSettings } from "@/hooks/settings/use-settings";
import type { ChangesStore } from "@/lib/notes/changes-store";
import {
	NOTES_ERROR_MESSAGES,
	refreshChangeCount,
	saveNote,
} from "@/lib/notes/client";
import type { SettingsStore } from "@/lib/settings/settings-store";
import { PostForm } from "./post-form";
import { PostStatusBar, type SaveState } from "./post-status-bar";

export interface EditPostFormProps {
	note: Note;
	settings: SettingsStore;
	changes: ChangesStore;
	linkKind: NavLinkKind;
	/** The server saved the post. The page keeps the saved post. */
	onSaved: (note: Note) => void;
}

/**
 * The form of a stored post. It saves the working copy about 1 s after the writer stops
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

	async function saveForm(next: NoteForm) {
		const draft = R.match(
			parseNoteForm(next, rules),
			(valid): NoteDraft | null => valid,
			(found) => {
				setErrors(found);
				setSave({ status: "invalid" });
				return null;
			},
		);
		if (draft === null) return;
		setErrors({});
		setSave({ status: "saving" });
		R.match(
			await saveNote({ id: props.note.id, draft }),
			(note) => {
				setSave({ status: "saved" });
				props.onSaved(note);
				refreshChangeCount(props.changes);
			},
			(error) =>
				setSave({ status: "failed", message: NOTES_ERROR_MESSAGES[error] }),
		);
	}

	const autosave = useAutosave(saveForm);

	// Mod-S saves at once, as in other editors. The key comes up from each input, also from
	// the editor of the body.
	function onKeyDown(event: KeyboardEvent<HTMLFormElement>) {
		if (event.key !== "s" || !(event.metaKey || event.ctrlKey)) return;
		event.preventDefault();
		autosave.flush();
	}

	return (
		<form
			noValidate
			className="flex w-full max-w-3xl flex-col gap-6"
			onSubmit={(event) => event.preventDefault()}
			onKeyDown={onKeyDown}
		>
			<PostForm
				value={form}
				errors={errors}
				languages={languages.languages}
				definitions={fields}
				onChange={(next) => {
					setForm(next);
					setSave({ status: "pending" });
					autosave.schedule(next);
				}}
			/>
			<PostStatusBar body={form.body} save={save} />
			<div className="flex justify-end gap-2">
				<NavLink
					kind={props.linkKind}
					href="/posts"
					className={buttonVariants({ variant: "outline" })}
				>
					Back to the posts
				</NavLink>
			</div>
		</form>
	);
}
