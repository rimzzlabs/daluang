import { createHash } from "node:crypto";
import { PREFERENCES_SCRIPT } from "@daluang/ui/lib/preferences-script";
import type { AstroUserConfig } from "astro";

type CspConfig = Exclude<
	NonNullable<NonNullable<AstroUserConfig["security"]>["csp"]>,
	boolean
>;

/** The CSP hash of an inline script, as `script-src` reads it. */
export function scriptHash(source: string): `sha256-${string}` {
	return `sha256-${createHash("sha256").update(source).digest("base64")}`;
}

/**
 * The Content Security Policy of the CMS, for `security.csp` of `astro.config.ts`. Astro
 * adds the hash of each script and style that it renders, and sends the policy as a header
 * of each page. A script that an attacker puts in a page has no hash, so it does not run.
 *
 * - `PREFERENCES_SCRIPT` is an inline script of the layout, so its hash is here.
 * - React renders a `style` attribute, for example the width of the sidebar. A `style`
 *   attribute cannot run code, so `style-src-attr` allows it.
 * - The avatar of the user comes from GitHub.
 */
export const CMS_CSP = {
	algorithm: "SHA-256",
	directives: [
		"default-src 'self'",
		"img-src 'self' https://avatars.githubusercontent.com",
		"connect-src 'self'",
		"object-src 'none'",
		"base-uri 'none'",
		"form-action 'self'",
		"frame-ancestors 'none'",
	],
	scriptDirective: { hashes: [scriptHash(PREFERENCES_SCRIPT)] },
	styleDirective: {
		resources: [{ resource: "'unsafe-inline'", kind: "attribute" }],
	},
} satisfies CspConfig;
