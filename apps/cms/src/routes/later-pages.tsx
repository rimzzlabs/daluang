import { LaterPage } from "@/components/shell/later-page";

// The pages that have a menu item but no feature yet.

export function MediaPage() {
	return (
		<LaterPage
			title="Media"
			description="The images and the videos of your notes. Cloudflare R2 keeps the files."
		/>
	);
}

export function WebhooksPage() {
	return (
		<LaterPage
			title="Webhooks"
			description="A webhook tells your site to rebuild when you publish a note. Each delivery shows here with its status."
		/>
	);
}
