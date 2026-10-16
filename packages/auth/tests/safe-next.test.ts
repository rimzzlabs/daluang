import { describe, expect, it } from "vitest";
import { safeNext } from "../src/safe-next";

describe("safeNext", () => {
	it("keeps a path of the app with its search", () => {
		expect(safeNext("/notes?sort=new")).toBe("/notes?sort=new");
	});

	it("keeps the hash of a path", () => {
		expect(safeNext("/notes#top")).toBe("/notes#top");
	});

	it("gives the parsed form of a path", () => {
		expect(safeNext("/a/../notes")).toBe("/notes");
		expect(safeNext("/a b")).toBe("/a%20b");
	});

	it("keeps an encoded slash, which a browser does not decode", () => {
		expect(safeNext("/%2F%2Fevil.example")).toBe("/%2F%2Fevil.example");
	});

	it.each([
		["a protocol-relative URL", "//evil.example"],
		["a backslash URL", "/\\evil.example"],
		["an absolute URL", "https://evil.example"],
		["a script URL", "javascript:alert(1)"],
		["an empty value", ""],
		["a tab after the first slash", "/\t/evil.example"],
		["a newline after the first slash", "/\n/evil.example"],
		["a carriage return and a newline", "/\r\n/evil.example"],
		["a dot segment before two slashes", "/.//evil.example"],
		["a dot segment before a backslash", "/./\\evil.example"],
		["a parent segment before two slashes", "/a/../..//evil.example"],
		["an invalid host", "//[evil"],
	])("gives / for %s", (_name, value) => {
		expect(safeNext(value)).toBe("/");
	});

	it("gives / when there is no value", () => {
		expect(safeNext(null)).toBe("/");
		expect(safeNext(undefined)).toBe("/");
	});
});
