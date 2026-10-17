import { A, O, pipe } from "@mobily/ts-belt";
import { type ApiToken, apiTokenSchema } from "./api-token";
import { generateTokenSecret, hashTokenSecret, tokenStart } from "./token";

const COLUMNS = '"id", "name", "start", "createdAt", "lastUsedAt"';

function toTokens(rows: readonly unknown[]): readonly ApiToken[] {
	return A.filterMap(rows, (row) =>
		O.fromNullable(apiTokenSchema.safeParse(row).data),
	);
}

/**
 * Side effect: reads the table `api_token` of D1, because D1 keeps the tokens.
 *
 * Each token, the newest first.
 */
export async function listTokens(db: D1Database): Promise<readonly ApiToken[]> {
	const result = await db
		.prepare(`select ${COLUMNS} from "api_token" order by "createdAt" desc`)
		.all();
	return toTokens(result.results);
}

export interface TokenCreate {
	db: D1Database;
	name: string;
	now: Date;
}

export interface CreatedToken {
	token: ApiToken;
	/** The token itself. The CMS gives it one time, and keeps only its hash. */
	secret: string;
}

/**
 * Side effect: writes a row with a random ID to D1. The token must stay valid after this
 * request.
 *
 * Makes a token. D1 keeps its hash and its start.
 */
export async function createToken(create: TokenCreate): Promise<CreatedToken> {
	const secret = generateTokenSecret();
	const token: ApiToken = {
		id: crypto.randomUUID(),
		name: create.name,
		start: tokenStart(secret),
		createdAt: create.now.toISOString(),
		lastUsedAt: null,
	};
	await create.db
		.prepare(
			'insert into "api_token" ("id", "name", "hash", "start", "createdAt") values (?1, ?2, ?3, ?4, ?5)',
		)
		.bind(
			token.id,
			token.name,
			await hashTokenSecret(secret),
			token.start,
			token.createdAt,
		)
		.run();
	return { token, secret };
}

export interface TokenRef {
	db: D1Database;
	id: string;
}

/**
 * Side effect: deletes a row from D1. A revoked token must fail at the next request.
 *
 * Revokes a token: D1 deletes it. False when no token has the ID.
 */
export async function deleteToken(ref: TokenRef): Promise<boolean> {
	const result = await ref.db
		.prepare('delete from "api_token" where "id" = ?1')
		.bind(ref.id)
		.run();
	return result.meta.changes > 0;
}

export interface TokenLookup {
	db: D1Database;
	hash: string;
}

/**
 * Side effect: reads D1, because only D1 knows which tokens exist.
 *
 * The token with this hash, or `None`.
 */
export async function findTokenByHash(
	lookup: TokenLookup,
): Promise<O.Option<ApiToken>> {
	const result = await lookup.db
		.prepare(`select ${COLUMNS} from "api_token" where "hash" = ?1`)
		.bind(lookup.hash)
		.all();
	return pipe(toTokens(result.results), A.head);
}

export interface TokenUse {
	db: D1Database;
	id: string;
	now: Date;
	/** The time before which a use is old enough to record again. */
	before: Date;
}

/**
 * Side effect: writes the time of the last use to D1. The list of tokens shows it.
 *
 * Records the time of a use. One write in each interval is enough for the list.
 */
export async function markTokenUsed(use: TokenUse): Promise<void> {
	await use.db
		.prepare(
			'update "api_token" set "lastUsedAt" = ?1 where "id" = ?2 and ("lastUsedAt" is null or "lastUsedAt" < ?3)',
		)
		.bind(use.now.toISOString(), use.id, use.before.toISOString())
		.run();
}
