import { describe, expect, it } from "vitest";
import { authEnvSchema } from "../src/env";

const db = { prepare: () => null, batch: () => null, exec: () => null };

const valid = {
	DB: db,
	BETTER_AUTH_SECRET: "a".repeat(32),
	BETTER_AUTH_URL: "http://localhost:4321",
	GITHUB_CLIENT_ID: "id",
	GITHUB_CLIENT_SECRET: "secret",
	ALLOWED_GITHUB_USERS: "rimzzlabs",
};

describe("authEnvSchema", () => {
	it("accepts each variable and the D1 binding", () => {
		expect(authEnvSchema.safeParse(valid).success).toBe(true);
	});

	it("makes a missing allow list empty", () => {
		const { ALLOWED_GITHUB_USERS: _list, ...rest } = valid;
		expect(authEnvSchema.parse(rest).ALLOWED_GITHUB_USERS).toBe("");
	});

	it("refuses a short secret, with the name of the variable", () => {
		const result = authEnvSchema.safeParse({
			...valid,
			BETTER_AUTH_SECRET: "short",
		});
		expect(result.error?.issues[0]?.message).toContain("BETTER_AUTH_SECRET");
	});

	it("refuses a binding that is not D1", () => {
		const result = authEnvSchema.safeParse({ ...valid, DB: "not a database" });
		expect(result.error?.issues[0]?.message).toContain("D1 binding DB");
	});
});
