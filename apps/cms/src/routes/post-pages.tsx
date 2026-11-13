import { useRouter } from "@tanstack/react-router";
import { EditPost } from "@/components/notes/edit-post";
import { NewPost } from "@/components/notes/new-post";
import { pageParams } from "@/lib/shell/app-pages";
import type { AppPageProps } from "./page-content";

export function NewPostPage(props: AppPageProps) {
	// The server renders this page with no router. The draft opens only in the island.
	const router = useRouter({ warn: false });
	// The new draft replaces `/posts/new` in the history, so Back does not add a second one.
	return (
		<NewPost
			settings={props.settings}
			linkKind={props.linkKind}
			onCreated={(id) =>
				router.navigate({ to: "/posts/$id", params: { id }, replace: true })
			}
		/>
	);
}

export function EditPostPage(props: AppPageProps) {
	const id = pageParams("/posts/$id", props.pathname).id ?? "";
	// The server renders this page with no router. Only Translate navigates, in the island.
	const router = useRouter({ warn: false });
	// A new ID is a new post: the key resets the state of the page.
	return (
		<EditPost
			key={id}
			id={id}
			settings={props.settings}
			changes={props.changes}
			linkKind={props.linkKind}
			onOpenPost={(next) =>
				router.navigate({ to: "/posts/$id", params: { id: next } })
			}
		/>
	);
}
