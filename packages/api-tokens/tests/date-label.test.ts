import { describe, expect, it } from "vitest";
import { dayLabel } from "../src/date-label";

describe("dayLabel", () => {
	it("gives the day of a time in English", () => {
		expect(dayLabel("2026-10-17T12:00:00.000Z")).toMatch(/^Oct 1[67], 2026$/);
	});
});
