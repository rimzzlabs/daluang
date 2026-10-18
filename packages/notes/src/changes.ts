import { A } from "@mobily/ts-belt";
import { match } from "ts-pattern";
import { applyChanges, listChanges } from "./store";

/** The path of the endpoint of the changes. */
export const CHANGES_API_PATH = "/api/changes";

/** The event that tells each site to rebuild after Publish changes. */
export type ChangesEvent = "publish";

export interface ChangesRequest {
	request: Request;
	db: D1Database;
	/** The clock. The route file gives `() => new Date()`, and a test gives a fixed time. */
	now: () => Date;
	/** Tells each site to rebuild. The route file sends the event to each webhook. */
	notify: (event: ChangesEvent) => Promise<void>;
}

/**
 * Side effect: applies each change in D1, and tells each site to rebuild one time. The
 * sites change only at Publish changes.
 */
async function publishChanges(params: ChangesRequest): Promise<Response> {
	const applied = await applyChanges({ db: params.db, now: params.now() });
	if (A.isNotEmpty(applied)) await params.notify("publish");
	return Response.json({ applied });
}

/**
 * Side effect: reads and writes the notes of D1, and sends one event for each Publish
 * changes.
 *
 * The endpoint of the changes. `GET /api/changes` gives the number of changes and each
 * change. `POST /api/changes` is Publish changes: it applies each change, then sends one
 * `publish` event when it applied a change. The sign-in guard checks the session and the
 * origin before this handler runs.
 */
export function handleChangesRequest(
	params: ChangesRequest,
): Promise<Response> {
	return match(params.request.method)
		.with("GET", async () => {
			const changes = await listChanges(params.db);
			return Response.json({ count: A.length(changes), changes });
		})
		.with("POST", () => publishChanges(params))
		.otherwise(() =>
			Promise.resolve(
				Response.json(
					{ error: "method-not-allowed" },
					{ status: 405, headers: { Allow: "GET, POST" } },
				),
			),
		);
}
