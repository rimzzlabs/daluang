import { describe, expect, it } from "vitest";
import { canonicalSiteUrl, siteHost, siteSettingSchema } from "../src/site";

describe("canonicalSiteUrl", () => {
	it.each([
		["https://rimzzlabs.com", "https://rimzzlabs.com"],
		["https://rimzzlabs.com/", "https://rimzzlabs.com"],
		["rimzzlabs.com", "https://rimzzlabs.com"],
		["https://example.com/blog/", "https://example.com/blog"],
		["http://localhost:4000", "http://localhost:4000"],
		["HTTPS://Example.COM", "https://example.com"],
	])("gives %s as %s", (value, url) => {
		expect(canonicalSiteUrl(value)).toBe(url);
	});

	it.each([
		["a mail address", "mailto:me@example.com"],
		["a script URL", "javascript:alert(1)"],
		["a word with no dot", "mysite"],
		["a value that is not a URL", "https://"],
		["an FTP address", "ftp://example.com"],
		["an address with a user name", "https://me@example.com"],
	])("refuses %s", (_name, value) => {
		expect(canonicalSiteUrl(value)).toBeUndefined();
	});
});

describe("siteSettingSchema", () => {
	it("needs a name", () => {
		const result = siteSettingSchema.safeParse({ name: "  ", url: null });
		expect(result.error?.issues[0]?.message).toBe("Give your site a name.");
	});

	it("refuses a name of more than 80 characters", () => {
		expect(
			siteSettingSchema.safeParse({ name: "a".repeat(81), url: null }).success,
		).toBe(false);
	});

	it("gives null for an empty address", () => {
		expect(siteSettingSchema.parse({ name: "Site", url: " " })).toEqual({
			name: "Site",
			url: null,
		});
	});

	it("tells the writer the form of an address", () => {
		const result = siteSettingSchema.safeParse({
			name: "Site",
			url: "my site",
		});
		expect(result.error?.issues[0]?.message).toBe(
			"Use an address such as https://example.com.",
		);
	});
});

describe("siteHost", () => {
	it("gives the address with no scheme and no slash at the end", () => {
		expect(siteHost("https://rimzzlabs.com")).toBe("rimzzlabs.com");
		expect(siteHost("http://localhost:4321/blog/")).toBe("localhost:4321/blog");
	});
});
