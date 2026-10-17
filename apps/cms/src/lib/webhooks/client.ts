import {
	type Delivery,
	deliverySchema,
	WEBHOOKS_API_PATH,
	type Webhook,
	webhookSchema,
} from "@daluang/webhooks/webhook";
import { R } from "@mobily/ts-belt";
import { match, P } from "ts-pattern";
import { z } from "zod";

/** Why a request of the webhooks page failed. The UI shows one message for each code. */
export type WebhooksError =
	| "invalid"
	| "too-many"
	| "not-found"
	| "signed-out"
	| "offline"
	| "server";

export const WEBHOOKS_ERROR_MESSAGES: Record<WebhooksError, string> = {
	invalid:
		"Daluang refused a value. Check the name and the URL, then try again.",
	"too-many":
		"This CMS has the most webhooks that it can have. Remove one first.",
	"not-found": "The webhook does not exist. Open the page again.",
	"signed-out": "Your session ended. Sign in again, then try again.",
	offline:
		"Daluang could not reach the server. Check your connection, then try again.",
	server: "The server could not do the request. Try again.",
};

const listSchema = z.object({ webhooks: z.array(webhookSchema) });
const createdSchema = z.object({ webhook: webhookSchema });
const testedSchema = z.object({ delivery: deliverySchema });

function statusError(status: number): WebhooksError {
	return match(status)
		.with(401, () => "signed-out" as const)
		.with(404, () => "not-found" as const)
		.with(409, () => "too-many" as const)
		.with(P.union(400, 413, 415, 422), () => "invalid" as const)
		.otherwise(() => "server" as const);
}

async function send(
	path: string,
	init?: RequestInit,
): Promise<R.Result<Response, WebhooksError>> {
	const response = await R.fromPromise(fetch(path, init));
	if (R.isError(response)) return R.Error("offline");
	const answer = R.getExn(response);
	if (!answer.ok) return R.Error(statusError(answer.status));
	return R.Ok(answer);
}

async function readBody<T>(
	response: R.Result<Response, WebhooksError>,
	schema: z.ZodType<T>,
): Promise<R.Result<T, WebhooksError>> {
	if (R.isError(response)) return response;
	const body = await R.fromPromise<unknown>(R.getExn(response).json());
	if (R.isError(body)) return R.Error("server");
	const parsed = schema.safeParse(R.getExn(body));
	return parsed.success ? R.Ok(parsed.data) : R.Error("server");
}

/** The webhooks of the CMS, with their newest deliveries. */
export async function listWebhooksOfCms(): Promise<
	R.Result<readonly Webhook[], WebhooksError>
> {
	const body = await readBody(await send(WEBHOOKS_API_PATH), listSchema);
	return R.map(body, (list) => list.webhooks);
}

export interface WebhookInput {
	name: string;
	url: string;
}

/** Adds a webhook. */
export async function addWebhook(
	input: WebhookInput,
): Promise<R.Result<Webhook, WebhooksError>> {
	const response = await send(WEBHOOKS_API_PATH, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	const body = await readBody(response, createdSchema);
	return R.map(body, (created) => created.webhook);
}

function webhookPath(id: string): string {
	return `${WEBHOOKS_API_PATH}/${encodeURIComponent(id)}`;
}

/** Removes a webhook. */
export async function removeWebhook(
	id: string,
): Promise<R.Result<true, WebhooksError>> {
	const response = await send(webhookPath(id), { method: "DELETE" });
	return R.map(response, () => true as const);
}

/** Sends a test delivery, and gives its result. */
export async function testWebhookOfCms(
	id: string,
): Promise<R.Result<Delivery, WebhooksError>> {
	const response = await send(`${webhookPath(id)}/test`, { method: "POST" });
	const body = await readBody(response, testedSchema);
	return R.map(body, (tested) => tested.delivery);
}
