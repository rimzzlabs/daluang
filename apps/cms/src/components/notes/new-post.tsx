import type { Note } from "@daluang/notes/note";
import { type DraftRules, untitledDraft } from "@daluang/notes/note-draft";
import { Button, buttonVariants } from "@daluang/ui/components/button";
import {
	Page,
	PageDescription,
	PageHeader,
	PageHeading,
	PageTitle,
} from "@daluang/ui/components/page";
import { Skeleton } from "@daluang/ui/components/skeleton";
import { R } from "@mobily/ts-belt";
import { useEffect, useEffectEvent, useState } from "react";
import { NavLink, type NavLinkKind } from "@/components/shell/nav-link";
import { useSettings } from "@/hooks/settings/use-settings";
import {
	addNote,
	listNotesOfCms,
	NOTES_ERROR_MESSAGES,
	type NotesError,
} from "@/lib/notes/client";
import type { SettingsStore } from "@/lib/settings/settings-store";

export interface NewPostProps {
	settings: SettingsStore;
	linkKind: NavLinkKind;
	/** The server has the new draft. The page opens the page of the draft. */
	onCreated: (id: string) => void;
}

type StartState =
	| { status: "starting" }
	| { status: "failed"; error: NotesError };

/** Adds an untitled draft with a slug that its language does not have. */
async function startPost(
	rules: DraftRules,
): Promise<R.Result<Note, NotesError>> {
	return R.match(
		await listNotesOfCms(),
		(notes) => addNote(untitledDraft({ notes, rules })),
		(error) => Promise.resolve(R.Error<NotesError>(error)),
	);
}

/**
 * The page of `/posts/new`. It adds an untitled draft at once, then opens the page of the
 * draft. The editor can then save each change to a stored post.
 */
export function NewPost(props: NewPostProps) {
	const { languages, fields } = useSettings(props.settings);
	const [start, setStart] = useState<StartState>({ status: "starting" });

	const started = useEffectEvent(async (isCurrent: () => boolean) => {
		const result = await startPost({ languages, fields });
		if (!isCurrent()) return;
		R.match(
			result,
			(note) => props.onCreated(note.id),
			(error) => setStart({ status: "failed", error }),
		);
	});

	// The draft goes to the server, an external system. The page adds it when it opens, and
	// again after Try again.
	useEffect(() => {
		if (start.status !== "starting") return;
		let current = true;
		started(() => current);
		return () => {
			current = false;
		};
	}, [start]);

	return (
		<Page>
			<PageHeader>
				<PageHeading>
					<PageTitle>New post</PageTitle>
					<PageDescription>
						The CMS adds a draft, then opens it. Publish it from the list of
						posts.
					</PageDescription>
				</PageHeading>
			</PageHeader>
			{start.status === "starting" ? (
				<div role="status" className="flex max-w-3xl flex-col gap-4">
					<span className="sr-only">Adding the draft</span>
					<Skeleton className="h-9 w-full" />
					<Skeleton className="h-9 w-full" />
					<Skeleton className="h-80 w-full" />
				</div>
			) : (
				<div role="alert" className="flex flex-col items-start gap-3 text-sm">
					<p className="text-destructive">
						{NOTES_ERROR_MESSAGES[start.error]}
					</p>
					<div className="flex gap-2">
						<Button size="sm" onClick={() => setStart({ status: "starting" })}>
							Try again
						</Button>
						<NavLink
							kind={props.linkKind}
							href="/posts"
							className={buttonVariants({ variant: "outline", size: "sm" })}
						>
							Back to the posts
						</NavLink>
					</div>
				</div>
			)}
		</Page>
	);
}
