import { describe, expect, it } from "vitest";
import {
	bearerSecret,
	generateTokenSecret,
	hashTokenSecret,
	isTokenSecret,
	tokenStart,
} from "../src/token";

const SECRET = `dlg_${"A".repeat(43)}`;

describe("generateTokenSecret", () => {
	it("gives a token with the prefix and 43 characters of base64url", () => {
		const secret = generateTokenSecret();
		expect(secret).toMatch(/^dlg_[A-Za-z0-9_-]{43}$/);
		expect(isTokenSecret(secret)).toBe(true);
	});

	it("gives a new token each time", () => {
		expect(generateTokenSecret()).not.toBe(generateTokenSecret());
	});
});

describe("hashTokenSecret", () => {
	it("gives the SHA-256 hash in hex", async () => {
		await expect(hashTokenSecret("abc")).resolves.toBe(
			"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
		);
	});
});

describe("tokenStart", () => {
	it("gives the prefix and four characters", () => {
		expect(tokenStart("dlg_AbCdEfGh")).toBe("dlg_AbCd");
	});
});

describe("bearerSecret", () => {
	it("gives the token of a Bearer header, in any case of the scheme", () => {
		expect(bearerSecret(`Bearer ${SECRET}`)).toBe(SECRET);
		expect(bearerSecret(` bearer ${SECRET} `)).toBe(SECRET);
	});

	it.each([
		["no header", null],
		["another scheme", `Basic ${SECRET}`],
		["a value that is not a token", "Bearer abc"],
		["a token with more after it", `Bearer ${SECRET} extra`],
		["a scheme with no token", "Bearer"],
	])("gives None for %s", (_name, header) => {
		expect(bearerSecret(header)).toBeUndefined();
	});
});
