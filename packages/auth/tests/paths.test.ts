import { describe, expect, it } from "vitest";
import { isAuthApiPath, signInUrl } from "../src/paths";

describe("isAuthApiPath", () => {
	it("is true for an endpoint of Better Auth", () => {
		expect(isAuthApiPath("/api/auth/callback/github")).toBe(true);
	});

	it("is false for another endpoint", () => {
		expect(isAuthApiPath("/api/notes")).toBe(false);
	});
});

describe("signInUrl", () => {
	it("has no next value for the home page", () => {
		expect(signInUrl("/")).toBe("/sign-in");
	});

	it("keeps the path and its search in next", () => {
		expect(signInUrl("/notes?x=1")).toBe("/sign-in?next=%2Fnotes%3Fx%3D1");
	});
});
