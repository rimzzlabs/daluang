import { publishBlockers } from "@daluang/notes/note-form";
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
import { A, pipe, R } from "@mobily/ts-belt";
import {
	FileArrowUpIcon,
	PlusIcon,
	TranslateIcon,
} from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { match } from "ts-pattern";
import { NavLink, type NavLinkKind } from "@/components/shell/nav-link";
import { usePostList } from "@/hooks/notes/use-post-list";
import { useSettings } from "@/hooks/settings/use-settings";
import type { ChangesStore } from "@/lib/notes/changes-store";
import {
	markNoteOfCms,
	NOTES_ERROR_MESSAGES,
	type NotesError,
	readNote,
} from "@/lib/notes/client";
import type { SettingsStore } from "@/lib/settings/settings-store";
import { DeletePostDialog } from "./delete-post-dialog";
import { ImportPostsDialog } from "./import-posts-dialog";
import { LanguageFilter } from "./language-filter";
import { NoPosts } from "./no-posts";
import { PostLink } from "./post-link";
import { PostList } from "./post-list";

interface DeleteTarget {
	open: boolean;
	/** The dialog keeps the post while it closes, so its title does not change. */
	post: ListedNote | null;
}

/** The alert above the list: the message of a code, or the fields that block a publish. */
type MarkAlert =
	| { status: "code"; error: NotesError }
	| {
			status: "blocked";
			id: string;
			title: string;
			labels: readonly string[];
	  };

export interface PostsProps {
	settings: SettingsStore;
	changes: ChangesStore;
	linkKind: NavLinkKind;
}

/**
 * The posts page: each post with its language, its status, and the change that waits for
 * Publish changes. The menu of a post marks it for Publish changes, cancels its mark, or
 * deletes it. A CMS with more than one language can show the posts of one language. With
 * no post, the page links to a new post.
 */
export function Posts(props: PostsProps) {
	const { changes } = props;
	const settings = useSettings(props.settings);
	const { languages } = settings.languages;
	const { list, reload, retry } = usePostList(changes);
	const [language, setLanguage] = useState<string | null>(null);
	const latestMark = useRef(0);
	const [markAlert, setMarkAlert] = useState<MarkAlert | null>(null);
	const [importing, setImporting] = useState(false);
	// A new key at each open, so the Import dialog starts with no files.
	const [importKey, setImportKey] = useState(0);
	// The Import button of the page: of `NoPosts`, or of the header.
	const importButton = useRef<HTMLButtonElement>(null);
	const [deleting, setDeleting] = useState<DeleteTarget>({
		open: false,
		post: null,
	});

	/** The fields that stop a publish, or `null` when the note cannot tell them. */
	async function blockedAlert(post: ListedNote): Promise<MarkAlert | null> {
		const read = await readNote(post.note.id);
		const note = R.getWithDefault(read, null);
		if (note === null) return null;
		const labels = pipe(
			publishBlockers(note, {
				languages: settings.languages,
				fields: settings.fields,
			}),
			A.map((blocker) => blocker.label),
		);
		if (A.isEmpty(labels)) return null;
		return { status: "blocked", id: note.id, title: note.title, labels };
	}

	async function mark(post: ListedNote, action: NoteMarkAction) {
		latestMark.current += 1;
		const turn = latestMark.current;
		setMarkAlert(null);
		const result = await markNoteOfCms({ id: post.note.id, action });
		const error = R.match(
			result,
			(): NotesError | null => null,
			(failed) => failed,
		);
		if (error === null) {
			await reload();
			return;
		}
		const blocked =
			error === "invalid" && action === "publish"
				? await blockedAlert(post)
				: null;
		if (turn !== latestMark.current) return;
		setMarkAlert(blocked ?? { status: "code", error });
	}

	function act(post: ListedNote, action: NoteAction) {
		if (action === "delete") {
			setDeleting({ open: true, post });
			return;
		}
		mark(post, action);
	}

	function openImport() {
		setImportKey((key) => key + 1);
		setImporting(true);
	}

	// The Import dialog stays at one place of the tree. It then keeps its rows when the
	// first posts of the CMS come, and the page changes from `NoPosts` to the list.
	return (
		<>
			{list.status === "ready" && A.isEmpty(list.posts) ? (
				<NoPosts
					linkKind={props.linkKind}
					importRef={importButton}
					onImport={openImport}
				/>
			) : (
				<Page>
					<PageHeader>
						<PageHeading>
							<PageTitle>Posts</PageTitle>
							<PageDescription>
								The posts of the CMS, the last changed first. A change goes to
								your site when you select Publish changes.
							</PageDescription>
						</PageHeading>
						<PageActions>
							<Button
								ref={importButton}
								type="button"
								variant="outline"
								onClick={openImport}
							>
								<FileArrowUpIcon data-icon="inline-start" />
								Import
							</Button>
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
							<div
								role="alert"
								className="flex flex-col items-start gap-3 text-sm"
							>
								<p className="text-destructive">
									{NOTES_ERROR_MESSAGES[failed.error]}
								</p>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={retry}
								>
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
									{markAlert === null ? null : (
										<div role="alert" className="text-sm text-destructive">
											{match(markAlert)
												.with({ status: "code" }, (coded) => (
													<p>{NOTES_ERROR_MESSAGES[coded.error]}</p>
												))
												.with({ status: "blocked" }, (blocked) => (
													<p>
														Daluang cannot publish "{blocked.title}". Correct
														each field in this list:{" "}
														{A.join(blocked.labels, ", ")}.{" "}
														<PostLink
															kind={props.linkKind}
															id={blocked.id}
															className="underline"
														>
															Open the post
														</PostLink>
													</p>
												))
												.exhaustive()}
										</div>
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
			)}
			<ImportPostsDialog
				key={importKey}
				open={importing}
				onOpenChange={setImporting}
				languages={settings.languages}
				fields={settings.fields}
				onImported={reload}
				returnFocus={importButton}
			/>
		</>
	);
}
