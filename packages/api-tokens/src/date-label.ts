// The dates of the tokens page, in English, in the time zone of the browser.
const DAY = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

/** The day of an ISO time, for a list: `Oct 17, 2026`. */
export function dayLabel(iso: string): string {
	return DAY.format(new Date(iso));
}
