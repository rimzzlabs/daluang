import { d1BindingSchema } from "@daluang/auth/env";
import { z } from "zod";

/** The binding that the webhooks domain reads. */
export const webhooksEnvSchema = z.object({ DB: d1BindingSchema });

export type WebhooksEnv = z.infer<typeof webhooksEnvSchema>;
