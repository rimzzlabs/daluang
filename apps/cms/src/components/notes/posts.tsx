import {
	inLanguage,
	type ListedNote,
	type NoteAction,
	type NoteMarkAction,
} from "@daluang/notes/note-list";
import { Button, buttonVariants } from "@daluang/ui/components/button";
import {
	Empty,
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
import { Skeleton } from "@daluang/ui/components/skeleton";
import { A, R } from "@mobily/ts-belt";
import { PlusIcon, TranslateIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { match } from "ts-pattern";
import { NavLink, type NavLinkKind } from "@/components/shell/nav-link";
import { useSettings } from "@/hooks/settings/use-settings";
import type { ChangesStore } from "@/lib/notes/changes-store";
import {
	listPostsOfCms,
	markNoteOfCms,
	NOTES_ERROR_MESSAGES,
	type NotesError,
} from "@/lib/notes/client";
import type { SettingsStore } from "@/lib/settings/settings-store";
import { DeletePostDialog } from "./delete-post-dialog";
import { LanguageFilter } from "./language-filter";
import { NoPosts } from "./no-posts";
import { PostList } from "./post-list";

type ListState =
	| { status: "loading" }
	| { status: "ready"; posts: readonly ListedNote[] }
	| { status: "failed"; error: NotesError };

/** Reads the posts. The navbar gets the number of changes of the server. */
async function readPosts(changes: ChangesStore): Promise<ListState> {
	return R.match(
		await listPostsOfCms(),
		(list): ListState => {
			changes.write(list.count);
			return { status: "ready", posts: list.posts };
		},
		(error): ListState => ({ status: "failed", error }),
	);
}

interface DeleteTarget {
	open: boolean;
	/** The dialog keeps the post while it closes, so its title does not change. */
	post: ListedNote | null;
}

export interface PostsProps {
	settings: SettingsStore;
	changes: ChangesStore;
	linkKind: NavLinkKind;
}

/**
 * The posts page: each post with its language, its status, and the change that waits for
 * Publish changes. The menu of a post marks it for Publish changes, cancels its mark, or
 * deletes it. A CMS with more than one language can show the posts of one language. With
 * no post, the page shows the steps to set up a site.
 */
export function Posts(props: PostsProps) {
	const { changes } = props;
	const { languages } = useSettings(props.settings).languages;
	const [list, setList] = useState<ListState>({ status: "loading" });
	const [language, setLanguage] = useState<string | null>(null);
	const [markError, setMarkError] = useState<NotesError | null>(null);
	const [deleting, setDeleting] = useState<DeleteTarget>({
		open: false,
		post: null,
	});

	// The posts are on the server, an external system. The page reads them when it opens.
	useEffect(() => {
		let current = true;
		readPosts(changes).then((state) => {
			if (current) setList(state);
		});
		return () => {
			current = false;
		};
	}, [changes]);

	async function mark(post: ListedNote, action: NoteMarkAction) {
		setMarkError(null);
		const result = await markNoteOfCms({ id: post.note.id, action });
		const error = R.match(
			result,
			(): NotesError | null => null,
			(failed) => failed,
		);
		setMarkError(error);
		if (error === null) setList(await readPosts(changes));
	}

	function act(post: ListedNote, action: NoteAction) {
		if (action === "delete") {
			setDeleting({ open: true, post });
			return;
		}
		mark(post, action);
	}

	async function reload() {
		setList(await readPosts(changes));
	}

	async function retry() {
		setList({ status: "loading" });
		setList(await readPosts(changes));
	}

	if (list.status === "ready" && A.isEmpty(list.posts))
		return <NoPosts linkKind={props.linkKind} />;

	return (
		<Page>
			<PageHeader>
				<PageHeading>
					<PageTitle>Posts</PageTitle>
					<PageDescription>
						The posts of the CMS, the last changed first. A change goes to your
						site when you select Publish changes.
					</PageDescription>
				</PageHeading>
				<PageActions>
					<NavLink
						kind={props.linkKind}
						href="/posts/new"
						className={buttonVariants()}
					>
						<PlusIcon data-icon="inline-start" />
						New post
					</NavLink>
				</PageActions>
			</PageHeader>
			{match(list)
				.with({ status: "loading" }, () => (
					<div role="status" className="flex flex-col gap-2">
						<span className="sr-only">Loading the posts</span>
						<Skeleton className="h-16 w-full" />
						<Skeleton className="h-16 w-full" />
						<Skeleton className="h-16 w-full" />
					</div>
				))
				.with({ status: "failed" }, (failed) => (
					<div role="alert" className="flex flex-col items-start gap-3 text-sm">
						<p className="text-destructive">
							{NOTES_ERROR_MESSAGES[failed.error]}
						</p>
						<Button type="button" variant="outline" size="sm" onClick={retry}>
							Try again
						</Button>
					</div>
				))
				.with({ status: "ready" }, (ready) => {
					const shown = inLanguage(ready.posts, language);
					return (
						<>
							{A.length(languages) > 1 ? (
								<LanguageFilter
									languages={languages}
									value={language}
									onChange={setLanguage}
								/>
							) : null}
							{markError === null ? null : (
								<p role="alert" className="text-sm text-destructive">
									{NOTES_ERROR_MESSAGES[markError]}
								</p>
							)}
							{A.isEmpty(shown) ? (
								<Empty className="flex-none border border-border p-8">
									<EmptyHeader>
										<EmptyMedia variant="icon">
											<TranslateIcon />
										</EmptyMedia>
										<EmptyTitle>No posts in this language</EmptyTitle>
										<EmptyDescription>
											Choose All to see the posts of each language.
										</EmptyDescription>
									</EmptyHeader>
								</Empty>
							) : (
								<PostList
									posts={shown}
									linkKind={props.linkKind}
									onAction={act}
								/>
							)}
						</>
					);
				})
				.exhaustive()}
			<DeletePostDialog
				open={deleting.open}
				post={deleting.post}
				onOpenChange={(open) => setDeleting({ ...deleting, open })}
				onDeleted={reload}
			/>
		</Page>
	);
}
