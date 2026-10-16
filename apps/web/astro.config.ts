import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import type { Plugin } from "vite";

/**
 * Waku, the router of Vocs, needs the root of the docs site at `/docs/`, with the slash.
 * At `/docs`, its client throws "pathname must start with basePath". In production, the
 * Worker redirects `/docs` to `/docs/`. This middleware does the same in development. It
 * runs before the proxy.
 */
function redirectDocsRoot(): Plugin {
	return {
		name: "daluang:redirect-docs-root",
		configureServer(server) {
			server.middlewares.use((request, response, next) => {
				const url = new URL(request.url ?? "/", "http://localhost");
				if (url.pathname !== "/docs") return next();
				response.writeHead(307, { Location: `/docs/${url.search}` });
				response.end();
			});
		},
	};
}

// The landing page of Daluang. The build is static HTML. `scripts/copy-docs.ts` then
// copies the docs site into `dist/docs`, and one Worker serves the two.
export default defineConfig({
	site: "https://daluang.rimzzlabs.com",
	// The ports: `apps/cms` 4321, `apps/web` 4322, and `apps/docs` 4323. Vocs takes the next
	// free port when 4323 is in use, and the proxy below then fails.
	server: { port: 4322 },
	// Each page is a file (`about.html`), so its URL has no trailing slash. The Worker
	// serves `/about` from `about.html` with no redirect.
	build: { format: "file" },
	// Astro checks the trailing slash before the proxy runs. With "never", it refuses
	// `/docs/`, the root of the docs site. The Worker sets the canonical URLs instead.
	trailingSlash: "ignore",
	integrations: [react({ compiler: true })],
	// Each font sets a CSS variable. `@daluang/ui/styles/theme.css` gives the variables
	// to `font-sans`, `font-serif`, and `font-mono`.
	fonts: [
		{
			provider: fontProviders.fontsource(),
			name: "Inter",
			cssVariable: "--font-inter",
			weights: ["100 900"],
			styles: ["normal"],
			subsets: ["latin"],
		},
		{
			provider: fontProviders.fontsource(),
			name: "Lora",
			cssVariable: "--font-lora",
			weights: ["400 700"],
			styles: ["normal", "italic"],
			subsets: ["latin"],
		},
		{
			provider: fontProviders.fontsource(),
			name: "JetBrains Mono",
			cssVariable: "--font-jetbrains-mono",
			weights: ["100 800"],
			styles: ["normal"],
			subsets: ["latin"],
		},
	],
	vite: {
		plugins: [tailwindcss(), redirectDocsRoot()],
		server: {
			// In development, `vocs dev` serves the docs site. `pnpm web:dev` starts it with
			// this server. The proxy sends `/docs/` to it, and `ws` also sends the hot reload
			// socket of the docs pages.
			proxy: {
				"/docs/": { target: "http://localhost:4323", ws: true },
			},
		},
	},
});
