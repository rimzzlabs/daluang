import { useRouter } from "@tanstack/react-router";
import { NewPost } from "@/components/notes/new-post";
import { LaterPage } from "@/components/shell/later-page";
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

export function EditPostPage() {
	return (
		<LaterPage
			title="Edit post"
			description="Change a post. The change goes to your site at Publish changes."
		/>
	);
}
