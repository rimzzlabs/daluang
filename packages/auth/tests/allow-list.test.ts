import { describe, expect, it } from "vitest";
import { isAllowedGitHubUser, parseAllowList } from "../src/allow-list";

describe("parseAllowList", () => {
	it("splits the names at each comma, trims them, and lowers their case", () => {
		expect(parseAllowList("  someone , RIMZZLABS ")).toEqual([
			"someone",
			"rimzzlabs",
		]);
	});

	it("drops empty names", () => {
		expect(parseAllowList(" , ,rimzzlabs,")).toEqual(["rimzzlabs"]);
	});

	it("gives an empty list for an empty value", () => {
		expect(parseAllowList("")).toEqual([]);
	});
});

describe("isAllowedGitHubUser", () => {
	const allowList = parseAllowList("rimzzlabs");

	it("allows a name on the list in any case and with spaces", () => {
		expect(isAllowedGitHubUser({ login: " RimzzLabs ", allowList })).toBe(true);
	});

	it("refuses a name that is not on the list", () => {
		expect(isAllowedGitHubUser({ login: "someone", allowList })).toBe(false);
	});

	it("refuses a name that is only the start of a listed name", () => {
		expect(isAllowedGitHubUser({ login: "rimzz", allowList })).toBe(false);
	});

	it("refuses an empty name", () => {
		expect(isAllowedGitHubUser({ login: "", allowList })).toBe(false);
	});

	it("refuses each name when the list is empty", () => {
		expect(isAllowedGitHubUser({ login: "rimzzlabs", allowList: [] })).toBe(
			false,
		);
	});
});
