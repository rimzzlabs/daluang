import type { NoteDraft } from "@daluang/notes/note";
import {
	emptyNoteForm,
	type NoteFormErrors,
	parseNoteForm,
} from "@daluang/notes/note-form";
import { Button, buttonVariants } from "@daluang/ui/components/button";
import {
	Page,
	PageDescription,
	PageHeader,
	PageHeading,
	PageTitle,
} from "@daluang/ui/components/page";
import { Spinner } from "@daluang/ui/components/spinner";
import { R } from "@mobily/ts-belt";
import { type SyntheticEvent, useState } from "react";
import { NavLink, type NavLinkKind } from "@/components/shell/nav-link";
import { useSettings } from "@/hooks/settings/use-settings";
import { addNote, NOTES_ERROR_MESSAGES } from "@/lib/notes/client";
import type { SettingsStore } from "@/lib/settings/settings-store";
import { PostForm } from "./post-form";

export interface NewPostProps {
	settings: SettingsStore;
	linkKind: NavLinkKind;
	/** The post is a draft on the server now. The page opens the list of posts. */
	onSaved: () => void;
}

type SaveState =
	| { status: "idle" }
	| { status: "saving" }
	| { status: "failed"; message: string };

/** The page of a new post: the form, and Save draft, which adds the post as a draft. */
export function NewPost(props: NewPostProps) {
	const { languages, fields } = useSettings(props.settings);
	const rules = { languages, fields };
	const [form, setForm] = useState(() => emptyNoteForm(rules));
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
			await addNote(draft),
			() => props.onSaved(),
			(error) =>
				setSave({ status: "failed", message: NOTES_ERROR_MESSAGES[error] }),
		);
	}

	return (
		<Page>
			<PageHeader>
				<PageHeading>
					<PageTitle>New post</PageTitle>
					<PageDescription>
						Write the post, then save it as a draft. Publish it from the list of
						posts.
					</PageDescription>
				</PageHeading>
			</PageHeader>
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
					onChange={setForm}
				/>
				{save.status === "failed" ? (
					<p role="alert" className="text-sm text-destructive">
						{save.message}
					</p>
				) : null}
				<div className="flex justify-end gap-2">
					<NavLink
						kind={props.linkKind}
						href="/posts"
						className={buttonVariants({ variant: "outline" })}
					>
						Cancel
					</NavLink>
					<Button type="submit" disabled={saving}>
						{saving ? <Spinner data-icon="inline-start" /> : null}
						Save draft
					</Button>
				</div>
			</form>
		</Page>
	);
}
