import { describe, expect, it } from "vitest";
import { webhooksEnvSchema } from "../src/env";
import { createFakeD1 } from "./fake-d1";

describe("webhooksEnvSchema", () => {
	it("accepts a D1 binding and refuses a missing one", () => {
		const { db } = createFakeD1();
		expect(webhooksEnvSchema.parse({ DB: db }).DB).toBe(db);
		expect(webhooksEnvSchema.safeParse({}).success).toBe(false);
	});
});
