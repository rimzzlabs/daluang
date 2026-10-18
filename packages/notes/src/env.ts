import { d1BindingSchema } from "@daluang/auth/env";
import { z } from "zod";

/** The binding that the notes domain reads. */
export const notesEnvSchema = z.object({ DB: d1BindingSchema });

export type NotesEnv = z.infer<typeof notesEnvSchema>;
