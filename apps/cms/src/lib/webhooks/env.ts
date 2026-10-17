import { env } from "cloudflare:workers";
import { type WebhooksEnv, webhooksEnvSchema } from "@daluang/webhooks/env";

/** The one module that reads the binding of the webhooks domain. */
export function readWebhooksEnv(): WebhooksEnv {
	return webhooksEnvSchema.parse(env);
}
