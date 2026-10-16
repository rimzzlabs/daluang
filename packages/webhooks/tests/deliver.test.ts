import { describe, expect, it, vi } from "vitest";
import { sendWebhook } from "../src/deliver";

function clock() {
	const times = [
		new Date("2026-10-17T00:00:00.000Z"),
		new Date("2026-10-17T00:00:00.120Z"),
	];
	return vi.fn(() => times.shift() ?? new Date(0));
}

describe("sendWebhook", () => {
	it("posts the event as JSON with no redirect, and gives a delivered result for 2xx", async () => {
		const fetcher = vi.fn(() =>
			Promise.resolve(new Response(null, { status: 200 })),
		);
		const delivery = await sendWebhook({
			url: "https://example.com/hook",
			event: "test",
			now: clock(),
			fetcher,
		});
		expect(delivery).toEqual({
			id: expect.any(String),
			event: "test",
			status: "delivered",
			statusCode: 200,
			durationMs: 120,
			createdAt: "2026-10-17T00:00:00.000Z",
		});
		expect(fetcher).toHaveBeenCalledWith(
			"https://example.com/hook",
			expect.objectContaining({
				method: "POST",
				redirect: "manual",
				body: JSON.stringify({
					event: "test",
					sentAt: "2026-10-17T00:00:00.000Z",
				}),
			}),
		);
	});

	it.each([
		["a redirect", 302],
		["an error", 500],
	])("gives a failed result for %s", async (_name, status) => {
		const delivery = await sendWebhook({
			url: "https://example.com/hook",
			event: "test",
			now: clock(),
			fetcher: () => Promise.resolve(new Response(null, { status })),
		});
		expect(delivery).toMatchObject({ status: "failed", statusCode: status });
	});

	it("gives a failed result with no status code when the request fails", async () => {
		const delivery = await sendWebhook({
			url: "https://example.com/hook",
			event: "test",
			now: clock(),
			fetcher: () => Promise.reject(new TypeError("Network")),
		});
		expect(delivery).toMatchObject({ status: "failed", statusCode: null });
	});

	it("gives a failed result when fetch throws before its promise", async () => {
		const delivery = await sendWebhook({
			url: "https://example.com/hook",
			event: "test",
			now: clock(),
			fetcher: () => {
				throw new TypeError("Illegal invocation");
			},
		});
		expect(delivery).toMatchObject({ status: "failed", statusCode: null });
	});
});
