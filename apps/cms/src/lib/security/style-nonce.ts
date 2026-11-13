/** The bytes of a nonce: 128 bits, the minimum of the CSP spec. */
const NONCE_BYTES = 16;

/** The `property` of the `<meta>` that gives the nonce to the browser, as Vite reads it. */
export const STYLE_NONCE_PROPERTY = "csp-nonce";

/**
 * Side effect: a random value from `crypto`. Each response gets a new nonce, so an
 * attacker cannot know the nonce of a page before the page loads.
 */
export function makeStyleNonce(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(NONCE_BYTES));
	return btoa(String.fromCharCode(...bytes));
}

/** The nonce as a source of `style-src`. */
export function nonceSource(nonce: string): `'nonce-${string}'` {
	return `'nonce-${nonce}'`;
}

/**
 * The style nonce of the page, from its `<meta property="csp-nonce">`. A browser hides the
 * `nonce` attribute from `getAttribute`, so this reads the `nonce` property. Undefined when
 * the page has no nonce.
 */
export function readStyleNonce(page: Document): string | undefined {
	const meta = page.querySelector(`meta[property="${STYLE_NONCE_PROPERTY}"]`);
	if (!(meta instanceof HTMLElement) || meta.nonce === "") return undefined;
	return meta.nonce;
}
