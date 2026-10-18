import { LaterPage } from "@/components/shell/later-page";

// The pages that have no feature yet.

export function MediaPage() {
	return (
		<LaterPage
			title="Media"
			description="The images and the videos of your posts. Cloudflare R2 keeps the files."
		/>
	);
}

export function NewPostPage() {
	return (
		<LaterPage
			title="New post"
			description="Write a post in Markdown, with its metadata and the fields of your site."
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
