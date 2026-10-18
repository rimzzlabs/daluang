import { NOTE_CHANGES } from "@daluang/notes/change";
import { NOTE_STATUSES } from "@daluang/notes/metadata";
import { D } from "@mobily/ts-belt";
import { describe, expect, it } from "vitest";
import { CHANGE_LABELS, STATUS_LABELS } from "@/lib/notes/change-labels";

describe("the labels of the posts", () => {
	it("names each change and each status", () => {
		expect(D.keys(CHANGE_LABELS)).toEqual([...NOTE_CHANGES]);
		expect(D.keys(STATUS_LABELS)).toEqual([...NOTE_STATUSES]);
	});
});
