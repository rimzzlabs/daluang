import { A, O, pipe, S } from "@mobily/ts-belt";
import { match, P } from "ts-pattern";
import { sendWebhook } from "./deliver";
import {
	countWebhooks,
	createWebhook,
	deleteWebhook,
	findWebhookUrl,
	listWebhooks,
	recordDelivery,
} from "./store";
import { newWebhookSchema, WEBHOOKS_API_PATH, WEBHOOKS_MAX } from "./webhook";

// A new webhook has a short name and a URL.
const BODY_MAX_BYTES = 4 * 1024;

/** The error codes of the endpoint. The browser shows one message for each code. */
export type WebhooksApiError =
	| "method-not-allowed"
	| "not-found"
	| "not-json"
	| "too-large"
	| "invalid-webhook"
	| "too-many";

/** The route of a path below `/api/webhooks`: the list, a webhook, or its test. */
export type WebhookRoute =
	| { kind: "list" }
	| { kind: "webhook"; id: string }
	| { kind: "test"; id: string };

/** The route of a path, or `None` for a path that the endpoint does not have. */
export function webhookRoute(pathname: string): O.Option<WebhookRoute> {
	if (!S.startsWith(pathname, WEBHOOKS_API_PATH)) return O.None;
	const parts = pipe(
		S.sliceToEnd(pathname, S.length(WEBHOOKS_API_PATH)),
		S.split("/"),
		A.reject(S.isEmpty),
	);
	return match(parts)
		.with([], () => O.Some<WebhookRoute>({ kind: "list" }))
		.with([P.string], ([id]) => O.Some<WebhookRoute>({ kind: "webhook", id }))
		.with([P.string, "test"], ([id]) =>
			O.Some<WebhookRoute>({ kind: "test", id }),
		)
		.otherwise(() => O.None);
}

function errorResponse(error: WebhooksApiError, init: ResponseInit) {
	return Response.json({ error }, init);
}

export interface WebhooksRequest {
	request: Request;
	db: D1Database;
	/** The clock of a write and of a delivery. A test gives a fixed one. */
	now?: () => Date;
	/** The `fetch` of a delivery. A test gives a fake. */
	fetcher?: typeof fetch;
}

/** Side effect: writes a new webhook to D1, so that a later delivery can find it. */
async function postWebhook(params: WebhooksRequest): Promise<Response> {
	const { request, db } = params;
	if (
		!S.startsWith(request.headers.get("content-type") ?? "", "application/json")
	)
		return errorResponse("not-json", { status: 415 });
	const text = await request.text();
	if (S.length(text) > BODY_MAX_BYTES)
		return errorResponse("too-large", { status: 413 });
	const body = O.fromExecution((): unknown => JSON.parse(text));
	if (O.isNone(body)) return errorResponse("not-json", { status: 400 });
	const parsed = newWebhookSchema.safeParse(body);
	if (!parsed.success)
		return Response.json(
			{
				error: "invalid-webhook",
				issues: A.map(parsed.error.issues, (issue) => ({
					path: pipe(issue.path, A.map(String), A.join(".")),
					message: issue.message,
				})),
			},
			{ status: 422 },
		);
	if ((await countWebhooks(db)) >= WEBHOOKS_MAX)
		return errorResponse("too-many", { status: 409 });
	const now = params.now ?? (() => new Date());
	const webhook = await createWebhook({ db, webhook: parsed.data, now: now() });
	return Response.json({ webhook }, { status: 201 });
}

/**
 * Side effect: sends a POST to the URL of the webhook, and writes the delivery to D1. The
 * writer then sees if the site got it.
 */
async function testWebhook(
	params: WebhooksRequest & { id: string },
): Promise<Response> {
	const { db, id } = params;
	const url = await findWebhookUrl({ db, id });
	if (O.isNone(url)) return errorResponse("not-found", { status: 404 });
	const delivery = await sendWebhook({
		url,
		event: "test",
		now: params.now ?? (() => new Date()),
		fetcher: params.fetcher ?? ((input, init) => fetch(input, init)),
	});
	await recordDelivery({ db, webhookId: id, delivery });
	return Response.json({ delivery });
}

function notAllowed(allow: string): Promise<Response> {
	return Promise.resolve(
		errorResponse("method-not-allowed", {
			status: 405,
			headers: { Allow: allow },
		}),
	);
}

/**
 * Side effect: reads and writes the webhooks in D1, and sends a test delivery. D1 keeps
 * the webhooks of the CMS.
 *
 * The endpoint of the webhooks. `GET /api/webhooks` lists them, `POST /api/webhooks` adds
 * one, `DELETE /api/webhooks/<id>` removes one, and `POST /api/webhooks/<id>/test` sends a
 * test delivery. The sign-in guard checks the session and the origin before it runs.
 */
export function handleWebhooksRequest(
	params: WebhooksRequest,
): Promise<Response> {
	const { request, db } = params;
	const route = webhookRoute(new URL(request.url).pathname);
	if (O.isNone(route))
		return Promise.resolve(errorResponse("not-found", { status: 404 }));
	return match({ route, method: request.method })
		.with({ route: { kind: "list" }, method: "GET" }, async () =>
			Response.json({ webhooks: await listWebhooks(db) }),
		)
		.with({ route: { kind: "list" }, method: "POST" }, () =>
			postWebhook(params),
		)
		.with({ route: { kind: "list" } }, () => notAllowed("GET, POST"))
		.with({ route: { kind: "webhook" }, method: "DELETE" }, async (found) => {
			const deleted = await deleteWebhook({ db, id: found.route.id });
			if (!deleted) return errorResponse("not-found", { status: 404 });
			return new Response(null, { status: 204 });
		})
		.with({ route: { kind: "webhook" } }, () => notAllowed("DELETE"))
		.with({ route: { kind: "test" }, method: "POST" }, (found) =>
			testWebhook({ ...params, id: found.route.id }),
		)
		.with({ route: { kind: "test" } }, () => notAllowed("POST"))
		.exhaustive();
}
