import type { NoteEvent } from "@daluang/notes/api";
import { deliverEvent } from "@daluang/webhooks/deliver-event";

/** The `notify` of the endpoint of the notes: it sends the event to each webhook. */
export function notifySites(
	db: D1Database,
): (event: NoteEvent) => Promise<void> {
	return async (event) => {
		await deliverEvent({
			db,
			event,
			now: () => new Date(),
			// Workers refuses a call of `fetch` as the method of another object, so the call has
			// no `this`.
			fetcher: (input, init) => fetch(input, init),
		});
	};
}
