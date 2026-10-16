import { env } from "cloudflare:workers";
import { type SettingsEnv, settingsEnvSchema } from "../env";

/** The one module that reads the binding of the settings domain. */
export function readSettingsEnv(): SettingsEnv {
	return settingsEnvSchema.parse(env);
}
