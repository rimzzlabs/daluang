import {
	type ExplorerFilter,
	explorerNotes,
	type ListedNote,
} from "@daluang/notes/note-list";
import { Button } from "@daluang/ui/components/button";
import { Input } from "@daluang/ui/components/input";
import { Skeleton } from "@daluang/ui/components/skeleton";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@daluang/ui/components/toggle-group";
import { A } from "@mobily/ts-belt";
import { cn } from "cn";
import { useState } from "react";
import { match } from "ts-pattern";
import type { NavLinkKind } from "@/components/shell/nav-link";
import type { PostListState } from "@/hooks/notes/use-post-list";
import { STATUS_LABELS } from "@/lib/notes/change-labels";
import { NOTES_ERROR_MESSAGES } from "@/lib/notes/client";
import { PostLink } from "./post-link";

const FILTER_LABELS: Record<ExplorerFilter, string> = {
	all: "All",
	draft: "Drafts",
	published: "Published",
};

const FILTERS: readonly ExplorerFilter[] = ["all", "draft", "published"];

function isFilter(value: unknown): value is ExplorerFilter {
	return A.includes(FILTERS, value);
}

export interface PostExplorerProps {
	list: PostListState;
	/** The ID of the open post, or `null` on a page with no post. */
	activeId: string | null;
	linkKind: NavLinkKind;
	onRetry: () => void;
}

/**
 * The panel of the posts at the left of the editor: a search, the filter of the status, the
 * number of the posts that match, and a link to each one. It shows from 64rem (`lg`), where
 * the editor has the room for it.
 */
export function PostExplorer(props: PostExplorerProps) {
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState<ExplorerFilter>("all");

	return (
		<aside
			aria-label="Posts"
			className="hidden w-64 shrink-0 flex-col gap-3 border-r border-border p-3 lg:flex"
		>
			<Input
				type="search"
				aria-label="Search the posts"
				placeholder="Search the posts"
				value={search}
				onChange={(event) => setSearch(event.target.value)}
			/>
			<ToggleGroup
				variant="outline"
				size="sm"
				aria-label="Status"
				value={[filter]}
				onValueChange={(values) => {
					const [next] = values;
					// A click on the chosen item clears the choice, so it shows each post.
					setFilter(isFilter(next) ? next : "all");
				}}
			>
				{A.map(FILTERS, (item) => (
					<ToggleGroupItem key={item} value={item}>
						{FILTER_LABELS[item]}
					</ToggleGroupItem>
				))}
			</ToggleGroup>
			{match(props.list)
				.with({ status: "loading" }, () => (
					<div role="status" className="flex flex-col gap-2">
						<span className="sr-only">Loading the posts</span>
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
					</div>
				))
				.with({ status: "failed" }, (failed) => (
					<div role="alert" className="flex flex-col items-start gap-2 text-sm">
						<p className="text-destructive">
							{NOTES_ERROR_MESSAGES[failed.error]}
						</p>
						<Button size="sm" variant="outline" onClick={props.onRetry}>
							Try again
						</Button>
					</div>
				))
				.with({ status: "ready" }, (ready) => (
					<ExplorerList
						posts={explorerNotes(ready.posts, { search, filter })}
						activeId={props.activeId}
						linkKind={props.linkKind}
					/>
				))
				.exhaustive()}
		</aside>
	);
}

interface ExplorerListProps {
	posts: readonly ListedNote[];
	activeId: string | null;
	linkKind: NavLinkKind;
}

function ExplorerList(props: ExplorerListProps) {
	const count = A.length(props.posts);
	return (
		<div className="flex min-h-0 flex-col gap-1">
			<p className="px-2 text-xs text-muted-foreground" aria-live="polite">
				{count === 1 ? "1 post" : `${count} posts`}
			</p>
			{count === 0 ? (
				<p className="px-2 py-4 text-sm text-muted-foreground">
					No post matches.
				</p>
			) : (
				<ul className="flex flex-col gap-0.5 overflow-y-auto">
					{A.map(props.posts, (post) => {
						const active = post.note.id === props.activeId;
						return (
							<li key={post.note.id}>
								<PostLink
									kind={props.linkKind}
									id={post.note.id}
									aria-current={active ? "page" : undefined}
									className={cn(
										"flex flex-col rounded-lg px-2 py-1.5 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50",
										active && "bg-muted",
									)}
								>
									<span className="truncate text-sm font-medium">
										{post.note.title}
									</span>
									<span className="truncate text-xs text-muted-foreground">
										{post.note.language} · {STATUS_LABELS[post.note.status]}
									</span>
								</PostLink>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
