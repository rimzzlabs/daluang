import type { Note } from "@daluang/notes/note";
import { missingLanguages, translationDraft } from "@daluang/notes/translation";
import { languageLabel } from "@daluang/settings/language-label";
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
import { Skeleton } from "@daluang/ui/components/skeleton";
import { Spinner } from "@daluang/ui/components/spinner";
import { A, R } from "@mobily/ts-belt";
import { TranslateIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { match } from "ts-pattern";
import {
	addNote,
	listNotesOfCms,
	NOTES_ERROR_MESSAGES,
} from "@/lib/notes/client";

export interface TranslatePostProps {
	/** The saved post. */
	note: Note;
	/** The language tags of the CMS. */
	languages: readonly string[];
	/** The translation is a draft on the server now. The page opens it. */
	onTranslated: (id: string) => void;
}

type DialogState =
	| { status: "loading" }
	| { status: "ready"; missing: readonly string[] }
	| { status: "adding"; missing: readonly string[]; language: string }
	| { status: "failed"; missing: readonly string[]; message: string };

/**
 * Translate: a copy of the saved post as a new draft in another language, with the same
 * slug. The dialog shows each language that has no translation yet.
 */
export function TranslatePost(props: TranslatePostProps) {
	const [open, setOpen] = useState(false);
	const [state, setState] = useState<DialogState>({ status: "loading" });
	const adding = state.status === "adding";

	async function openDialog() {
		setOpen(true);
		setState({ status: "loading" });
		R.match(
			await listNotesOfCms(),
			(notes) =>
				setState({
					status: "ready",
					missing: missingLanguages({
						note: props.note,
						notes,
						languages: props.languages,
					}),
				}),
			(error) =>
				setState({
					status: "failed",
					missing: [],
					message: NOTES_ERROR_MESSAGES[error],
				}),
		);
	}

	async function translate(language: string) {
		if (state.status === "loading" || state.status === "adding") return;
		const { missing } = state;
		setState({ status: "adding", missing, language });
		R.match(
			await addNote(translationDraft(props.note, language)),
			(translation) => {
				setOpen(false);
				props.onTranslated(translation.id);
			},
			(error) =>
				setState({
					status: "failed",
					missing,
					message: NOTES_ERROR_MESSAGES[error],
				}),
		);
	}

	if (A.length(props.languages) < 2) return null;

	return (
		<>
			<Button type="button" variant="outline" onClick={openDialog}>
				<TranslateIcon data-icon="inline-start" />
				Translate
			</Button>
			<ResponsiveDialog
				open={open}
				onOpenChange={(next) => {
					if (!adding) setOpen(next);
				}}
			>
				<ResponsiveDialogContent showCloseButton={false}>
					<ResponsiveDialogHeader>
						<ResponsiveDialogTitle>Translate the post</ResponsiveDialogTitle>
						<ResponsiveDialogDescription>
							Daluang copies the saved post into a new draft in the language
							that you choose, with the same slug. Then you translate its text.
						</ResponsiveDialogDescription>
					</ResponsiveDialogHeader>
					{match(state)
						.with({ status: "loading" }, () => (
							<div className="flex flex-col gap-2">
								<Skeleton className="h-9 w-full" />
								<Skeleton className="h-9 w-full" />
							</div>
						))
						.otherwise((loaded) =>
							A.isEmpty(loaded.missing) ? (
								<p className="text-sm text-muted-foreground">
									Each language of the CMS has this post.
								</p>
							) : (
								<div className="flex flex-col gap-2">
									{A.map(loaded.missing, (language) => (
										<Button
											key={language}
											type="button"
											variant="outline"
											disabled={adding}
											onClick={() => translate(language)}
										>
											{loaded.status === "adding" &&
											loaded.language === language ? (
												<Spinner data-icon="inline-start" />
											) : null}
											{languageLabel(language)}
										</Button>
									))}
								</div>
							),
						)}
					{state.status === "failed" ? (
						<p role="alert" className="text-sm text-destructive">
							{state.message}
						</p>
					) : null}
					<ResponsiveDialogFooter>
						<ResponsiveDialogClose variant="outline" disabled={adding}>
							Cancel
						</ResponsiveDialogClose>
					</ResponsiveDialogFooter>
				</ResponsiveDialogContent>
			</ResponsiveDialog>
		</>
	);
}
