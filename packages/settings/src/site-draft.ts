import { A, O, pipe, R } from "@mobily/ts-belt";
import { type SiteSetting, siteSettingSchema } from "./site";

/** The site as a writer types it in a form: two texts. */
export interface SiteDraft {
	name: string;
	url: string;
}

/** The message of each field that is not valid. */
export interface SiteErrors {
	name?: string;
	url?: string;
}

/** The draft of a stored site, or of no site. */
export function siteDraft(site: SiteSetting | null): SiteDraft {
	if (site === null) return { name: "", url: "" };
	return { name: site.name, url: site.url ?? "" };
}

interface MessageQuery {
	issues: readonly { path: readonly PropertyKey[]; message: string }[];
	field: keyof SiteErrors;
}

function firstMessage(query: MessageQuery): string | undefined {
	return pipe(
		query.issues,
		A.find((issue) => issue.path[0] === query.field),
		O.map((issue) => issue.message),
		O.toUndefined,
	);
}

/** The site of a draft, or the message of each field that is not valid. */
export function parseSiteDraft(
	draft: SiteDraft,
): R.Result<SiteSetting, SiteErrors> {
	const result = siteSettingSchema.safeParse(draft);
	if (result.success) return R.Ok(result.data);
	const issues = result.error.issues;
	return R.Error({
		name: firstMessage({ issues, field: "name" }),
		url: firstMessage({ issues, field: "url" }),
	});
}
