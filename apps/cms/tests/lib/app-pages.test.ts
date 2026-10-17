import { describe, expect, it } from "vitest";
import {
	APP_PAGES,
	documentTitle,
	findAppPage,
	NOT_FOUND_TITLE,
	normalizePath,
	pageTitle,
} from "@/lib/app-pages";

describe("normalizePath", () => {
	it("removes each trailing slash and keeps /", () => {
		expect(normalizePath("/media//")).toBe("/media");
		expect(normalizePath("/")).toBe("/");
		expect(normalizePath("/media")).toBe("/media");
	});
});

describe("findAppPage", () => {
	it("finds the page of a path, also with a trailing slash", () => {
		expect(findAppPage("/settings/webhooks/")?.title).toBe("Webhooks");
	});

	it("gives None for a path with no page", () => {
		expect(findAppPage("/nope")).toBeUndefined();
	});
});

describe("pageTitle", () => {
	it("gives the title of each page", () => {
		for (const page of APP_PAGES) expect(pageTitle(page.path)).toBe(page.title);
	});

	it("gives the not-found title for a path with no page", () => {
		expect(pageTitle("/nope")).toBe(NOT_FOUND_TITLE);
	});
});

describe("documentTitle", () => {
	it("adds the name of the product", () => {
		expect(documentTitle("Posts")).toBe("Posts · Daluang");
	});
});
