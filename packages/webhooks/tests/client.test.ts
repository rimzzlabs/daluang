import { R } from "@mobily/ts-belt";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	addWebhook,
	listWebhooksOfCms,
	removeWebhook,
	testWebhookOfCms,
} from "../src/client";

const WEBHOOK = {
	id: "w1",
	name: "Site",
	urlHint: "example.com/…c3d4",
	createdAt: "2026-10-17T00:00:00.000Z",
	deliveries: [],
};
const DELIVERY = {
	id: "d1",
	event: "test",
	status: "delivered",
	statusCode: 200,
	durationMs: 12,
	createdAt: "2026-10-17T00:00:00.000Z",
};

function answer(response: Response | Error) {
	const fetch = vi.fn(() =>
		response instanceof Error
			? Promise.reject(response)
			: Promise.resolve(response),
	);
	vi.stubGlobal("fetch", fetch);
	return fetch;
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("the webhooks client", () => {
	it("lists the webhooks", async () => {
		answer(Response.json({ webhooks: [WEBHOOK] }));
		await expect(listWebhooksOfCms()).resolves.toEqual(R.Ok([WEBHOOK]));
	});

	it("adds a webhook", async () => {
		const fetch = answer(Response.json({ webhook: WEBHOOK }, { status: 201 }));
		const input = { name: "Site", url: "https://example.com/a" };
		await expect(addWebhook(input)).resolves.toEqual(R.Ok(WEBHOOK));
		expect(fetch).toHaveBeenCalledWith("/api/webhooks", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(input),
		});
	});

	it("removes a webhook", async () => {
		const fetch = answer(new Response(null, { status: 204 }));
		await expect(removeWebhook("w 1")).resolves.toEqual(R.Ok(true));
		expect(fetch).toHaveBeenCalledWith("/api/webhooks/w%201", {
			method: "DELETE",
		});
	});

	it("sends a test", async () => {
		const fetch = answer(Response.json({ delivery: DELIVERY }));
		await expect(testWebhookOfCms("w1")).resolves.toEqual(R.Ok(DELIVERY));
		expect(fetch).toHaveBeenCalledWith("/api/webhooks/w1/test", {
			method: "POST",
		});
	});

	it.each([
		[401, "signed-out"],
		[404, "not-found"],
		[409, "too-many"],
		[422, "invalid"],
		[500, "server"],
	])("gives the error of the status %i", async (status, error) => {
		answer(Response.json({}, { status }));
		await expect(listWebhooksOfCms()).resolves.toEqual(R.Error(error));
	});

	it("gives offline when the request fails", async () => {
		answer(new TypeError("Failed to fetch"));
		await expect(removeWebhook("w1")).resolves.toEqual(R.Error("offline"));
	});

	it.each([
		["a body that is not JSON", new Response("<html>")],
		["a body of another shape", Response.json({ webhooks: 1 })],
	])("gives server for %s", async (_name, response) => {
		answer(response);
		await expect(listWebhooksOfCms()).resolves.toEqual(R.Error("server"));
	});
});
