import { A, O, pipe, R, S } from "@mobily/ts-belt";
import { z } from "zod";

export const WEBHOOK_NAME_MAX_LENGTH = 60;

/** The most webhooks that a CMS can have. */
export const WEBHOOKS_MAX = 10;

/** The deliveries that the CMS keeps for each webhook, the newest ones. */
export const DELIVERIES_KEPT = 20;

/** The events that the CMS sends. `test` is the delivery of the button "Send a test". */
export const WEBHOOK_EVENTS = ["test"] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

/** The path of the endpoint of the webhooks. */
export const WEBHOOKS_API_PATH = "/api/webhooks";

// A host that is an address, not a name: `127.0.0.1`, `[::1]`. A deploy hook has a name.
const ADDRESS_HOST = /^(\d{1,3}(\.\d{1,3}){3}|\[[0-9a-f:.]+\])$/i;

// The endings of the names that only a local network resolves.
const LOCAL_NAME_ENDINGS = [
	".localhost",
	".local",
	".internal",
	".home.arpa",
	".lan",
];

/** True for a host name that the public DNS can resolve: it has a dot and no local ending. */
function isPublicName(hostname: string): boolean {
	// `localhost.` with its last dot is the name `localhost`.
	const name = S.replaceByRe(hostname, /\.+$/, "");
	if (!S.includes(name, ".") || ADDRESS_HOST.test(name)) return false;
	return !A.some(LOCAL_NAME_ENDINGS, (ending) => S.endsWith(name, ending));
}

/**
 * True for a URL that the CMS sends a webhook to: `https`, with a public host name and no
 * user name. The check refuses `localhost`, an IP address, and a name of a local network.
 * It reads no DNS, so a public name of a local address passes, for example
 * `127.0.0.1.nip.io`. On Cloudflare, a Worker cannot reach a private network. The check is
 * for a CMS on another host, for example `astro dev`.
 */
export function isWebhookUrl(value: string): boolean {
	return pipe(
		R.fromExecution(() => new URL(value)),
		R.toOption,
		O.filter((url) => url.protocol === "https:"),
		O.filter((url) => url.username === "" && url.password === ""),
		O.filter((url) => isPublicName(url.hostname)),
		O.isSome,
	);
}

export const newWebhookSchema = z.strictObject({
	name: z
		.string()
		.trim()
		.min(1, "Give the webhook a name, for example the name of your site.")
		.max(
			WEBHOOK_NAME_MAX_LENGTH,
			`Keep the name at ${WEBHOOK_NAME_MAX_LENGTH} characters or fewer.`,
		),
	url: z
		.string()
		.trim()
		.max(2000, "Keep the URL at 2000 characters or fewer.")
		.refine(
			isWebhookUrl,
			"Use an https URL with the name of a host, for example the deploy hook of your site.",
		),
});

export type NewWebhook = z.infer<typeof newWebhookSchema>;

export const DELIVERY_STATUSES = ["delivered", "failed"] as const;

/** One POST of the CMS to a webhook, and its result. */
export const deliverySchema = z.object({
	id: z.string(),
	event: z.enum(WEBHOOK_EVENTS),
	status: z.enum(DELIVERY_STATUSES),
	/** The status code of the answer, or `null` when no answer came. */
	statusCode: z.number().nullable(),
	durationMs: z.number(),
	createdAt: z.string(),
});

export type Delivery = z.infer<typeof deliverySchema>;

/** A webhook as the CMS shows it: the URL masked, with its last deliveries. */
export const webhookSchema = z.object({
	id: z.string(),
	name: z.string(),
	/** The host of the URL and its last 4 characters: `api.cloudflare.com/…1a2b`. */
	urlHint: z.string(),
	createdAt: z.string(),
	deliveries: z.array(deliverySchema).readonly(),
});

export type Webhook = z.infer<typeof webhookSchema>;

/** The hint of a URL: its host and its last 4 characters. The URL is a secret. */
export function urlHint(url: string): string {
	const host = pipe(
		R.fromExecution(() => new URL(url).host),
		R.getWithDefault("?"),
	);
	return `${host}/…${S.sliceToEnd(url, -4)}`;
}
