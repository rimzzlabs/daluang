import { describe, expect, it } from "vitest";
import {
	countWebhooks,
	createWebhook,
	deleteWebhook,
	findWebhookUrl,
	listWebhooks,
	listWebhookTargets,
	recordDelivery,
} from "../src/store";
import { DELIVERIES_KEPT } from "../src/webhook";
import { createFakeD1 } from "./fake-d1";

const NOW = new Date("2026-10-17T00:00:00.000Z");
const HOOK = { name: "Site", url: "https://example.com/deploy/a1b2c3d4" };

function delivery(index: number) {
	return {
		id: `d${index}`,
		event: "test" as const,
		status: "delivered" as const,
		statusCode: 200,
		durationMs: 10,
		createdAt: new Date(NOW.getTime() + index * 1000).toISOString(),
	};
}

describe("createWebhook and listWebhooks", () => {
	it("keeps the URL, and lists the webhook with the URL masked", async () => {
		const { db } = createFakeD1();
		const created = await createWebhook({ db, webhook: HOOK, now: NOW });
		expect(created).toEqual({
			id: expect.any(String),
			name: "Site",
			urlHint: "example.com/…c3d4",
			createdAt: NOW.toISOString(),
			deliveries: [],
		});
		await expect(listWebhooks(db)).resolves.toEqual([created]);
		await expect(findWebhookUrl({ db, id: created.id })).resolves.toBe(
			HOOK.url,
		);
		await expect(countWebhooks(db)).resolves.toBe(1);
	});

	it("gives None for the URL of a webhook that does not exist", async () => {
		const { db } = createFakeD1();
		await expect(findWebhookUrl({ db, id: "nope" })).resolves.toBeUndefined();
	});
});

describe("recordDelivery", () => {
	it("lists the 5 newest deliveries, and keeps only the newest ones in D1", async () => {
		const { db, database } = createFakeD1();
		const { id } = await createWebhook({ db, webhook: HOOK, now: NOW });
		for (const index of Array.from(
			{ length: DELIVERIES_KEPT + 2 },
			(_, i) => i,
		))
			await recordDelivery({ db, webhookId: id, delivery: delivery(index) });
		const [listed] = await listWebhooks(db);
		expect(listed?.deliveries.map((item) => item.id)).toEqual([
			"d21",
			"d20",
			"d19",
			"d18",
			"d17",
		]);
		const kept = database
			.prepare('select count(*) as "count" from "webhook_delivery"')
			.get();
		expect(kept?.count).toBe(DELIVERIES_KEPT);
	});
});

describe("deleteWebhook", () => {
	it("deletes a webhook and its deliveries, and is false the second time", async () => {
		const { db, database } = createFakeD1();
		const { id } = await createWebhook({ db, webhook: HOOK, now: NOW });
		await recordDelivery({ db, webhookId: id, delivery: delivery(1) });
		await expect(deleteWebhook({ db, id })).resolves.toBe(true);
		await expect(listWebhooks(db)).resolves.toEqual([]);
		expect(
			database
				.prepare('select count(*) as "count" from "webhook_delivery"')
				.get()?.count,
		).toBe(0);
		await expect(deleteWebhook({ db, id })).resolves.toBe(false);
	});
});

describe("listWebhookTargets", () => {
	it("gives the ID and the full URL of each webhook, the oldest first", async () => {
		const { db } = createFakeD1();
		const first = await createWebhook({ db, webhook: HOOK, now: NOW });
		const second = await createWebhook({
			db,
			webhook: { name: "Docs", url: "https://example.org/deploy/e5f6" },
			now: new Date("2026-10-17T01:00:00.000Z"),
		});
		expect(await listWebhookTargets(db)).toEqual([
			{ id: first.id, url: HOOK.url },
			{ id: second.id, url: "https://example.org/deploy/e5f6" },
		]);
	});
});
