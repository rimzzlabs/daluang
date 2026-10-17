import { env } from "cloudflare:workers";
import { type AuthEnv, authEnvSchema } from "@daluang/auth/env";

/**
 * The one module that reads the auth variables and the D1 binding. A wrong or missing value
 * throws at the first request, with the name of the variable in the message.
 */
export function readAuthEnv(): AuthEnv {
	return authEnvSchema.parse(env);
}
