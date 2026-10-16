import { describe, expect, it, vi } from "vitest";
import { handleWebhooksRequest, webhookRoute } from "../src/api";
import { createWebhook } from "../src/store";
import { WEBHOOKS_MAX } from "../src/webhook";
import { createFakeD1 } from "./fake-d1";

const ORIGIN = "http://localhost:4321";
const NOW = new Date("2026-10-17T00:00:00.000Z");
const HOOK = { name: "Site", url: "https://example.com/deploy/a1b2c3d4" };

function request(path: string, init?: RequestInit) {
	return new Request(`${ORIGIN}${path}`, init);
}

function post(path: string, body: string, contentType = "application/json") {
	return request(path, {
		method: "POST",
		headers: { "Content-Type": contentType },
		body,
	});
}

describe("webhookRoute", () => {
	it.each([
		["/api/webhooks", { kind: "list" }],
		["/api/webhooks/", { kind: "list" }],
		["/api/webhooks/w1", { kind: "webhook", id: "w1" }],
		["/api/webhooks/w1/test", { kind: "test", id: "w1" }],
	])("gives the route of %s", (path, route) => {
		expect(webhookRoute(path)).toEqual(route);
	});

	it.each([
		"/api/webhooks/w1/other",
		"/api/webhooks/w1/test/more",
		"/api/tokens",
	])("gives None for %s", (path) => {
		expect(webhookRoute(path)).toBeUndefined();
	});
});

describe("handleWebhooksRequest", () => {
	it("adds a webhook, then lists it with the URL masked", async () => {
		const { db } = createFakeD1();
		const added = await handleWebhooksRequest({
			request: post("/api/webhooks", JSON.stringify(HOOK)),
			db,
			now: () => NOW,
		});
		expect(added.status).toBe(201);
		const listed = await handleWebhooksRequest({
			request: request("/api/webhooks"),
			db,
		});
		await expect(listed.json()).resolves.toEqual({
			webhooks: [expect.objectContaining({ urlHint: "example.com/…c3d4" })],
		});
	});

	it("adds a webhook at the time of the request when no clock is given", async () => {
		const { db } = createFakeD1();
		const added = await handleWebhooksRequest({
			request: post("/api/webhooks", JSON.stringify(HOOK)),
			db,
		});
		expect(added.status).toBe(201);
	});

	it("gives each issue of a webhook that is not valid", async () => {
		const { db } = createFakeD1();
		const response = await handleWebhooksRequest({
			request: post(
				"/api/webhooks",
				JSON.stringify({ name: "", url: "http://127.0.0.1" }),
			),
			db,
		});
		expect(response.status).toBe(422);
		await expect(response.json()).resolves.toEqual({
			error: "invalid-webhook",
			issues: [
				expect.objectContaining({ path: "name" }),
				expect.objectContaining({ path: "url" }),
			],
		});
	});

	it.each([
		["a body that is not JSON", post("/api/webhooks", "{"), 400],
		["another content type", post("/api/webhooks", "x", "text/plain"), 415],
		[
			"a body of more than 4 KB",
			post("/api/webhooks", JSON.stringify({ name: "a".repeat(5000) })),
			413,
		],
		[
			"a path that the endpoint does not have",
			request("/api/webhooks/a/b/c"),
			404,
		],
	])("refuses %s", async (_name, req, status) => {
		const { db } = createFakeD1();
		const response = await handleWebhooksRequest({ request: req, db });
		expect(response.status).toBe(status);
	});

	it("refuses a webhook after the most webhooks", async () => {
		const { db } = createFakeD1();
		for (const index of Array.from({ length: WEBHOOKS_MAX }, (_, i) => i))
			await createWebhook({
				db,
				webhook: { ...HOOK, name: `Site ${index}` },
				now: NOW,
			});
		const response = await handleWebhooksRequest({
			request: post("/api/webhooks", JSON.stringify(HOOK)),
			db,
		});
		expect(response.status).toBe(409);
	});

	it("sends a test, records it, and gives the delivery", async () => {
		const { db } = createFakeD1();
		const { id } = await createWebhook({ db, webhook: HOOK, now: NOW });
		const fetcher = vi.fn(() =>
			Promise.resolve(new Response(null, { status: 204 })),
		);
		const response = await handleWebhooksRequest({
			request: request(`/api/webhooks/${id}/test`, { method: "POST" }),
			db,
			now: () => NOW,
			fetcher,
		});
		await expect(response.json()).resolves.toEqual({
			delivery: expect.objectContaining({
				status: "delivered",
				statusCode: 204,
			}),
		});
		expect(fetcher).toHaveBeenCalledWith(HOOK.url, expect.anything());
		const listed = await handleWebhooksRequest({
			request: request("/api/webhooks"),
			db,
		});
		const body = await listed.json();
		expect(JSON.stringify(body)).toContain('"statusCode":204');
	});

	it("sends a test with the fetch of the runtime when no fetch is given", async () => {
		const fetch = vi.fn(() =>
			Promise.resolve(new Response(null, { status: 200 })),
		);
		vi.stubGlobal("fetch", fetch);
		const { db } = createFakeD1();
		const { id } = await createWebhook({ db, webhook: HOOK, now: NOW });
		const response = await handleWebhooksRequest({
			request: request(`/api/webhooks/${id}/test`, { method: "POST" }),
			db,
		});
		expect(response.status).toBe(200);
		expect(fetch).toHaveBeenCalledOnce();
		vi.unstubAllGlobals();
	});

	it("answers 404 to a test or a remove of a webhook that does not exist", async () => {
		const { db } = createFakeD1();
		const test = await handleWebhooksRequest({
			request: request("/api/webhooks/nope/test", { method: "POST" }),
			db,
		});
		const remove = await handleWebhooksRequest({
			request: request("/api/webhooks/nope", { method: "DELETE" }),
			db,
		});
		expect([test.status, remove.status]).toEqual([404, 404]);
	});

	it("removes a webhook", async () => {
		const { db } = createFakeD1();
		const { id } = await createWebhook({ db, webhook: HOOK, now: NOW });
		const response = await handleWebhooksRequest({
			request: request(`/api/webhooks/${id}`, { method: "DELETE" }),
			db,
		});
		expect(response.status).toBe(204);
	});

	it.each([
		["/api/webhooks", "PUT", "GET, POST"],
		["/api/webhooks/w1", "GET", "DELETE"],
		["/api/webhooks/w1/test", "GET", "POST"],
	])("refuses another method on %s", async (path, method, allow) => {
		const { db } = createFakeD1();
		const response = await handleWebhooksRequest({
			request: request(path, { method }),
			db,
		});
		expect(response.status).toBe(405);
		expect(response.headers.get("Allow")).toBe(allow);
	});
});
