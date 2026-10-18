import { useRouter } from "@tanstack/react-router";
import { EditPost } from "@/components/notes/edit-post";
import { NewPost } from "@/components/notes/new-post";
import { pageParams } from "@/lib/shell/app-pages";
import type { AppPageProps } from "./page-content";

export function NewPostPage(props: AppPageProps) {
	// The server renders this page with no router. Only Save navigates, in the island.
	const router = useRouter({ warn: false });
	return (
		<NewPost
			settings={props.settings}
			linkKind={props.linkKind}
			onSaved={() => router.navigate({ to: "/" })}
		/>
	);
}

export function EditPostPage(props: AppPageProps) {
	const id = pageParams("/posts/$id", props.pathname).id ?? "";
	// A new ID is a new post: the key resets the state of the page.
	return (
		<EditPost
			key={id}
			id={id}
			settings={props.settings}
			changes={props.changes}
			linkKind={props.linkKind}
		/>
	);
}
