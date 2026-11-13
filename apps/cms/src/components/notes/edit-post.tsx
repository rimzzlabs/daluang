import type { Note } from "@daluang/notes/note";
import { Badge } from "@daluang/ui/components/badge";
import { buttonVariants } from "@daluang/ui/components/button";
import {
	Page,
	PageActions,
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
import { usePublishCount } from "@/hooks/notes/use-change-count";
import { useSettings } from "@/hooks/settings/use-settings";
import { STATUS_LABELS } from "@/lib/notes/change-labels";
import type { ChangesStore } from "@/lib/notes/changes-store";
import {
	NOTES_ERROR_MESSAGES,
	type NotesError,
	readNote,
} from "@/lib/notes/client";
import type { SettingsStore } from "@/lib/settings/settings-store";
import { EditPostForm } from "./edit-post-form";
import { TranslatePost } from "./translate-post";

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
	/** Opens the page of another post, for example a new translation. */
	onOpenPost: (id: string) => void;
	/** The server saved the post, so a list of the posts can read it again. */
	onSaved: () => void;
}

interface NoteMerge {
	/** The note that gives each field that the writer changes. */
	saved: Note;
	/** The note that gives each field that only Publish changes changes. */
	published: Note;
}

/** One note from two: a save never changes the status, the published copy, or the mark. */
function mergeNote(merge: NoteMerge): Note {
	const { saved, published } = merge;
	return {
		...saved,
		status: published.status,
		publishedAt: published.publishedAt,
		published: published.published,
		mark: published.mark,
	};
}

interface PostRead {
	/** The state on the page before the read. */
	shown: LoadState;
	result: R.Result<Note, NotesError>;
}

/**
 * The state after a read of the post. A read again after Publish changes takes only the
 * fields of Publish changes, so an old answer does not replace a newer save. When it fails,
 * the form stays, with the exception of a post that Publish changes deleted.
 */
function afterRead(read: PostRead): LoadState {
	const { shown, result } = read;
	return R.match(
		result,
		(note): LoadState => {
			if (shown.status !== "ready") return { status: "ready", note };
			const merged = mergeNote({ saved: shown.note, published: note });
			return { status: "ready", note: merged };
		},
		(error): LoadState => {
			if (shown.status === "ready" && error !== "not-found") return shown;
			return { status: "failed", error };
		},
	);
}

/**
 * The state after a save. The save takes the fields of the writer, and keeps the fields of
 * Publish changes on the page, so an answer that comes after Publish changes keeps the status.
 */
function afterSave(saved: Note): (shown: LoadState) => LoadState {
	return (shown) => {
		if (shown.status !== "ready") return { status: "ready", note: saved };
		const merged = mergeNote({ saved, published: shown.note });
		return { status: "ready", note: merged };
	};
}

/** The page of a stored post: it reads the post, then shows its form. */
export function EditPost(props: EditPostProps) {
	const { id } = props;
	const [load, setLoad] = useState<LoadState>({ status: "loading" });
	const { languages } = useSettings(props.settings).languages;
	const published = usePublishCount(props.changes);

	// The post is on the server, an external system. The page reads it when it opens, and
	// again after Publish changes, so the status shows the published post.
	// biome-ignore lint/correctness/useExhaustiveDependencies: a new `published` reads the post again.
	useEffect(() => {
		let current = true;
		readNote(id).then((result) => {
			if (current) setLoad((shown) => afterRead({ shown, result }));
		});
		return () => {
			current = false;
		};
	}, [id, published]);

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
				{load.status === "ready" ? (
					<PageActions>
						<TranslatePost
							note={load.note}
							languages={languages}
							onTranslated={props.onOpenPost}
						/>
					</PageActions>
				) : null}
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
							href="/posts"
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
						onSaved={(note) => {
							setLoad(afterSave(note));
							props.onSaved();
						}}
					/>
				))
				.exhaustive()}
		</Page>
	);
}
