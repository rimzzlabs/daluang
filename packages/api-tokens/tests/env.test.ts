import { describe, expect, it } from "vitest";
import { apiTokensEnvSchema } from "../src/env";
import { createFakeD1 } from "./fake-d1";

describe("apiTokensEnvSchema", () => {
	it("accepts a D1 binding and refuses a missing one", () => {
		const { db } = createFakeD1();
		expect(apiTokensEnvSchema.parse({ DB: db }).DB).toBe(db);
		expect(apiTokensEnvSchema.safeParse({}).success).toBe(false);
	});
});
