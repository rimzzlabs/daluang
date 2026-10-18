import { env } from "cloudflare:workers";
import { type NotesEnv, notesEnvSchema } from "@daluang/notes/env";

/** The one module that reads the binding of the notes domain. */
export function readNotesEnv(): NotesEnv {
	return notesEnvSchema.parse(env);
}
