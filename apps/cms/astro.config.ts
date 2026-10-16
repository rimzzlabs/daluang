import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { daluangAuth } from "@daluang/auth/astro/integration";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

export default defineConfig({
	output: "server",
	// `astro dev` runs the app in workerd, with the bindings of `wrangler.jsonc`.
	adapter: cloudflare(),
	// `daluangAuth` adds the `/api/auth` endpoints and the sign-in guard. The app has no
	// auth route file.
	integrations: [react({ compiler: true }), daluangAuth()],
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
