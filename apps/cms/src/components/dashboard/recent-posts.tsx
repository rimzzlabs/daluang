import { dayLabel } from "@daluang/notes/date-label";
import { Badge } from "@daluang/ui/components/badge";
import { Button } from "@daluang/ui/components/button";
import { Skeleton } from "@daluang/ui/components/skeleton";
import { A } from "@mobily/ts-belt";
import { match } from "ts-pattern";
import { PostLink } from "@/components/notes/post-link";
import type { NavLinkKind } from "@/components/shell/nav-link";
import type { PostListState } from "@/hooks/notes/use-post-list";
import { CHANGE_LABELS, STATUS_LABELS } from "@/lib/notes/change-labels";
import { NOTES_ERROR_MESSAGES } from "@/lib/notes/client";

/** The number of posts that the dashboard shows. The posts page has each one. */
const RECENT_LIMIT = 6;

export interface RecentPostsProps {
	list: PostListState;
	linkKind: NavLinkKind;
	onRetry: () => void;
}

/** The last changed posts, each with a link to its editor. */
export function RecentPosts(props: RecentPostsProps) {
	return match(props.list)
		.with({ status: "loading" }, () => (
			<div role="status" className="flex flex-col gap-2">
				<span className="sr-only">Loading the posts</span>
				<Skeleton className="h-14 w-full" />
				<Skeleton className="h-14 w-full" />
				<Skeleton className="h-14 w-full" />
			</div>
		))
		.with({ status: "failed" }, (failed) => (
			<div role="alert" className="flex flex-col items-start gap-3 text-sm">
				<p className="text-destructive">{NOTES_ERROR_MESSAGES[failed.error]}</p>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={props.onRetry}
				>
					Try again
				</Button>
			</div>
		))
		.with({ status: "ready" }, (ready) =>
			A.isEmpty(ready.posts) ? (
				<p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
					No posts yet. Select New post to write the first one.
				</p>
			) : (
				<ul
					aria-label="Recent posts"
					className="divide-y divide-border rounded-2xl border border-border"
				>
					{A.map(A.take(ready.posts, RECENT_LIMIT), (post) => (
						<li
							key={post.note.id}
							className="flex items-center gap-3 px-4 py-3"
						>
							<div className="min-w-0 flex-1">
								<PostLink
									kind={props.linkKind}
									id={post.note.id}
									className="block truncate font-serif text-base font-medium hover:underline"
								>
									{post.note.title}
								</PostLink>
								<p className="text-sm text-muted-foreground">
									{post.note.language} · Changed {dayLabel(post.note.updatedAt)}
								</p>
							</div>
							{post.change === null ? (
								<Badge
									variant={
										post.note.status === "published" ? "secondary" : "outline"
									}
								>
									{STATUS_LABELS[post.note.status]}
								</Badge>
							) : (
								<Badge
									variant={post.change === "delete" ? "destructive" : "default"}
								>
									{CHANGE_LABELS[post.change]}
								</Badge>
							)}
						</li>
					))}
				</ul>
			),
		)
		.exhaustive();
}
