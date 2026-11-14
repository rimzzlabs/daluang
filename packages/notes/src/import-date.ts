import { O, S } from "@mobily/ts-belt";
import { z } from "zod";

const datetimeSchema = z.iso.datetime({ offset: true });
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
/** Month first. The month and the day have one or two digits, and the year has four. */
const US_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

/** The ISO time of a calendar date at midnight UTC, or `None` for a day that does not exist. */
function midnight(parts: {
	year: number;
	month: number;
	day: number;
}): O.Option<string> {
	const { year, month, day } = parts;
	const date = new Date(Date.UTC(year, month - 1, day));
	const real =
		date.getUTCFullYear() === year &&
		date.getUTCMonth() === month - 1 &&
		date.getUTCDate() === day;
	return real ? O.Some(date.toISOString()) : O.None;
}

function dateFromString(text: string): O.Option<string> {
	const iso = ISO_DATE.exec(text);
	const us = US_DATE.exec(text);
	if (iso)
		return midnight({
			year: Number(iso[1]),
			month: Number(iso[2]),
			day: Number(iso[3]),
		});
	if (us)
		return midnight({
			year: Number(us[3]),
			month: Number(us[1]),
			day: Number(us[2]),
		});
	if (!datetimeSchema.safeParse(text).success) return O.None;
	return dateFromDate(new Date(text));
}

function dateFromDate(date: Date): O.Option<string> {
	return Number.isNaN(date.getTime()) ? O.None : O.Some(date.toISOString());
}

/**
 * The UTC ISO time of a date of a frontmatter, or `None`. It reads `YYYY-MM-DD`, an ISO
 * date-time (with `Z` or an offset), `MM/DD/YYYY` (month first), and a `Date` object. A
 * date with no time is midnight UTC. A day that does not exist gives `None`.
 */
export function importDate(value: unknown): O.Option<string> {
	if (value instanceof Date) return dateFromDate(value);
	if (typeof value !== "string") return O.None;
	return dateFromString(S.trim(value));
}
