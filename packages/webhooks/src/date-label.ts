// The times of the webhooks page, in English, in the time zone of the browser.
const TIME = new Intl.DateTimeFormat("en", {
	dateStyle: "medium",
	timeStyle: "short",
});

/** The day and the time of an ISO time: `Oct 17, 2026, 3:04 AM`. */
export function timeLabel(iso: string): string {
	return TIME.format(new Date(iso));
}
