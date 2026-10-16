import { z } from "zod";

// The same check as the env schema of the auth domain. D1 has these three methods.
function isD1Database(value: unknown): value is D1Database {
	if (typeof value !== "object" || value === null) return false;
	return "prepare" in value && "batch" in value && "exec" in value;
}

/** The binding that the settings domain reads. */
export const settingsEnvSchema = z.object({
	DB: z.custom<D1Database>(
		isD1Database,
		"The D1 binding DB is missing. Check wrangler.jsonc.",
	),
});

export type SettingsEnv = z.infer<typeof settingsEnvSchema>;
