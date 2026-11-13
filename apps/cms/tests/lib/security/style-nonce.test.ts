// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
	makeStyleNonce,
	nonceSource,
	readStyleNonce,
} from "@/lib/security/style-nonce";

describe("makeStyleNonce", () => {
	it("gives 128 random bits as base64", () => {
		const nonce = makeStyleNonce();
		expect(nonce).toMatch(/^[A-Za-z0-9+/]{22}==$/);
		expect(atob(nonce)).toHaveLength(16);
	});

	it("gives a new nonce at each call", () => {
		expect(makeStyleNonce()).not.toBe(makeStyleNonce());
	});
});

describe("nonceSource", () => {
	it("gives the nonce as a CSP source", () => {
		expect(nonceSource("abc=")).toBe("'nonce-abc='");
	});
});

describe("readStyleNonce", () => {
	afterEach(() => {
		document.head.replaceChildren();
	});

	function addMeta(property: string, nonce: string) {
		const meta = document.createElement("meta");
		meta.setAttribute("property", property);
		meta.nonce = nonce;
		document.head.appendChild(meta);
	}

	it("reads the nonce of the csp-nonce meta", () => {
		addMeta("csp-nonce", "abc=");
		expect(readStyleNonce(document)).toBe("abc=");
	});

	it("gives undefined when the page has no csp-nonce meta", () => {
		addMeta("og:title", "abc=");
		expect(readStyleNonce(document)).toBeUndefined();
	});

	it("gives undefined when the meta has an empty nonce", () => {
		addMeta("csp-nonce", "");
		expect(readStyleNonce(document)).toBeUndefined();
	});
});
