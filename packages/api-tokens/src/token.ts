import { A, O, pipe, S } from "@mobily/ts-belt";

/** The start of each token. A secret scanner can find a token of Daluang by it. */
export const TOKEN_PREFIX = "dlg_";

// 32 random bytes are 43 characters of base64url.
const SECRET_BYTES = 32;
const TOKEN_PATTERN = /^dlg_[A-Za-z0-9_-]{43}$/;
// The prefix and 4 characters: enough to tell the tokens of a list apart.
const START_LENGTH = TOKEN_PREFIX.length + 4;

function base64Url(bytes: Uint8Array): string {
	return pipe(
		btoa(String.fromCharCode(...bytes)),
		S.replaceByRe(/\+/g, "-"),
		S.replaceByRe(/\//g, "_"),
		S.replaceByRe(/=+$/, ""),
	);
}

/** A new token: the prefix and 32 random bytes. Daluang shows it to the writer one time. */
export function generateTokenSecret(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(SECRET_BYTES));
	return `${TOKEN_PREFIX}${base64Url(bytes)}`;
}

/** True for a value with the form of a token of Daluang. */
export function isTokenSecret(value: string): boolean {
	return TOKEN_PATTERN.test(value);
}

/**
 * The SHA-256 hash of a token, in hex. D1 keeps the hash, not the token. A token has 256
 * random bits, so a fast hash is safe: nobody can guess a token from its hash.
 */
export async function hashTokenSecret(secret: string): Promise<string> {
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(secret),
	);
	return pipe(
		Array.from(new Uint8Array(digest)),
		A.map((byte) => byte.toString(16).padStart(2, "0")),
		A.join(""),
	);
}

/** The start of a token, for a list: `dlg_AbCd`. */
export function tokenStart(secret: string): string {
	return S.slice(secret, 0, START_LENGTH);
}

/** The token of an `Authorization: Bearer <token>` header, or `None`. */
export function bearerSecret(authorization: string | null): O.Option<string> {
	return pipe(
		O.fromNullable(authorization),
		O.map(S.trim),
		O.flatMap((value) => {
			const [scheme = "", secret = "", ...rest] = S.split(value, " ");
			if (S.toLowerCase(scheme) !== "bearer" || A.isNotEmpty(rest))
				return O.None;
			return O.Some(secret);
		}),
		O.filter(isTokenSecret),
	);
}
