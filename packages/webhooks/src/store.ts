import { A, D, O, pipe } from "@mobily/ts-belt";
import { z } from "zod";
import {
	DELIVERIES_KEPT,
	type Delivery,
	deliverySchema,
	type NewWebhook,
	urlHint,
	type Webhook,
} from "./webhook";

const webhookRowSchema = z.object({
	id: z.string(),
	name: z.string(),
	url: z.string(),
	createdAt: z.string(),
});

const deliveryRowSchema = deliverySchema.extend({ webhookId: z.string() });

type DeliveryRow = z.infer<typeof deliveryRowSchema>;

// The list shows the newest deliveries of each webhook. D1 keeps more for later pages.
const DELIVERIES_SHOWN = 5;

function parseRows<T>(rows: readonly unknown[], schema: z.ZodType<T>) {
	return A.filterMap(rows, (row) => O.fromNullable(schema.safeParse(row).data));
}

function toDelivery(row: DeliveryRow): Delivery {
	return D.deleteKey(row, "webhookId");
}

/**
 * Side effect: reads the webhooks and their deliveries from D1, because D1 keeps them.
 *
 * Each webhook, the newest first, with its newest deliveries. The URL is masked.
 */
export async function listWebhooks(
	db: D1Database,
): Promise<readonly Webhook[]> {
	const [webhooks, deliveries] = await Promise.all([
		db
			.prepare(
				'select "id", "name", "url", "createdAt" from "webhook" order by "createdAt" desc',
			)
			.all(),
		db
			.prepare(
				'select "id", "webhookId", "event", "status", "statusCode", "durationMs", "createdAt" from "webhook_delivery" order by "createdAt" desc',
			)
			.all(),
	]);
	const rows = parseRows(deliveries.results, deliveryRowSchema);
	return A.map(parseRows(webhooks.results, webhookRowSchema), (row) => ({
		id: row.id,
		name: row.name,
		urlHint: urlHint(row.url),
		createdAt: row.createdAt,
		deliveries: pipe(
			rows,
			A.filter((delivery) => delivery.webhookId === row.id),
			A.take(DELIVERIES_SHOWN),
			A.map(toDelivery),
		),
	}));
}

/**
 * Side effect: reads D1, because a CMS can have only `WEBHOOKS_MAX` webhooks.
 *
 * The number of webhooks.
 */
export async function countWebhooks(db: D1Database): Promise<number> {
	const result = await db
		.prepare('select count(*) as "count" from "webhook"')
		.all();
	return pipe(
		parseRows(result.results, z.object({ count: z.number() })),
		A.head,
		O.mapWithDefault(0, (row) => row.count),
	);
}

export interface WebhookCreate {
	db: D1Database;
	webhook: NewWebhook;
	now: Date;
}

/**
 * Side effect: writes a row with a random ID to D1. The webhook must stay after this
 * request.
 *
 * Adds a webhook.
 */
export async function createWebhook(create: WebhookCreate): Promise<Webhook> {
	const webhook = {
		id: crypto.randomUUID(),
		name: create.webhook.name,
		createdAt: create.now.toISOString(),
	};
	await create.db
		.prepare(
			'insert into "webhook" ("id", "name", "url", "createdAt") values (?1, ?2, ?3, ?4)',
		)
		.bind(webhook.id, webhook.name, create.webhook.url, webhook.createdAt)
		.run();
	return { ...webhook, urlHint: urlHint(create.webhook.url), deliveries: [] };
}

export interface WebhookRef {
	db: D1Database;
	id: string;
}

/**
 * Side effect: deletes a row and its deliveries from D1. A removed webhook gets no later
 * delivery.
 *
 * Removes a webhook. D1 enforces the foreign keys, so `on delete cascade` removes its
 * deliveries. False when no webhook has the ID.
 */
export async function deleteWebhook(ref: WebhookRef): Promise<boolean> {
	const result = await ref.db
		.prepare('delete from "webhook" where "id" = ?1')
		.bind(ref.id)
		.run();
	return result.meta.changes > 0;
}

/**
 * Side effect: reads the URL from D1. Only D1 keeps the full URL, because the URL is a
 * secret.
 *
 * The URL of a webhook, or `None`. Only a delivery reads the URL.
 */
export async function findWebhookUrl(
	ref: WebhookRef,
): Promise<O.Option<string>> {
	const result = await ref.db
		.prepare('select "url" from "webhook" where "id" = ?1')
		.bind(ref.id)
		.all();
	return pipe(
		parseRows(result.results, z.object({ url: z.string() })),
		A.head,
		O.map((row) => row.url),
	);
}

export interface DeliveryRecord {
	db: D1Database;
	webhookId: string;
	delivery: Delivery;
}

/**
 * Side effect: writes a delivery to D1, and deletes the old ones. The list shows the
 * newest deliveries.
 *
 * Records a delivery, and deletes the deliveries after the newest ones.
 */
export async function recordDelivery(record: DeliveryRecord): Promise<void> {
	const { db, webhookId, delivery } = record;
	await db.batch([
		db
			.prepare(
				'insert into "webhook_delivery" ("id", "webhookId", "event", "status", "statusCode", "durationMs", "createdAt") values (?1, ?2, ?3, ?4, ?5, ?6, ?7)',
			)
			.bind(
				delivery.id,
				webhookId,
				delivery.event,
				delivery.status,
				delivery.statusCode,
				delivery.durationMs,
				delivery.createdAt,
			),
		db
			.prepare(
				'delete from "webhook_delivery" where "webhookId" = ?1 and "id" not in (select "id" from "webhook_delivery" where "webhookId" = ?1 order by "createdAt" desc limit ?2)',
			)
			.bind(webhookId, DELIVERIES_KEPT),
	]);
}
