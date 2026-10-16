import { describe, expect, it } from "vitest";
import { securityHeaders, withSecurityHeaders } from "@/security/headers";

const HTTPS = new URL("https://cms.example.com/notes");
const HTTP = new URL("http://localhost:4321/notes");

describe("securityHeaders", () => {
	it("refuses a frame, a sniffed type, and a search engine", () => {
		expect(securityHeaders(HTTP)).toMatchObject({
			"X-Frame-Options": "DENY",
			"X-Content-Type-Options": "nosniff",
			"X-Robots-Tag": "noindex, nofollow",
		});
	});

	it("adds Strict-Transport-Security for HTTPS only", () => {
		expect(securityHeaders(HTTPS)["Strict-Transport-Security"]).toBe(
			"max-age=31536000; includeSubDomains",
		);
		expect(securityHeaders(HTTP)).not.toHaveProperty(
			"Strict-Transport-Security",
		);
	});
});

describe("withSecurityHeaders", () => {
	it("keeps the status, the body, and the headers of the response", async () => {
		const response = withSecurityHeaders(
			new Response("hello", {
				status: 201,
				headers: { "Content-Type": "text/plain" },
			}),
			HTTPS,
		);
		expect(response.status).toBe(201);
		expect(response.headers.get("Content-Type")).toBe("text/plain");
		await expect(response.text()).resolves.toBe("hello");
	});

	it("adds the headers to a redirect, which has headers that cannot change", () => {
		const response = withSecurityHeaders(
			Response.redirect("https://cms.example.com/sign-in", 302),
			HTTPS,
		);
		expect(response.status).toBe(302);
		expect(response.headers.get("Location")).toBe(
			"https://cms.example.com/sign-in",
		);
		expect(response.headers.get("X-Frame-Options")).toBe("DENY");
	});

	it("keeps each cookie of the response", () => {
		const headers = new Headers();
		headers.append("Set-Cookie", "a=1; Path=/");
		headers.append("Set-Cookie", "b=2; Path=/");
		const response = withSecurityHeaders(new Response(null, { headers }), HTTP);
		expect(response.headers.getSetCookie()).toEqual([
			"a=1; Path=/",
			"b=2; Path=/",
		]);
	});

	it("gives no-store to a response with no Cache-Control", () => {
		const response = withSecurityHeaders(new Response(null), HTTP);
		expect(response.headers.get("Cache-Control")).toBe("no-store");
	});

	it("keeps the Cache-Control of the response", () => {
		const response = withSecurityHeaders(
			new Response(null, { headers: { "Cache-Control": "max-age=60" } }),
			HTTP,
		);
		expect(response.headers.get("Cache-Control")).toBe("max-age=60");
	});
});
