import { describe, expect, it } from "vitest";
import { settingsEnvSchema } from "../src/env";
import { createFakeD1 } from "./fake-d1";

describe("settingsEnvSchema", () => {
	it("accepts a D1 binding", () => {
		const { db } = createFakeD1();
		expect(settingsEnvSchema.parse({ DB: db }).DB).toBe(db);
	});

	it.each([
		["no binding", {}],
		["a binding that is not an object", { DB: "daluang" }],
		["an object with no D1 methods", { DB: { prepare: () => null } }],
	])("refuses %s, with the name of the binding", (_name, env) => {
		const result = settingsEnvSchema.safeParse(env);
		expect(result.error?.issues[0]?.message).toBe(
			"The D1 binding DB is missing. Check wrangler.jsonc.",
		);
	});
});
