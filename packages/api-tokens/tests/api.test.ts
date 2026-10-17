import { describe, expect, it } from "vitest";
import { handleTokensRequest } from "../src/api";
import { TOKENS_API_PATH, TOKENS_MAX } from "../src/api-token";
import { createToken } from "../src/store";
import { createFakeD1 } from "./fake-d1";

const URL_OF_API = `http://localhost:4321${TOKENS_API_PATH}`;
const NOW = new Date("2026-10-17T00:00:00.000Z");

function post(body: string, contentType = "application/json") {
	return new Request(URL_OF_API, {
		method: "POST",
		headers: { "Content-Type": contentType },
		body,
	});
}

describe("handleTokensRequest", () => {
	it("lists the tokens", async () => {
		const { db } = createFakeD1();
		const { token } = await createToken({ db, name: "Build", now: NOW });
		const response = await handleTokensRequest({
			request: new Request(URL_OF_API),
			db,
			id: undefined,
			now: () => NOW,
		});
		await expect(response.json()).resolves.toEqual({ tokens: [token] });
	});

	it("makes a token and gives the token one time", async () => {
		const { db } = createFakeD1();
		const response = await handleTokensRequest({
			request: post(JSON.stringify({ name: " Build " })),
			db,
			id: undefined,
			now: () => NOW,
		});
		expect(response.status).toBe(201);
		await expect(response.json()).resolves.toEqual({
			token: expect.objectContaining({ name: "Build" }),
			secret: expect.stringMatching(/^dlg_/),
		});
	});

	it("makes a token at the time of the request when no clock is given", async () => {
		const { db } = createFakeD1();
		const response = await handleTokensRequest({
			request: post(JSON.stringify({ name: "Build" })),
			db,
			id: undefined,
			now: () => NOW,
		});
		expect(response.status).toBe(201);
	});

	it("refuses an empty name with its message", async () => {
		const { db } = createFakeD1();
		const response = await handleTokensRequest({
			request: post(JSON.stringify({ name: "" })),
			db,
			id: undefined,
			now: () => NOW,
		});
		expect(response.status).toBe(422);
		await expect(response.json()).resolves.toEqual({
			error: "invalid-name",
			message: "Give the token a name, for example the name of your site.",
		});
	});

	it.each([
		["a body that is not JSON", post("{"), 400],
		["another content type", post("name=x", "text/plain"), 415],
		[
			"a body of more than 2 KB",
			post(JSON.stringify({ name: "a".repeat(3000) })),
			413,
		],
	])("refuses %s", async (_name, request, status) => {
		const { db } = createFakeD1();
		const response = await handleTokensRequest({
			request,
			db,
			id: undefined,
			now: () => NOW,
		});
		expect(response.status).toBe(status);
	});

	it("refuses a token after the most tokens", async () => {
		const { db } = createFakeD1();
		for (const index of Array.from({ length: TOKENS_MAX }, (_, i) => i))
			await createToken({ db, name: `Build ${index}`, now: NOW });
		const response = await handleTokensRequest({
			request: post(JSON.stringify({ name: "One more" })),
			db,
			id: undefined,
			now: () => NOW,
		});
		expect(response.status).toBe(409);
		await expect(response.json()).resolves.toEqual({ error: "too-many" });
	});

	it("revokes a token, and answers 404 for a token that does not exist", async () => {
		const { db } = createFakeD1();
		const { token } = await createToken({ db, name: "Build", now: NOW });
		const revoke = () =>
			handleTokensRequest({
				request: new Request(`${URL_OF_API}/${token.id}`, { method: "DELETE" }),
				db,
				id: token.id,
				now: () => NOW,
			});
		expect((await revoke()).status).toBe(204);
		expect((await revoke()).status).toBe(404);
	});

	it.each([
		["PUT on the list", "PUT", undefined, "GET, POST"],
		["GET on a token", "GET", "abc", "DELETE"],
	])("refuses %s", async (_name, method, id, allow) => {
		const { db } = createFakeD1();
		const response = await handleTokensRequest({
			request: new Request(URL_OF_API, { method }),
			db,
			id,
			now: () => NOW,
		});
		expect(response.status).toBe(405);
		expect(response.headers.get("Allow")).toBe(allow);
	});
});
