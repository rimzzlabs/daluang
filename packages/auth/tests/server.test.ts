import { APIError } from "better-auth/api";
import { describe, expect, it, vi } from "vitest";
import { authEnvSchema } from "../src/env";
import { assertAllowedUser, createAuth } from "../src/server";
import { NOT_ALLOWED_ERROR_CODE } from "../src/sign-in-error";
import { authMigration, createFakeD1 } from "./fake-d1";

function makeAuth(migration = authMigration()) {
	const env = authEnvSchema.parse({
		DB: createFakeD1(migration),
		BETTER_AUTH_SECRET: "a".repeat(32),
		BETTER_AUTH_URL: "http://localhost:4321",
		GITHUB_CLIENT_ID: "id",
		GITHUB_CLIENT_SECRET: "secret",
		ALLOWED_GITHUB_USERS: "rimzzlabs",
	});
	return createAuth(env);
}

function catchError(run: () => unknown): unknown {
	try {
		run();
	} catch (error) {
		return error;
	}
	return null;
}

describe("assertAllowedUser", () => {
	it("accepts a user whose GitHub username is on the list", () => {
		expect(() =>
			assertAllowedUser({ githubLogin: "RimzzLabs" }, ["rimzzlabs"]),
		).not.toThrow();
	});

	it("refuses a user that is not on the list, with the code of the sign-in page", () => {
		const error = catchError(() =>
			assertAllowedUser({ githubLogin: "someone" }, ["rimzzlabs"]),
		);
		expect(error).toBeInstanceOf(APIError);
		expect(error instanceof APIError ? error.body?.code : null).toBe(
			NOT_ALLOWED_ERROR_CODE,
		);
	});

	it.each([
		["no user", undefined],
		["a user with no GitHub username", { name: "Someone" }],
		["a username that is not text", { githubLogin: 42 }],
	])("refuses %s", (_name, user) => {
		expect(() => assertAllowedUser(user, ["rimzzlabs"])).toThrow(APIError);
	});
});

describe("createAuth", () => {
	it("finds each table and column that it needs in the D1 migration", async () => {
		const context = await makeAuth().$context;
		await expect(context.checkSchema?.()).resolves.not.toThrow();
	});

	it("finds a migration that lacks a column it needs", async () => {
		// Better Auth also logs the mismatch at its start. The log is part of the result.
		const log = vi.spyOn(console, "error").mockImplementation(() => {});
		const migration = authMigration().replace(
			', "githubLogin" text not null',
			"",
		);
		const context = await makeAuth(migration).$context;
		await expect(context.checkSchema?.()).rejects.toThrow(/githubLogin/);
		await vi.waitFor(() =>
			expect(String(log.mock.calls[0])).toContain("user.githubLogin"),
		);
		log.mockRestore();
	});

	it.each([
		"/api/auth/update-user",
		"/api/auth/change-email",
		"/api/auth/get-access-token",
		"/api/auth/refresh-token",
		"/api/auth/link-social",
		"/api/auth/sign-up/email",
	])("answers 404 to %s", async (path) => {
		const response = await makeAuth().handler(
			new Request(`http://localhost:4321${path}`, {
				method: "POST",
				headers: {
					"content-type": "application/json",
					origin: "http://localhost:4321",
				},
				body: "{}",
			}),
		);
		expect(response.status).toBe(404);
	});

	it("answers an open endpoint", async () => {
		const response = await makeAuth().handler(
			new Request("http://localhost:4321/api/auth/get-session"),
		);
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toBeNull();
	});

	it("sends an error of Better Auth to the sign-in page", async () => {
		const response = await makeAuth().handler(
			new Request("http://localhost:4321/api/auth/error?error=state_mismatch"),
		);
		expect(response.status).toBe(302);
		expect(response.headers.get("Location")).toBe(
			"/sign-in?error=state_mismatch",
		);
	});

	it("limits the sign-in to 3 requests in 10 seconds from one address", async () => {
		const auth = makeAuth();
		function signIn(ip: string) {
			return auth.handler(
				new Request("http://localhost:4321/api/auth/sign-in/social", {
					method: "POST",
					headers: {
						"content-type": "application/json",
						origin: "http://localhost:4321",
						"cf-connecting-ip": ip,
					},
					body: JSON.stringify({ provider: "github" }),
				}),
			);
		}
		const statuses: number[] = [];
		for (const _ of [1, 2, 3, 4])
			statuses.push((await signIn("203.0.113.7")).status);
		expect(statuses.slice(0, 3)).not.toContain(429);
		expect(statuses[3]).toBe(429);
		expect((await signIn("203.0.113.8")).status).not.toBe(429);
	});

	it("reads the address of the client from CF-Connecting-IP only", () => {
		expect(makeAuth().options.advanced?.ipAddress?.ipAddressHeaders).toEqual([
			"cf-connecting-ip",
		]);
	});

	it("encrypts the GitHub tokens in D1", () => {
		expect(makeAuth().options.account?.encryptOAuthTokens).toBe(true);
	});

	it("checks the allow list before it makes a user", async () => {
		const before = makeAuth().options.databaseHooks?.user?.create?.before;
		const user = {
			id: "u1",
			name: "Someone",
			email: "someone@example.invalid",
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		await expect(before?.({ ...user, githubLogin: "someone" })).rejects.toThrow(
			APIError,
		);
		await expect(
			before?.({ ...user, githubLogin: "rimzzlabs" }),
		).resolves.toEqual({
			data: { ...user, githubLogin: "rimzzlabs" },
		});
	});

	it("refuses a session when it cannot find the user of the session", async () => {
		const before = makeAuth().options.databaseHooks?.session?.create?.before;
		const session = {
			id: "s1",
			userId: "u1",
			token: "token",
			expiresAt: new Date(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		await expect(before?.(session, null)).rejects.toThrow(APIError);
	});
});
