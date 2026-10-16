import { z } from "zod";

export const TOKEN_NAME_MAX_LENGTH = 60;

/** The most tokens that a CMS can have. A site needs one, and a CMS has few sites. */
export const TOKENS_MAX = 20;

/** The name of a token: the site or the build that uses it. */
export const tokenNameSchema = z
	.string()
	.trim()
	.min(1, "Give the token a name, for example the name of your site.")
	.max(
		TOKEN_NAME_MAX_LENGTH,
		`Keep the name at ${TOKEN_NAME_MAX_LENGTH} characters or fewer.`,
	);

/** The body of a request for a new token. */
export const newTokenSchema = z.strictObject({ name: tokenNameSchema });

/** A token as the CMS shows it: never the token itself, only its start. */
export const apiTokenSchema = z.object({
	id: z.string(),
	name: z.string(),
	start: z.string(),
	createdAt: z.string(),
	/** The last time that a site used the token, or `null` when no site used it. */
	lastUsedAt: z.string().nullable(),
});

export type ApiToken = z.infer<typeof apiTokenSchema>;

/** The path of the endpoint of the tokens. `DELETE <path>/<id>` revokes a token. */
export const TOKENS_API_PATH = "/api/tokens";
