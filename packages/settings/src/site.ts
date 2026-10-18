import { O, pipe, R, S } from "@mobily/ts-belt";
import { z } from "zod";

export const SITE_NAME_MAX_LENGTH = 80;

/**
 * The address of a site in its canonical form, or `None` for a value that is not an `http`
 * or `https` address. A value with no scheme gets `https://`: `example.com` becomes
 * `https://example.com`. The canonical form has no slash at the end.
 */
export function canonicalSiteUrl(value: string): O.Option<string> {
	const withScheme = S.includes(value, "://") ? value : `https://${value}`;
	return pipe(
		R.fromExecution(() => new URL(withScheme)),
		R.toOption,
		O.filter((url) => url.protocol === "https:" || url.protocol === "http:"),
		// `mailto:me@example.com` with `https://` has the user name `mailto`. A site has none.
		O.filter((url) => url.username === "" && url.password === ""),
		O.filter(
			(url) => S.includes(url.hostname, ".") || url.hostname === "localhost",
		),
		O.map((url) => S.replaceByRe(url.href, /\/$/, "")),
	);
}

/** The address of a site as a reader types it, with no scheme: `rimzzlabs.com`. */
export function siteHost(url: string): string {
	return pipe(url, S.replaceByRe(/^https?:\/\//, ""), S.replaceByRe(/\/$/, ""));
}

const siteUrlSchema = z
	.string()
	.trim()
	.max(2000)
	.transform((value, context) => {
		if (S.isEmpty(value)) return null;
		const url = canonicalSiteUrl(value);
		if (O.isSome(url)) return url;
		context.addIssue({
			code: "custom",
			message: "Use an address such as https://example.com.",
		});
		return z.NEVER;
	});

/** The site that shows the notes: its name, and its address when the writer gives one. */
export const siteSettingSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Give your site a name.")
		.max(
			SITE_NAME_MAX_LENGTH,
			`Keep the name at ${SITE_NAME_MAX_LENGTH} characters or fewer.`,
		),
	/** `null` when the writer gives no address. An empty text is no address also. */
	url: siteUrlSchema.nullable(),
});

export type SiteSetting = z.infer<typeof siteSettingSchema>;
