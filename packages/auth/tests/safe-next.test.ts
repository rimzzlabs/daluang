import { describe, expect, it } from "vitest";
import { safeNext } from "../src/safe-next";

describe("safeNext", () => {
	it("keeps a path of the app with its search", () => {
		expect(safeNext("/notes?sort=new")).toBe("/notes?sort=new");
	});

	it.each([
		["a protocol-relative URL", "//evil.example"],
		["a backslash URL", "/\\evil.example"],
		["an absolute URL", "https://evil.example"],
		["a script URL", "javascript:alert(1)"],
		["an empty value", ""],
	])("gives / for %s", (_name, value) => {
		expect(safeNext(value)).toBe("/");
	});

	it("gives / when there is no value", () => {
		expect(safeNext(null)).toBe("/");
		expect(safeNext(undefined)).toBe("/");
	});
});
