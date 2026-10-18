import { describe, expect, it } from "vitest";
import {
	APP_PAGES,
	documentTitle,
	findAppPage,
	matchesPage,
	NOT_FOUND_TITLE,
	normalizePath,
	pageParams,
	pageTitle,
} from "@/lib/shell/app-pages";

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

	it("finds the page of a post by its ID, and the page of a new post", () => {
		expect(findAppPage("/posts/n1")?.path).toBe("/posts/$id");
		expect(findAppPage("/posts/new")?.path).toBe("/posts/new");
		expect(findAppPage("/posts")).toBeUndefined();
		expect(findAppPage("/posts/n1/more")).toBeUndefined();
	});
});

describe("pageParams", () => {
	it("gives the value of each parameter of a page", () => {
		expect(pageParams("/posts/$id", "/posts/n1/")).toEqual({ id: "n1" });
		expect(pageParams("/settings/site", "/settings/site")).toEqual({});
	});

	it("gives no value for a path of another page", () => {
		expect(pageParams("/posts/$id", "/media")).toEqual({});
	});
});

describe("matchesPage", () => {
	it("matches each segment, and a parameter with one segment that is not empty", () => {
		expect(matchesPage("/", "/")).toBe(true);
		expect(matchesPage("/", "/media")).toBe(false);
		expect(matchesPage("/posts/$id", "/posts/n1")).toBe(true);
		expect(matchesPage("/posts/$id", "/posts/")).toBe(false);
		expect(matchesPage("/posts/$id", "/drafts/n1")).toBe(false);
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
