import { R } from "@mobily/ts-belt";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApiToken, listApiTokens, revokeApiToken } from "../src/client";

const TOKEN = {
	id: "t1",
	name: "Build",
	start: "dlg_AbCd",
	createdAt: "2026-10-17T00:00:00.000Z",
	lastUsedAt: null,
};

function answer(response: Response | Error) {
	const fetch = vi.fn(() =>
		response instanceof Error
			? Promise.reject(response)
			: Promise.resolve(response),
	);
	vi.stubGlobal("fetch", fetch);
	return fetch;
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("listApiTokens", () => {
	it("gives the tokens", async () => {
		answer(Response.json({ tokens: [TOKEN] }));
		await expect(listApiTokens()).resolves.toEqual(R.Ok([TOKEN]));
	});

	it("gives offline when the request fails", async () => {
		answer(new TypeError("Failed to fetch"));
		await expect(listApiTokens()).resolves.toEqual(R.Error("offline"));
	});

	it.each([
		["a body that is not JSON", new Response("<html>")],
		["a body of another shape", Response.json({ tokens: "no" })],
	])("gives server for %s", async (_name, response) => {
		answer(response);
		await expect(listApiTokens()).resolves.toEqual(R.Error("server"));
	});
});

describe("createApiToken", () => {
	it("sends the name and gives the token one time", async () => {
		const fetch = answer(
			Response.json({ token: TOKEN, secret: "dlg_x" }, { status: 201 }),
		);
		await expect(createApiToken("Build")).resolves.toEqual(
			R.Ok({ token: TOKEN, secret: "dlg_x" }),
		);
		expect(fetch).toHaveBeenCalledWith("/api/tokens", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "Build" }),
		});
	});

	it.each([
		[401, "signed-out"],
		[409, "too-many"],
		[422, "invalid"],
		[500, "server"],
	])("gives the error of the status %i", async (status, error) => {
		answer(Response.json({}, { status }));
		await expect(createApiToken("Build")).resolves.toEqual(R.Error(error));
	});
});

describe("revokeApiToken", () => {
	it("sends DELETE for the ID", async () => {
		const fetch = answer(new Response(null, { status: 204 }));
		await expect(revokeApiToken("t 1")).resolves.toEqual(R.Ok(true));
		expect(fetch).toHaveBeenCalledWith("/api/tokens/t%201", {
			method: "DELETE",
		});
	});

	it("gives the error of a failed revoke", async () => {
		answer(Response.json({}, { status: 404 }));
		await expect(revokeApiToken("t1")).resolves.toEqual(R.Error("server"));
	});
});
