import { fieldDefinitionsSchema } from "@daluang/notes/field-definitions";
import { describe, expect, it } from "vitest";
import { FIELD_SUGGESTIONS } from "../src/field-suggestions";

describe("FIELD_SUGGESTIONS", () => {
	it("is a valid list of fields", () => {
		expect(fieldDefinitionsSchema.safeParse(FIELD_SUGGESTIONS).success).toBe(
			true,
		);
	});
});
