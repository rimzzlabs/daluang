import { A } from "@mobily/ts-belt";
import { sendWebhook } from "./deliver";
import { listWebhookTargets, recordDelivery } from "./store";
import type { Delivery, WebhookEvent } from "./webhook";

export interface EventDelivery {
	db: D1Database;
	event: WebhookEvent;
	now: () => Date;
	/** The `fetch` of the runtime. A test gives a fake. */
	fetcher: typeof fetch;
}

/**
 * Side effect: a POST to the URL of each webhook, and a record of each delivery in D1. A
 * publish must reach each site, so that each one rebuilds.
 *
 * Sends the event to each webhook at the same time. A failed delivery does not stop the
 * others: it is a delivery with the status `failed`.
 */
export async function deliverEvent(
	delivery: EventDelivery,
): Promise<readonly Delivery[]> {
	const targets = await listWebhookTargets(delivery.db);
	return Promise.all(
		A.map(targets, async (target) => {
			const sent = await sendWebhook({
				url: target.url,
				event: delivery.event,
				now: delivery.now,
				fetcher: delivery.fetcher,
			});
			await recordDelivery({
				db: delivery.db,
				webhookId: target.id,
				delivery: sent,
			});
			return sent;
		}),
	);
}
