import { inLanguage, type ListedNote } from "@daluang/notes/note-list";
import { Button } from "@daluang/ui/components/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@daluang/ui/components/empty";
import {
	Page,
	PageDescription,
	PageHeader,
	PageHeading,
	PageTitle,
} from "@daluang/ui/components/page";
import { Skeleton } from "@daluang/ui/components/skeleton";
import { A, R } from "@mobily/ts-belt";
import { TranslateIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { match } from "ts-pattern";
import type { NavLinkKind } from "@/components/shell/nav-link";
import { useSettings } from "@/hooks/settings/use-settings";
import type { ChangesStore } from "@/lib/notes/changes-store";
import {
	listPostsOfCms,
	NOTES_ERROR_MESSAGES,
	type NotesError,
} from "@/lib/notes/client";
import type { SettingsStore } from "@/lib/settings/settings-store";
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

export interface PostsProps {
	settings: SettingsStore;
	changes: ChangesStore;
	linkKind: NavLinkKind;
}

/**
 * The posts page: each post with its language, its status, and the change that waits for
 * Publish changes. A CMS with more than one language can show the posts of one language.
 * With no post, the page shows the steps to set up a site.
 */
export function Posts(props: PostsProps) {
	const { changes } = props;
	const { languages } = useSettings(props.settings).languages;
	const [list, setList] = useState<ListState>({ status: "loading" });
	const [language, setLanguage] = useState<string | null>(null);

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
								<PostList posts={shown} />
							)}
						</>
					);
				})
				.exhaustive()}
		</Page>
	);
}
