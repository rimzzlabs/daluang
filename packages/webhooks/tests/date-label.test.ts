import { describe, expect, it } from "vitest";
import { timeLabel } from "../src/date-label";

describe("timeLabel", () => {
	it("gives the day and the time in English", () => {
		expect(timeLabel("2026-10-17T12:00:00.000Z")).toMatch(
			/^Oct 1[67], 2026, \d{1,2}:\d{2}\s[AP]M$/,
		);
	});
});
