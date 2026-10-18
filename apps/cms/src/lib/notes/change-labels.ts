import type { NoteChange } from "@daluang/notes/change";
import type { NoteStatus } from "@daluang/notes/metadata";

/** The name of each change that waits for Publish changes, as the writer reads it. */
export const CHANGE_LABELS: Record<NoteChange, string> = {
	publish: "To publish",
	edit: "Edited",
	unpublish: "To unpublish",
	delete: "To delete",
};

/** The name of each status of a post. */
export const STATUS_LABELS: Record<NoteStatus, string> = {
	draft: "Draft",
	published: "Published",
};
