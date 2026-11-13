import type { Note, NoteDraft } from "@daluang/notes/note";
import {
	type NoteFormErrors,
	noteFormOf,
	parseNoteForm,
} from "@daluang/notes/note-form";
import { Button, buttonVariants } from "@daluang/ui/components/button";
import { Spinner } from "@daluang/ui/components/spinner";
import { R } from "@mobily/ts-belt";
import { type SyntheticEvent, useState } from "react";
import { NavLink, type NavLinkKind } from "@/components/shell/nav-link";
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
 * The form of a stored post, and Save. A save of a published post changes only its
 * working copy, so the navbar reads the number of changes again.
 */
export function EditPostForm(props: EditPostFormProps) {
	const { languages, fields } = useSettings(props.settings);
	const rules = { languages, fields };
	const [form, setForm] = useState(() => noteFormOf(props.note, fields));
	const [errors, setErrors] = useState<NoteFormErrors>({});
	const [save, setSave] = useState<SaveState>({ status: "idle" });
	const saving = save.status === "saving";

	async function submit(event: SyntheticEvent<HTMLFormElement>) {
		event.preventDefault();
		const draft = R.match(
			parseNoteForm(form, rules),
			(valid): NoteDraft | null => valid,
			(found) => {
				setErrors(found);
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

	return (
		<form
			noValidate
			className="flex w-full max-w-3xl flex-col gap-6"
			onSubmit={submit}
		>
			<PostForm
				value={form}
				errors={errors}
				languages={languages.languages}
				definitions={fields}
				onChange={(next) => {
					setForm(next);
					if (save.status === "saved") setSave({ status: "idle" });
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
				<Button type="submit" disabled={saving}>
					{saving ? <Spinner data-icon="inline-start" /> : null}
					Save
				</Button>
			</div>
		</form>
	);
}
