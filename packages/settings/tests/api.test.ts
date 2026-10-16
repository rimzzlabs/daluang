import { describe, expect, it } from "vitest";
import { handleSettingsRequest } from "../src/api";
import { SETTINGS_API_PATH } from "../src/settings";
import { createFakeD1 } from "./fake-d1";

const URL_OF_API = `http://localhost:4321${SETTINGS_API_PATH}`;
const SITE = { name: "rimzzlabs", url: "https://rimzzlabs.com" };
const LANGUAGES = { languages: ["en", "id"], defaultLanguage: "en" };

function patch(body: string, contentType = "application/json") {
	return new Request(URL_OF_API, {
		method: "PATCH",
		headers: { "Content-Type": contentType },
		body,
	});
}

describe("handleSettingsRequest", () => {
	it("gives the stored settings to GET", async () => {
		const { db } = createFakeD1();
		const response = await handleSettingsRequest({
			request: new Request(URL_OF_API),
			db,
		});
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			settings: { site: null, languages: null, fields: null },
		});
	});

	it("writes a patch and gives the stored settings", async () => {
		const { db } = createFakeD1();
		const response = await handleSettingsRequest({
			request: patch(JSON.stringify({ site: SITE, languages: LANGUAGES })),
			db,
			now: () => new Date("2026-10-17T00:00:00.000Z"),
		});
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			settings: { site: SITE, languages: LANGUAGES, fields: null },
		});
	});

	it("writes with the time of the request when no clock is given", async () => {
		const { db } = createFakeD1();
		const response = await handleSettingsRequest({
			request: patch(JSON.stringify({ site: SITE })),
			db,
		});
		expect(response.status).toBe(200);
	});

	it("gives each issue of a patch that is not valid", async () => {
		const { db } = createFakeD1();
		const response = await handleSettingsRequest({
			request: patch(JSON.stringify({ site: { name: "", url: "not a site" } })),
			db,
		});
		expect(response.status).toBe(422);
		await expect(response.json()).resolves.toEqual({
			error: "invalid-settings",
			issues: [
				{ path: "site.name", message: "Give your site a name." },
				{
					path: "site.url",
					message: "Use an address such as https://example.com.",
				},
			],
		});
	});

	it("refuses a body that is not JSON", async () => {
		const { db } = createFakeD1();
		const response = await handleSettingsRequest({
			request: patch("{site"),
			db,
		});
		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({ error: "not-json" });
	});

	it("refuses a body of another content type", async () => {
		const { db } = createFakeD1();
		const response = await handleSettingsRequest({
			request: patch("site=x", "application/x-www-form-urlencoded"),
			db,
		});
		expect(response.status).toBe(415);
	});

	it("refuses a body of more than 16 KB", async () => {
		const { db } = createFakeD1();
		const response = await handleSettingsRequest({
			request: patch(JSON.stringify({ site: { name: "a".repeat(17_000) } })),
			db,
		});
		expect(response.status).toBe(413);
		await expect(response.json()).resolves.toEqual({ error: "too-large" });
	});

	it("refuses another method", async () => {
		const { db } = createFakeD1();
		const response = await handleSettingsRequest({
			request: new Request(URL_OF_API, { method: "DELETE" }),
			db,
		});
		expect(response.status).toBe(405);
		expect(response.headers.get("Allow")).toBe("GET, PATCH");
	});
});
