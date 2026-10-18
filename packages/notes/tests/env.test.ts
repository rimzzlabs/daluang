import { describe, expect, it } from "vitest";
import { notesEnvSchema } from "../src/env";
import { createFakeD1 } from "./fake-d1";

describe("notesEnvSchema", () => {
	it("accepts a D1 binding and refuses a missing one", () => {
		const { db } = createFakeD1();
		expect(notesEnvSchema.parse({ DB: db }).DB).toBe(db);
		expect(notesEnvSchema.safeParse({}).success).toBe(false);
	});
});
