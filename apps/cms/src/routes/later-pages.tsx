import { LaterPage } from "@/components/shell/later-page";

// The pages that have a menu item but no feature yet.

export function MediaPage() {
	return (
		<LaterPage
			title="Media"
			description="The images and the videos of your posts. Cloudflare R2 keeps the files."
		/>
	);
}
