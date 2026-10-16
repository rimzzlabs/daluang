import { S } from "@mobily/ts-belt";

/**
 * Returns a path in this app for a `next` value, or `/`. A value that can leave the app
 * (`//host`, `/\host`, `https://host`, `javascript:`) becomes `/`. Use it before each
 * redirect to a `next` value.
 */
export function safeNext(value: string | null | undefined): string {
	if (value === null || value === undefined) return "/";
	if (!S.startsWith(value, "/")) return "/";
	if (S.startsWith(value, "//") || S.startsWith(value, "/\\")) return "/";
	return value;
}
