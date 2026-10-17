import { createHash } from "node:crypto";
import { PREFERENCES_SCRIPT } from "@daluang/ui/lib/preferences-script";
import { describe, expect, it } from "vitest";
import { CMS_CSP, scriptHash } from "@/lib/security/csp";

describe("scriptHash", () => {
	it("gives the base64 SHA-256 of the script, as a CSP source", () => {
		const digest = createHash("sha256").update("alert(1)").digest("base64");
		expect(scriptHash("alert(1)")).toBe(`sha256-${digest}`);
	});
});

describe("CMS_CSP", () => {
	it("allows the inline script of the preferences", () => {
		expect(CMS_CSP.scriptDirective.hashes).toEqual([
			scriptHash(PREFERENCES_SCRIPT),
		]);
	});

	it("refuses a frame, a plugin, and a base URL", () => {
		expect(CMS_CSP.directives).toEqual(
			expect.arrayContaining([
				"frame-ancestors 'none'",
				"object-src 'none'",
				"base-uri 'none'",
			]),
		);
	});

	it("allows an inline style only as an attribute", () => {
		expect(CMS_CSP.styleDirective.resources).toEqual([
			{ resource: "'unsafe-inline'", kind: "attribute" },
		]);
	});
});
