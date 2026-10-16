import { z } from "zod";

function isD1Database(value: unknown): value is D1Database {
	return (
		typeof value === "object" &&
		value !== null &&
		"prepare" in value &&
		"batch" in value
	);
}

/** The variables and the binding that the auth domain reads. `.dev.vars.example` lists each one. */
export const authEnvSchema = z.object({
	DB: z.custom<D1Database>(
		isD1Database,
		"The D1 binding DB is missing. Check wrangler.jsonc.",
	),
	BETTER_AUTH_SECRET: z
		.string()
		.min(32, "Set BETTER_AUTH_SECRET to 32 or more characters."),
	BETTER_AUTH_URL: z.url("Set BETTER_AUTH_URL to the URL of the CMS."),
	GITHUB_CLIENT_ID: z
		.string()
		.min(1, "Set GITHUB_CLIENT_ID from your GitHub OAuth app."),
	GITHUB_CLIENT_SECRET: z
		.string()
		.min(1, "Set GITHUB_CLIENT_SECRET from your GitHub OAuth app."),
	ALLOWED_GITHUB_USERS: z.string().default(""),
});

export type AuthEnv = z.infer<typeof authEnvSchema>;
