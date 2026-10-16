import { describe, expect, it } from "vitest";
import {
	type AccessRequest,
	decideAccess,
	isCrossOriginWrite,
} from "../src/guard";

const ORIGIN = "http://localhost:4321";

function at(path: string) {
	return new URL(path, ORIGIN);
}

function read(path: string, signedIn: boolean): AccessRequest {
	return { url: at(path), method: "GET", origin: null, signedIn };
}

function write(
	params: Pick<AccessRequest, "method" | "origin">,
): AccessRequest {
	return { url: at("/api/settings"), signedIn: true, ...params };
}

describe("decideAccess", () => {
	it("opens the sign-in page to a person who is not signed in", () => {
		expect(decideAccess(read("/sign-in", false))).toEqual({
			action: "continue",
		});
	});

	it("sends a signed-in person from the sign-in page to next", () => {
		expect(decideAccess(read("/sign-in?next=/notes", true))).toEqual({
			action: "redirect",
			location: "/notes",
		});
	});

	it("sends a signed-in person to / when next leaves the app", () => {
		expect(decideAccess(read("/sign-in?next=//evil.example", true))).toEqual({
			action: "redirect",
			location: "/",
		});
	});

	it("sends a signed-in person to / when next hides a host behind a tab", () => {
		expect(decideAccess(read("/sign-in?next=/%09/evil.example", true))).toEqual(
			{
				action: "redirect",
				location: "/",
			},
		);
	});

	it("opens each page to a signed-in person", () => {
		expect(decideAccess(read("/notes", true))).toEqual({
			action: "continue",
		});
	});

	it("answers 401 to an endpoint with no session", () => {
		expect(decideAccess(read("/api/notes", false))).toEqual({
			action: "unauthorized",
		});
	});

	it("sends a page with no session to the sign-in page, with the path in next", () => {
		expect(decideAccess(read("/notes?x=1", false))).toEqual({
			action: "redirect",
			location: "/sign-in?next=%2Fnotes%3Fx%3D1",
		});
	});

	it("opens a write from a page of the CMS", () => {
		expect(decideAccess(write({ method: "PUT", origin: ORIGIN }))).toEqual({
			action: "continue",
		});
	});

	it("refuses a write from another origin, also with a session", () => {
		expect(
			decideAccess(write({ method: "POST", origin: "https://evil.example" })),
		).toEqual({ action: "forbidden" });
	});
});

describe("isCrossOriginWrite", () => {
	it.each(["POST", "PUT", "PATCH", "DELETE", "post"])(
		"is true for %s from another origin",
		(method) => {
			expect(
				isCrossOriginWrite(write({ method, origin: "https://evil.example" })),
			).toBe(true);
		},
	);

	it("is true for a write with no Origin header", () => {
		expect(isCrossOriginWrite(write({ method: "DELETE", origin: null }))).toBe(
			true,
		);
	});

	it("is true for an origin that differs only in the port", () => {
		expect(
			isCrossOriginWrite(
				write({ method: "POST", origin: "http://localhost:4322" }),
			),
		).toBe(true);
	});

	it("is false for a write from the origin of the CMS", () => {
		expect(isCrossOriginWrite(write({ method: "PATCH", origin: ORIGIN }))).toBe(
			false,
		);
	});

	it.each(["GET", "HEAD", "OPTIONS"])("is false for %s", (method) => {
		expect(
			isCrossOriginWrite(write({ method, origin: "https://evil.example" })),
		).toBe(false);
	});
});
