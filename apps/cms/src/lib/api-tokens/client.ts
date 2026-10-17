import {
	type ApiToken,
	apiTokenSchema,
	TOKENS_API_PATH,
} from "@daluang/api-tokens/api-token";
import { R } from "@mobily/ts-belt";
import { match, P } from "ts-pattern";
import { z } from "zod";

/** Why a request of the tokens page failed. The UI shows one message for each code. */
export type ApiTokensError =
	| "invalid"
	| "too-many"
	| "signed-out"
	| "offline"
	| "server";

export const TOKENS_ERROR_MESSAGES: Record<ApiTokensError, string> = {
	invalid: "Daluang refused the name. Check it, then try again.",
	"too-many":
		"This CMS has the most tokens that it can have. Revoke a token first.",
	"signed-out": "Your session ended. Sign in again, then try again.",
	offline:
		"Daluang could not reach the server. Check your connection, then try again.",
	server: "The server could not do the request. Try again.",
};

const listSchema = z.object({ tokens: z.array(apiTokenSchema) });
const createdSchema = z.object({ token: apiTokenSchema, secret: z.string() });

export type CreatedApiToken = z.infer<typeof createdSchema>;

function statusError(status: number): ApiTokensError {
	return match(status)
		.with(401, () => "signed-out" as const)
		.with(409, () => "too-many" as const)
		.with(P.union(400, 413, 415, 422), () => "invalid" as const)
		.otherwise(() => "server" as const);
}

async function send(
	path: string,
	init?: RequestInit,
): Promise<R.Result<Response, ApiTokensError>> {
	const response = await R.fromPromise(fetch(path, init));
	if (R.isError(response)) return R.Error("offline");
	const ok = R.getExn(response);
	if (!ok.ok) return R.Error(statusError(ok.status));
	return R.Ok(ok);
}

async function readBody<T>(
	response: Response,
	schema: z.ZodType<T>,
): Promise<R.Result<T, ApiTokensError>> {
	const body = await R.fromPromise<unknown>(response.json());
	if (R.isError(body)) return R.Error("server");
	const parsed = schema.safeParse(R.getExn(body));
	return parsed.success ? R.Ok(parsed.data) : R.Error("server");
}

/** The tokens of the CMS, the newest first. */
export async function listApiTokens(): Promise<
	R.Result<readonly ApiToken[], ApiTokensError>
> {
	const response = await send(TOKENS_API_PATH);
	if (R.isError(response)) return response;
	const body = await readBody(R.getExn(response), listSchema);
	return R.map(body, (list) => list.tokens);
}

/** Makes a token. The result has the token itself, which the page shows one time. */
export async function createApiToken(
	name: string,
): Promise<R.Result<CreatedApiToken, ApiTokensError>> {
	const response = await send(TOKENS_API_PATH, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name }),
	});
	if (R.isError(response)) return response;
	return readBody(R.getExn(response), createdSchema);
}

/** Revokes a token. A site that uses it can no longer read the notes. */
export async function revokeApiToken(
	id: string,
): Promise<R.Result<true, ApiTokensError>> {
	const response = await send(`${TOKENS_API_PATH}/${encodeURIComponent(id)}`, {
		method: "DELETE",
	});
	return R.map(response, () => true as const);
}
