import { describe, expect, it } from "vitest";
import { isWebhookUrl, newWebhookSchema, urlHint } from "../src/webhook";

describe("isWebhookUrl", () => {
	it.each([
		"https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/abc",
		"https://api.netlify.com/build_hooks/abc",
	])("accepts %s", (url) => {
		expect(isWebhookUrl(url)).toBe(true);
	});

	it.each([
		["http", "http://example.com/hook"],
		["localhost", "https://localhost/hook"],
		["a name below localhost", "https://cms.localhost/hook"],
		["an IPv4 address", "https://127.0.0.1/hook"],
		["an IPv6 address", "https://[::1]/hook"],
		["a host with no dot", "https://intranet/hook"],
		["a user name", "https://me:secret@example.com/hook"],
		["localhost with its last dot", "https://localhost./hook"],
		["a name below localhost with its last dot", "https://cms.localhost./hook"],
		["a name of a cloud network", "https://metadata.google.internal/hook"],
		["a name of mDNS", "https://printer.local/hook"],
		["a name of a home network", "https://router.home.arpa/hook"],
		["an address with its last dot", "https://127.0.0.1./hook"],
		["a value that is not a URL", "deploy hook"],
	])("refuses %s", (_name, url) => {
		expect(isWebhookUrl(url)).toBe(false);
	});
});

describe("newWebhookSchema", () => {
	it("trims the name and the URL", () => {
		expect(
			newWebhookSchema.parse({
				name: " Site ",
				url: " https://example.com/a ",
			}),
		).toEqual({ name: "Site", url: "https://example.com/a" });
	});

	it("tells the writer the form of a URL", () => {
		const result = newWebhookSchema.safeParse({
			name: "Site",
			url: "http://example.com",
		});
		expect(result.error?.issues[0]?.message).toContain("https URL");
	});
});

describe("urlHint", () => {
	it("gives the host and the last 4 characters", () => {
		expect(urlHint("https://api.cloudflare.com/x/deploy_hooks/a1b2c3d4")).toBe(
			"api.cloudflare.com/…c3d4",
		);
	});

	it("gives a question mark for a value that is not a URL", () => {
		expect(urlHint("nope")).toBe("?/…nope");
	});
});
