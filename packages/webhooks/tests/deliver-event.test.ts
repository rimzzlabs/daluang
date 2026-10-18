import { A, pipe } from "@mobily/ts-belt";
import { describe, expect, it, vi } from "vitest";
import { deliverEvent } from "../src/deliver-event";
import { createWebhook, listWebhooks } from "../src/store";
import { createFakeD1 } from "./fake-d1";

const NOW = new Date("2026-10-18T00:00:00.000Z");

function addTwoWebhooks(db: D1Database) {
	return Promise.all([
		createWebhook({
			db,
			webhook: { name: "Site", url: "https://example.com/deploy/a1" },
			now: NOW,
		}),
		createWebhook({
			db,
			webhook: { name: "Docs", url: "https://example.org/deploy/b2" },
			now: NOW,
		}),
	]);
}

describe("deliverEvent", () => {
	it("sends the event to each webhook, and records each delivery", async () => {
		const { db } = createFakeD1();
		await addTwoWebhooks(db);
		const fetcher = vi.fn(() =>
			Promise.resolve(new Response(null, { status: 200 })),
		);
		const deliveries = await deliverEvent({
			db,
			event: "publish",
			now: () => NOW,
			fetcher,
		});
		expect(deliveries).toHaveLength(2);
		expect(fetcher).toHaveBeenCalledWith(
			"https://example.com/deploy/a1",
			expect.objectContaining({ method: "POST" }),
		);
		expect(fetcher).toHaveBeenCalledWith(
			"https://example.org/deploy/b2",
			expect.anything(),
		);
		const webhooks = await listWebhooks(db);
		expect(A.map(webhooks, (webhook) => webhook.deliveries[0]?.event)).toEqual([
			"publish",
			"publish",
		]);
	});

	it("keeps the other deliveries when one webhook fails", async () => {
		const { db } = createFakeD1();
		await addTwoWebhooks(db);
		const fetcher = vi.fn((url: string | URL | Request) =>
			String(url).includes("example.com")
				? Promise.reject(new Error("offline"))
				: Promise.resolve(new Response(null, { status: 204 })),
		);
		const deliveries = await deliverEvent({
			db,
			event: "unpublish",
			now: () => NOW,
			fetcher,
		});
		expect(
			pipe(
				deliveries,
				A.map((delivery) => delivery.status),
				A.sort((a, b) => a.localeCompare(b)),
			),
		).toEqual(["delivered", "failed"]);
	});

	it("sends nothing when the CMS has no webhook", async () => {
		const { db } = createFakeD1();
		const fetcher = vi.fn();
		expect(
			await deliverEvent({ db, event: "publish", now: () => NOW, fetcher }),
		).toEqual([]);
		expect(fetcher).not.toHaveBeenCalled();
	});
});
