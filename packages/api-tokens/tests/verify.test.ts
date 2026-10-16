import { R } from "@mobily/ts-belt";
import { describe, expect, it } from "vitest";
import { createToken, deleteToken, listTokens } from "../src/store";
import { verifyApiToken } from "../src/verify";
import { createFakeD1 } from "./fake-d1";

const NOW = new Date("2026-10-17T00:00:00.000Z");

describe("verifyApiToken", () => {
	it("gives the token of a valid Bearer header, and records the use", async () => {
		const { db } = createFakeD1();
		const { token, secret } = await createToken({
			db,
			name: "Build",
			now: NOW,
		});
		const result = await verifyApiToken({
			db,
			authorization: `Bearer ${secret}`,
			now: NOW,
		});
		expect(result).toEqual(R.Ok(token));
		const [stored] = await listTokens(db);
		expect(stored?.lastUsedAt).toBe(NOW.toISOString());
	});

	it("gives missing for a request with no token", async () => {
		const { db } = createFakeD1();
		await expect(
			verifyApiToken({ db, authorization: null, now: NOW }),
		).resolves.toEqual(R.Error("missing"));
	});

	it("gives unknown for a revoked token", async () => {
		const { db } = createFakeD1();
		const { token, secret } = await createToken({
			db,
			name: "Build",
			now: NOW,
		});
		await deleteToken({ db, id: token.id });
		await expect(
			verifyApiToken({ db, authorization: `Bearer ${secret}`, now: NOW }),
		).resolves.toEqual(R.Error("unknown"));
	});
});
