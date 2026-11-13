import { useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { EditPost } from "@/components/notes/edit-post";
import { NewPost } from "@/components/notes/new-post";
import { PostExplorer } from "@/components/notes/post-explorer";
import type { NavLinkKind } from "@/components/shell/nav-link";
import { type PostListHandle, usePostList } from "@/hooks/notes/use-post-list";
import { pageParams } from "@/lib/shell/app-pages";
import type { AppPageProps } from "./page-content";

interface WorkspaceProps {
	posts: PostListHandle;
	activeId: string | null;
	linkKind: NavLinkKind;
	children: ReactNode;
}

/** The workspace of the editor: the explorer of the posts, and the page of the post. */
function Workspace(props: WorkspaceProps) {
	return (
		<div className="flex flex-1">
			<PostExplorer
				list={props.posts.list}
				activeId={props.activeId}
				linkKind={props.linkKind}
				onRetry={props.posts.retry}
			/>
			<div className="flex min-w-0 flex-1 flex-col">{props.children}</div>
		</div>
	);
}

export function NewPostPage(props: AppPageProps) {
	// The server renders this page with no router. The draft opens only in the island.
	const router = useRouter({ warn: false });
	const posts = usePostList(props.changes);
	// The new draft replaces `/posts/new` in the history, so Back does not add a second one.
	return (
		<Workspace posts={posts} activeId={null} linkKind={props.linkKind}>
			<NewPost
				settings={props.settings}
				linkKind={props.linkKind}
				onCreated={(id) =>
					router.navigate({ to: "/posts/$id", params: { id }, replace: true })
				}
			/>
		</Workspace>
	);
}

export function EditPostPage(props: AppPageProps) {
	const id = pageParams("/posts/$id", props.pathname).id ?? "";
	// The server renders this page with no router. Only Translate navigates, in the island.
	const router = useRouter({ warn: false });
	const posts = usePostList(props.changes);
	// A new ID is a new post: the key resets the state of the page.
	return (
		<Workspace posts={posts} activeId={id} linkKind={props.linkKind}>
			<EditPost
				key={id}
				id={id}
				settings={props.settings}
				changes={props.changes}
				linkKind={props.linkKind}
				onSaved={posts.reload}
				onOpenPost={(next) => {
					// A new translation is a new post, so the explorer reads the list again.
					posts.reload();
					router.navigate({ to: "/posts/$id", params: { id: next } });
				}}
			/>
		</Workspace>
	);
}
