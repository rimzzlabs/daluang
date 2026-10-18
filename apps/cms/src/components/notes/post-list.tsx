import { dayLabel } from "@daluang/notes/date-label";
import type { ListedNote, NoteAction } from "@daluang/notes/note-list";
import { Badge } from "@daluang/ui/components/badge";
import { A } from "@mobily/ts-belt";
import { CHANGE_LABELS, STATUS_LABELS } from "@/lib/notes/change-labels";
import { PostMenu } from "./post-menu";

export interface PostListProps {
	posts: readonly ListedNote[];
	onAction: (post: ListedNote, action: NoteAction) => void;
}

/**
 * The posts: the title, the slug, and the day of the last change, then the language, the
 * status, the change that waits for Publish changes, and the menu of the post.
 */
export function PostList(props: PostListProps) {
	return (
		<ul
			aria-label="Posts"
			className="divide-y divide-border rounded-2xl border border-border"
		>
			{A.map(props.posts, (post) => (
				<li
					key={post.note.id}
					className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
				>
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-medium">{post.note.title}</p>
						<p className="truncate text-sm text-muted-foreground">
							<code className="font-mono text-xs">{post.note.slug}</code> ·
							Changed {dayLabel(post.note.updatedAt)}
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-1.5">
						<Badge variant="outline">{post.note.language}</Badge>
						<Badge
							variant={
								post.note.status === "published" ? "secondary" : "outline"
							}
						>
							{STATUS_LABELS[post.note.status]}
						</Badge>
						{post.change === null ? null : (
							<Badge
								variant={post.change === "delete" ? "destructive" : "default"}
							>
								{CHANGE_LABELS[post.change]}
							</Badge>
						)}
						<PostMenu
							post={post}
							onAction={(action) => props.onAction(post, action)}
						/>
					</div>
				</li>
			))}
		</ul>
	);
}
