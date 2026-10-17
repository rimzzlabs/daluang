import { A, O, pipe, S } from "@mobily/ts-belt";
import { match, P } from "ts-pattern";
import type { z } from "zod";
import { settingsPatchSchema } from "./settings";
import { readSettings, writeSettings } from "./store";

// A patch has two small settings. A larger body is not a patch.
const BODY_MAX_BYTES = 16 * 1024;

/** The error codes of the endpoint. The browser shows one message for each code. */
export type SettingsApiError =
	| "method-not-allowed"
	| "not-json"
	| "too-large"
	| "invalid-settings";

export interface SettingsIssue {
	/** The path of the field, for example `site.url`. Empty for the patch itself. */
	path: string;
	message: string;
}

interface ErrorInit extends ResponseInit {
	issues?: readonly SettingsIssue[];
}

function errorResponse(error: SettingsApiError, init: ErrorInit) {
	const { issues, ...rest } = init;
	return Response.json({ error, ...(issues ? { issues } : {}) }, rest);
}

function toIssues(error: z.ZodError): readonly SettingsIssue[] {
	return A.map(error.issues, (issue) => ({
		path: pipe(issue.path, A.map(String), A.join(".")),
		message: issue.message,
	}));
}

export interface SettingsRequest {
	request: Request;
	db: D1Database;
	/** The clock. The route file gives `() => new Date()`, and a test gives a fixed time. */
	now: () => Date;
}

/** Side effect: writes the settings to D1, so that they stay after this request. */
async function patchSettings(params: SettingsRequest): Promise<Response> {
	const { request, db } = params;
	if (
		!S.startsWith(request.headers.get("content-type") ?? "", "application/json")
	)
		return errorResponse("not-json", { status: 415 });
	const text = await request.text();
	if (S.length(text) > BODY_MAX_BYTES)
		return errorResponse("too-large", { status: 413 });
	const body = O.fromExecution((): unknown => JSON.parse(text));
	if (O.isNone(body)) return errorResponse("not-json", { status: 400 });
	const patch = settingsPatchSchema.safeParse(body);
	if (!patch.success)
		return errorResponse("invalid-settings", {
			status: 422,
			issues: toIssues(patch.error),
		});
	await writeSettings({ db, patch: patch.data, now: params.now() });
	return Response.json({ settings: await readSettings(db) });
}

/**
 * Side effect: reads and writes the table `setting` of D1, because D1 keeps the settings
 * of the CMS.
 *
 * The endpoint of the settings. `GET` gives the stored settings. `PATCH` writes one setting
 * or more, then gives the stored settings. The sign-in guard checks the session and the
 * origin before this handler runs.
 */
export function handleSettingsRequest(
	params: SettingsRequest,
): Promise<Response> {
	return match(params.request.method)
		.with("GET", async () =>
			Response.json({ settings: await readSettings(params.db) }),
		)
		.with("PATCH", () => patchSettings(params))
		.with(P.string, () =>
			Promise.resolve(
				errorResponse("method-not-allowed", {
					status: 405,
					headers: { Allow: "GET, PATCH" },
				}),
			),
		)
		.exhaustive();
}
