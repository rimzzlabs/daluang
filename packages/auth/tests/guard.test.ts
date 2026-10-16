import { describe, expect, it } from "vitest";
import { decideAccess } from "../src/guard";

function at(path: string) {
	return new URL(path, "http://localhost:4321");
}

describe("decideAccess", () => {
	it("opens the sign-in page to a person who is not signed in", () => {
		expect(decideAccess({ url: at("/sign-in"), signedIn: false })).toEqual({
			action: "continue",
		});
	});

	it("sends a signed-in person from the sign-in page to next", () => {
		expect(
			decideAccess({ url: at("/sign-in?next=/notes"), signedIn: true }),
		).toEqual({
			action: "redirect",
			location: "/notes",
		});
	});

	it("sends a signed-in person to / when next leaves the app", () => {
		expect(
			decideAccess({ url: at("/sign-in?next=//evil.example"), signedIn: true }),
		).toEqual({
			action: "redirect",
			location: "/",
		});
	});

	it("sends a signed-in person to / when next hides a host behind a tab", () => {
		expect(
			decideAccess({
				url: at("/sign-in?next=/%09/evil.example"),
				signedIn: true,
			}),
		).toEqual({
			action: "redirect",
			location: "/",
		});
	});

	it("opens each page to a signed-in person", () => {
		expect(decideAccess({ url: at("/notes"), signedIn: true })).toEqual({
			action: "continue",
		});
	});

	it("answers 401 to an endpoint with no session", () => {
		expect(decideAccess({ url: at("/api/notes"), signedIn: false })).toEqual({
			action: "unauthorized",
		});
	});

	it("sends a page with no session to the sign-in page, with the path in next", () => {
		expect(decideAccess({ url: at("/notes?x=1"), signedIn: false })).toEqual({
			action: "redirect",
			location: "/sign-in?next=%2Fnotes%3Fx%3D1",
		});
	});
});
