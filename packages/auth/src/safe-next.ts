import { O, pipe, R, S } from "@mobily/ts-belt";

// Any origin works here. The check resolves a value against it, and a value that leaves
// this origin can leave the app.
const CHECK_ORIGIN = "https://daluang.invalid";

/**
 * Returns a path in this app for a `next` value, or `/`. A value that can leave the app
 * (`//host`, `/\host`, `https://host`, `javascript:`) becomes `/`. Use it before each
 * redirect to a `next` value.
 *
 * The check parses the value as a browser does. A browser removes a tab or a newline from
 * a URL, so `/<tab>/host` opens `host`. It also resolves dot segments, so `/.//host`
 * becomes the path `//host`. The result is the parsed path, which a browser reads the same.
 */
export function safeNext(value: string | null | undefined): string {
	if (value === null || value === undefined) return "/";
	if (!S.startsWith(value, "/")) return "/";
	return pipe(
		R.fromExecution(() => new URL(value, CHECK_ORIGIN)),
		R.toOption,
		O.filter((url) => url.origin === CHECK_ORIGIN),
		O.map((url) => `${url.pathname}${url.search}${url.hash}`),
		O.filter((path) => !S.startsWith(path, "//") && !S.startsWith(path, "/\\")),
		O.getWithDefault("/"),
	);
}
