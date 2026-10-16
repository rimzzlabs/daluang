import { defineConfig } from "vocs/config";

export default defineConfig({
	title: "Daluang",
	description: "A Markdown CMS that you host on Cloudflare",
	checkDeadlinks: true,
	// The files are in `public/`.
	iconUrl: "/favicon.svg",
	logoUrl: { light: "/logo-light.svg", dark: "/logo-dark.svg" },
	// The build writes each page as an HTML file into `dist/public`. Cloudflare then
	// serves that folder as static assets, with no server code.
	renderStrategy: "full-static",
	sidebar: [
		{ text: "What Daluang is", link: "/" },
		{
			text: "Guide",
			items: [{ text: "Local development", link: "/guide/local-development" }],
		},
	],
});
