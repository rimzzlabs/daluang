import type { Note } from "@daluang/notes/note";
import { Badge } from "@daluang/ui/components/badge";
import { buttonVariants } from "@daluang/ui/components/button";
import {
	Page,
	PageDescription,
	PageHeader,
	PageHeading,
	PageTitle,
} from "@daluang/ui/components/page";
import { Skeleton } from "@daluang/ui/components/skeleton";
import { R } from "@mobily/ts-belt";
import { useEffect, useState } from "react";
import { match } from "ts-pattern";
import { NavLink, type NavLinkKind } from "@/components/shell/nav-link";
import { STATUS_LABELS } from "@/lib/notes/change-labels";
import type { ChangesStore } from "@/lib/notes/changes-store";
import {
	NOTES_ERROR_MESSAGES,
	type NotesError,
	readNote,
} from "@/lib/notes/client";
import type { SettingsStore } from "@/lib/settings/settings-store";
import { EditPostForm } from "./edit-post-form";

type LoadState =
	| { status: "loading" }
	| { status: "ready"; note: Note }
	| { status: "failed"; error: NotesError };

export interface EditPostProps {
	/** The ID of the post. */
	id: string;
	settings: SettingsStore;
	changes: ChangesStore;
	linkKind: NavLinkKind;
}

/** The page of a stored post: it reads the post, then shows its form. */
export function EditPost(props: EditPostProps) {
	const { id } = props;
	const [load, setLoad] = useState<LoadState>({ status: "loading" });

	// The post is on the server, an external system. The page reads it when it opens.
	useEffect(() => {
		let current = true;
		readNote(id).then((result) => {
			if (!current) return;
			setLoad(
				R.match(
					result,
					(note): LoadState => ({ status: "ready", note }),
					(error): LoadState => ({ status: "failed", error }),
				),
			);
		});
		return () => {
			current = false;
		};
	}, [id]);

	return (
		<Page>
			<PageHeader>
				<PageHeading>
					<PageTitle className="flex items-center gap-2">
						Edit post
						{load.status === "ready" ? (
							<Badge
								variant={
									load.note.status === "published" ? "secondary" : "outline"
								}
							>
								{STATUS_LABELS[load.note.status]}
							</Badge>
						) : null}
					</PageTitle>
					<PageDescription>
						Change the post, then save it. A published post changes on your site
						at Publish changes.
					</PageDescription>
				</PageHeading>
			</PageHeader>
			{match(load)
				.with({ status: "loading" }, () => (
					<div role="status" className="flex max-w-3xl flex-col gap-4">
						<span className="sr-only">Loading the post</span>
						<Skeleton className="h-9 w-full" />
						<Skeleton className="h-9 w-full" />
						<Skeleton className="h-80 w-full" />
					</div>
				))
				.with({ status: "failed" }, (failed) => (
					<div role="alert" className="flex flex-col items-start gap-3 text-sm">
						<p className="text-destructive">
							{NOTES_ERROR_MESSAGES[failed.error]}
						</p>
						<NavLink
							kind={props.linkKind}
							href="/"
							className={buttonVariants({ variant: "outline", size: "sm" })}
						>
							Back to the posts
						</NavLink>
					</div>
				))
				.with({ status: "ready" }, (ready) => (
					<EditPostForm
						note={ready.note}
						settings={props.settings}
						changes={props.changes}
						linkKind={props.linkKind}
						onSaved={(note) => setLoad({ status: "ready", note })}
					/>
				))
				.exhaustive()}
		</Page>
	);
}
