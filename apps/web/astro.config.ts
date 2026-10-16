import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

// The landing page of Daluang. The build is static HTML. `scripts/copy-docs.ts` then
// copies the docs site into `dist/docs`, and one Worker serves the two.
export default defineConfig({
	site: "https://daluang.rimzzlabs.com",
	// `apps/cms` uses the default port, 4321.
	server: { port: 4322 },
	// The same rule as `html_handling: "drop-trailing-slash"` in `wrangler.jsonc`.
	trailingSlash: "never",
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
		plugins: [tailwindcss()],
		server: {
			// In development, `pnpm docs:dev` serves the docs site. This proxy sends `/docs`
			// to it, so that a link from the landing page to the docs works.
			// The proxy runs before the router of Astro, so `trailingSlash` has no effect
			// here. The Vocs dev server answers `/docs/`, not `/docs`. In production, the
			// Worker serves `/docs` itself.
			proxy: {
				"/docs": {
					target: "http://localhost:5173",
					rewrite: (path) => (path === "/docs" ? "/docs/" : path),
				},
			},
		},
	},
});
