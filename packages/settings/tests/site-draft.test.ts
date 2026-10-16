import { R } from "@mobily/ts-belt";
import { describe, expect, it } from "vitest";
import { parseSiteDraft, siteDraft } from "../src/site-draft";

describe("siteDraft", () => {
	it("gives two empty texts for no site", () => {
		expect(siteDraft(null)).toEqual({ name: "", url: "" });
	});

	it("gives an empty address for a site with no address", () => {
		expect(siteDraft({ name: "rimzzlabs", url: null })).toEqual({
			name: "rimzzlabs",
			url: "",
		});
	});

	it("gives the address of a site", () => {
		expect(
			siteDraft({ name: "rimzzlabs", url: "https://rimzzlabs.com" }),
		).toEqual({ name: "rimzzlabs", url: "https://rimzzlabs.com" });
	});
});

describe("parseSiteDraft", () => {
	it("gives the site of a valid draft", () => {
		expect(parseSiteDraft({ name: " rimzzlabs ", url: "" })).toEqual(
			R.Ok({ name: "rimzzlabs", url: null }),
		);
	});

	it("gives the message of each field that is not valid", () => {
		expect(parseSiteDraft({ name: "", url: "nope" })).toEqual(
			R.Error({
				name: "Give your site a name.",
				url: "Use an address such as https://example.com.",
			}),
		);
	});

	it("gives no message for a valid field", () => {
		expect(parseSiteDraft({ name: "", url: "" })).toEqual(
			R.Error({ name: "Give your site a name.", url: undefined }),
		);
	});
});
