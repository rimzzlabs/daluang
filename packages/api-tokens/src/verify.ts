import { O, R } from "@mobily/ts-belt";
import type { ApiToken } from "./api-token";
import { findTokenByHash, markTokenUsed } from "./store";
import { bearerSecret, hashTokenSecret } from "./token";

/** Why a request has no valid token. */
export type TokenCheckError = "missing" | "unknown";

// A site build reads many notes in a minute. One write of the last use is enough.
const USE_INTERVAL_MS = 60_000;

export interface TokenCheck {
	db: D1Database;
	/** The `Authorization` header of the request. */
	authorization: string | null;
	now: Date;
}

/**
 * The token of a request: `Authorization: Bearer dlg_…`. A token that D1 does not have is
 * `unknown`: it is revoked, or it never existed. A valid token records its last use.
 */
export async function verifyApiToken(
	check: TokenCheck,
): Promise<R.Result<ApiToken, TokenCheckError>> {
	const secret = bearerSecret(check.authorization);
	if (O.isNone(secret)) return R.Error("missing");
	const token = await findTokenByHash({
		db: check.db,
		hash: await hashTokenSecret(secret),
	});
	if (O.isNone(token)) return R.Error("unknown");
	await markTokenUsed({
		db: check.db,
		id: token.id,
		now: check.now,
		before: new Date(check.now.getTime() - USE_INTERVAL_MS),
	});
	return R.Ok(token);
}
