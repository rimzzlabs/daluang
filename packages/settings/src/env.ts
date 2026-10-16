import { d1BindingSchema } from "@daluang/auth/env";
import { z } from "zod";

/** The binding that the settings domain reads. */
export const settingsEnvSchema = z.object({ DB: d1BindingSchema });

export type SettingsEnv = z.infer<typeof settingsEnvSchema>;
