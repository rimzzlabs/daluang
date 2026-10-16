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

export function ApiTokensPage() {
	return (
		<LaterPage
			title="API tokens"
			description="A token lets your site read the published notes through the API of Daluang."
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

export function LanguagesPage() {
	return (
		<LaterPage
			title="Languages"
			description="The languages that you write in. Each note has one language, and a note can have a translation in each other language."
		/>
	);
}
