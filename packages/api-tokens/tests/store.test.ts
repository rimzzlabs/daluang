import { describe, expect, it } from "vitest";
import {
	createToken,
	deleteToken,
	findTokenByHash,
	listTokens,
	markTokenUsed,
} from "../src/store";
import { hashTokenSecret } from "../src/token";
import { createFakeD1 } from "./fake-d1";

const NOW = new Date("2026-10-17T00:00:00.000Z");

describe("createToken", () => {
	it("keeps the hash and the start of the token, not the token", async () => {
		const { db, database } = createFakeD1();
		const created = await createToken({ db, name: "Build", now: NOW });
		expect(created.token).toEqual({
			id: expect.any(String),
			name: "Build",
			start: created.secret.slice(0, 8),
			createdAt: NOW.toISOString(),
			lastUsedAt: null,
		});
		const row = database.prepare('select * from "api_token"').get();
		expect(row?.hash).toBe(await hashTokenSecret(created.secret));
		expect(JSON.stringify(row)).not.toContain(created.secret);
	});
});

describe("listTokens", () => {
	it("gives each token, the newest first, with no hash", async () => {
		const { db } = createFakeD1();
		await createToken({ db, name: "Old", now: NOW });
		await createToken({
			db,
			name: "New",
			now: new Date("2026-10-18T00:00:00.000Z"),
		});
		const tokens = await listTokens(db);
		expect(tokens.map((token) => token.name)).toEqual(["New", "Old"]);
		expect(tokens[0]).not.toHaveProperty("hash");
	});
});

describe("deleteToken", () => {
	it("deletes a token, and is false for an ID with no token", async () => {
		const { db } = createFakeD1();
		const { token } = await createToken({ db, name: "Build", now: NOW });
		await expect(deleteToken({ db, id: token.id })).resolves.toBe(true);
		await expect(listTokens(db)).resolves.toEqual([]);
		await expect(deleteToken({ db, id: token.id })).resolves.toBe(false);
	});
});

describe("findTokenByHash and markTokenUsed", () => {
	it("finds a token by its hash, and records a use once in each interval", async () => {
		const { db } = createFakeD1();
		const { token, secret } = await createToken({
			db,
			name: "Build",
			now: NOW,
		});
		const hash = await hashTokenSecret(secret);
		const used = new Date("2026-10-17T01:00:00.000Z");
		await markTokenUsed({ db, id: token.id, now: used, before: used });
		const soon = new Date("2026-10-17T01:00:30.000Z");
		await markTokenUsed({
			db,
			id: token.id,
			now: soon,
			before: new Date("2026-10-17T00:59:30.000Z"),
		});
		await expect(findTokenByHash({ db, hash })).resolves.toEqual({
			...token,
			lastUsedAt: used.toISOString(),
		});
		await expect(
			findTokenByHash({ db, hash: "nope" }),
		).resolves.toBeUndefined();
	});
});
