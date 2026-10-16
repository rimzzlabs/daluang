import { env } from "cloudflare:workers";
import { type ApiTokensEnv, apiTokensEnvSchema } from "../env";

/** The one module that reads the binding of the API tokens domain. */
export function readApiTokensEnv(): ApiTokensEnv {
	return apiTokensEnvSchema.parse(env);
}
