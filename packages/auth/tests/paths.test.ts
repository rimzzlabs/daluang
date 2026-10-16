import { describe, expect, it } from "vitest";
import { isAuthApiPath, isOpenAuthPath, signInUrl } from "../src/paths";

describe("isAuthApiPath", () => {
	it("is true for an endpoint of Better Auth", () => {
		expect(isAuthApiPath("/api/auth/callback/github")).toBe(true);
	});

	it("is false for another endpoint", () => {
		expect(isAuthApiPath("/api/notes")).toBe(false);
	});
});

describe("isOpenAuthPath", () => {
	it.each([
		"/api/auth/sign-in/social",
		"/api/auth/callback/github",
		"/api/auth/get-session",
		"/api/auth/sign-out",
		"/api/auth/error",
	])("is true for %s", (path) => {
		expect(isOpenAuthPath(path)).toBe(true);
	});

	it.each([
		"/api/auth/get-access-token",
		"/api/auth/update-user",
		"/api/auth/link-social",
		"/api/auth/callback/google",
		"/api/auth/sign-in/social/",
		"/api/auth/SIGN-OUT",
	])("is false for %s", (path) => {
		expect(isOpenAuthPath(path)).toBe(false);
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
