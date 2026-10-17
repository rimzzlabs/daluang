import { A, O, pipe, S } from "@mobily/ts-belt";
import { match, P } from "ts-pattern";
import { newTokenSchema, TOKENS_MAX } from "./api-token";
import { createToken, deleteToken, listTokens } from "./store";

// A request for a new token has one short name.
const BODY_MAX_BYTES = 2 * 1024;

/** The error codes of the endpoint. The browser shows one message for each code. */
export type TokensApiError =
	| "method-not-allowed"
	| "not-json"
	| "too-large"
	| "invalid-name"
	| "too-many"
	| "not-found";

function errorResponse(error: TokensApiError, init: ResponseInit) {
	return Response.json({ error }, init);
}

export interface TokensRequest {
	request: Request;
	db: D1Database;
	/** The ID of `/api/tokens/<id>`, or `undefined` for `/api/tokens`. */
	id: string | undefined;
	/** The time of a new token. A test gives a fixed time. */
	now?: () => Date;
}

/**
 * Side effect: writes a new token to D1. A site needs a token that stays valid after this
 * request.
 */
async function postToken(params: TokensRequest): Promise<Response> {
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
	const parsed = newTokenSchema.safeParse(body);
	if (!parsed.success) {
		const message = pipe(
			parsed.error.issues,
			A.head,
			O.mapWithDefault("Give the token a name.", (issue) => issue.message),
		);
		return Response.json({ error: "invalid-name", message }, { status: 422 });
	}
	if (A.length(await listTokens(db)) >= TOKENS_MAX)
		return errorResponse("too-many", { status: 409 });
	const now = params.now ?? (() => new Date());
	const created = await createToken({ db, name: parsed.data.name, now: now() });
	return Response.json(created, { status: 201 });
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
 * Side effect: reads and writes the table `api_token` of D1, because D1 keeps the tokens
 * of the CMS.
 *
 * The endpoint of the API tokens. `GET /api/tokens` lists the tokens, `POST /api/tokens`
 * makes one and gives the token one time, and `DELETE /api/tokens/<id>` revokes one. The
 * sign-in guard checks the session and the origin before this handler runs.
 */
export function handleTokensRequest(params: TokensRequest): Promise<Response> {
	const { request, db, id } = params;
	return match({ method: request.method, id })
		.with({ method: "GET", id: undefined }, async () =>
			Response.json({ tokens: await listTokens(db) }),
		)
		.with({ method: "POST", id: undefined }, () => postToken(params))
		.with({ id: undefined }, () => notAllowed("GET, POST"))
		.with({ method: "DELETE", id: P.string }, async (route) => {
			const deleted = await deleteToken({ db, id: route.id });
			if (!deleted) return errorResponse("not-found", { status: 404 });
			return new Response(null, { status: 204 });
		})
		.with({ id: P.string }, () => notAllowed("DELETE"))
		.exhaustive();
}
