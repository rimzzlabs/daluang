import { d1BindingSchema } from "@daluang/auth/env";
import { z } from "zod";

/** The binding that the API tokens domain reads. */
export const apiTokensEnvSchema = z.object({ DB: d1BindingSchema });

export type ApiTokensEnv = z.infer<typeof apiTokensEnvSchema>;
