import { z } from "zod";

// Better Auth finds a D1 binding by these three methods. The schema checks the same ones.
function isD1Database(value: unknown): value is D1Database {
	if (typeof value !== "object" || value === null) return false;
	return "prepare" in value && "batch" in value && "exec" in value;
}

/**
 * The D1 binding `DB` of the CMS. Each domain that keeps data in D1 reads the binding with
 * this schema.
 */
export const d1BindingSchema = z.custom<D1Database>(
	isD1Database,
	"The D1 binding DB is missing. Check wrangler.jsonc.",
);

/** The variables and the binding that the auth domain reads. `.dev.vars.example` lists each one. */
export const authEnvSchema = z.object({
	DB: d1BindingSchema,
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
