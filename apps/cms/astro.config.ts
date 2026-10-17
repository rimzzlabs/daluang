import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { daluangAuth } from "@daluang/auth/astro/integration";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import { CMS_CSP } from "./src/lib/security/csp";
import { securityHeaders } from "./src/lib/security/integration";
import { settingsMiddleware } from "./src/lib/settings/integration";

export default defineConfig({
	output: "server",
	// `astro dev` runs the app in workerd, with the bindings of `wrangler.jsonc`. The CMS
	// transforms no images, so it needs no Images binding of Cloudflare.
	adapter: cloudflare({ imageService: "passthrough" }),
	// Better Auth keeps the sessions in D1. With no Astro sessions, the adapter adds no KV
	// namespace, and a deploy makes none in the account.
	session: false,
	// The order is the order of the middleware. `securityHeaders` is first, so it adds the
	// headers to each response, also to a redirect of the guard. `daluangAuth` adds the
	// `/api/auth` endpoints and the sign-in guard. `settingsMiddleware` reads the settings
	// for each page after the guard. The route files of `/api/settings`, `/api/tokens`, and
	// `/api/webhooks` are in `src/pages/api/`.
	integrations: [
		securityHeaders(),
		react({ compiler: true }),
		daluangAuth(),
		settingsMiddleware(),
	],
	// Astro sends the policy as a header of each page, with the hash of each script that it
	// renders. `astro dev` sends no policy.
	security: { csp: CMS_CSP },
	// Comark renders the Markdown of a note. The CMS has no Markdown page of Astro, so it
	// needs no highlighter. Shiki also writes inline styles, which the policy refuses.
	markdown: { syntaxHighlight: false },
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
	},
});
