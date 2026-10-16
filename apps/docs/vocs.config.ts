import { defineConfig } from "vocs/config";

const repository = "https://github.com/rimzzlabs/daluang";

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
	// Vocs gives `:path` from `src/pages`.
	editLink: { link: `${repository}/edit/main/apps/docs/src/pages/:path` },
	socials: [{ icon: "github", link: repository }],
	sidebar: [
		{ text: "What Daluang is", link: "/" },
		{
			text: "Guide",
			items: [
				{ text: "Local development", link: "/guide/local-development" },
				{ text: "Deploy", link: "/guide/deploy" },
				{ text: "First sign-in", link: "/guide/first-sign-in" },
				{ text: "API tokens", link: "/guide/api-tokens" },
				{ text: "Webhooks", link: "/guide/webhooks" },
			],
		},
	],
});
