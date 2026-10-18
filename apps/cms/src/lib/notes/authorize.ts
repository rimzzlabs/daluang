import { verifyApiToken } from "@daluang/api-tokens/verify";
import { R } from "@mobily/ts-belt";

/** The `authorize` of the content API: true for a valid API token of this CMS. */
export function authorizeSite(
	db: D1Database,
): (authorization: string | null) => Promise<boolean> {
	return async (authorization) =>
		R.isOk(await verifyApiToken({ db, authorization, now: new Date() }));
}
