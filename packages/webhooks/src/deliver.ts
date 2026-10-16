import { R } from "@mobily/ts-belt";
import type { Delivery, WebhookEvent } from "./webhook";

// A deploy hook answers at once. A webhook that takes longer counts as failed.
const TIMEOUT_MS = 10_000;

export interface WebhookSend {
	url: string;
	event: WebhookEvent;
	now: () => Date;
	/** The `fetch` of the runtime. A test gives a fake. */
	fetcher: typeof fetch;
}

// An async function: a throw of `fetch`, also a throw before its promise, is a rejection.
async function post(send: WebhookSend, sentAt: Date): Promise<Response> {
	// Workers refuses a call of `fetch` with another `this`, so the call has none.
	const { fetcher } = send;
	return fetcher(send.url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"User-Agent": "Daluang-Webhook/1",
		},
		body: JSON.stringify({ event: send.event, sentAt: sentAt.toISOString() }),
		redirect: "manual",
		signal: AbortSignal.timeout(TIMEOUT_MS),
	});
}

/**
 * Sends one delivery: a POST with the event as JSON. The CMS does not follow a redirect,
 * so a webhook cannot send the request to another host. A status of 2xx is delivered. A
 * request that fails or takes too long is failed, with no status code.
 */
export async function sendWebhook(send: WebhookSend): Promise<Delivery> {
	const started = send.now();
	const response = await R.fromPromise(post(send, started));
	const durationMs = send.now().getTime() - started.getTime();
	const statusCode = R.match(
		response,
		(answer) => answer.status,
		() => null,
	);
	const delivered =
		statusCode !== null && statusCode >= 200 && statusCode < 300;
	return {
		id: crypto.randomUUID(),
		event: send.event,
		status: delivered ? "delivered" : "failed",
		statusCode,
		durationMs,
		createdAt: started.toISOString(),
	};
}
