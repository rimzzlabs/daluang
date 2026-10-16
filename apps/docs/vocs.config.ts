import { defineConfig } from "vocs/config";

export default defineConfig({
	title: "Daluang",
	description: "A Markdown CMS that you host on Cloudflare",
	checkDeadlinks: true,
	// The landing page in `apps/web` serves this site at `/docs`. The build of `apps/web`
	// copies `dist/public` into its own `dist/docs`.
	basePath: "/docs",
	// Vocs does not add `basePath` to these URLs. The files are in `public/`.
	iconUrl: "/docs/favicon.svg",
	logoUrl: { light: "/docs/logo-light.svg", dark: "/docs/logo-dark.svg" },
	// The build writes each page as an HTML file into `dist/public`, with no server code.
	renderStrategy: "full-static",
	sidebar: [
		{ text: "What Daluang is", link: "/" },
		{
			text: "Guide",
			items: [{ text: "Local development", link: "/guide/local-development" }],
		},
	],
});
