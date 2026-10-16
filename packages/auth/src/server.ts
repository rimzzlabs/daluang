import { type BetterAuthPlugin, betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { isAllowedGitHubUser, parseAllowList } from "./allow-list";
import type { AuthEnv } from "./env";
import { isOpenAuthPath, SIGN_IN_PATH } from "./paths";
import { NOT_ALLOWED_ERROR_CODE } from "./sign-in-error";

/** The GitHub username of a user row. `findUserById` types the row without `githubLogin`. */
function readGitHubLogin(user: unknown): string {
	if (typeof user !== "object" || user === null || !("githubLogin" in user))
		return "";
	return typeof user.githubLogin === "string" ? user.githubLogin : "";
}

/**
 * Throws when the GitHub username of a user row is not on the allow list. The OAuth callback
 * turns the error into `/sign-in?error=github_user_not_allowed`.
 */
export function assertAllowedUser(
	user: unknown,
	allowList: readonly string[],
): void {
	const login = readGitHubLogin(user);
	if (isAllowedGitHubUser({ login, allowList })) return;
	throw new APIError("FORBIDDEN", {
		code: NOT_ALLOWED_ERROR_CODE,
		message: `The GitHub user ${login} has no access to this CMS.`,
	});
}

/**
 * Answers 404 to each request for an endpoint that is not in `OPEN_AUTH_PATHS`. It is an
 * allow list, so an endpoint that a new version of Better Auth adds stays closed.
 */
export const openPathsOnly: BetterAuthPlugin = {
	id: "daluang-open-paths",
	onRequest: (request) => {
		if (isOpenAuthPath(new URL(request.url).pathname)) return Promise.resolve();
		return Promise.resolve({
			response: new Response("Not Found", { status: 404 }),
		});
	},
};

/**
 * The Better Auth instance of the CMS: sign-in with GitHub, sessions in D1. Only the GitHub
 * users of `ALLOWED_GITHUB_USERS` can sign in. The list is checked when the user row is
 * made and at each new session, so a name that leaves the list cannot sign in again.
 */
export function createAuth(env: AuthEnv) {
	const allowList = parseAllowList(env.ALLOWED_GITHUB_USERS);

	return betterAuth({
		database: env.DB,
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		user: {
			additionalFields: {
				// Better Auth drops a field with `input: false` from the GitHub profile, so the
				// field takes input. `openPathsOnly` below closes each endpoint that writes a
				// user, so only the GitHub profile sets `githubLogin`.
				githubLogin: { type: "string", required: true },
			},
		},
		// The allow list trusts `githubLogin`, and a signed-in user must not change it. The
		// plugin also closes the endpoints that give the GitHub access token.
		plugins: [openPathsOnly],
		account: {
			// D1 keeps the GitHub tokens of each account. The secret encrypts them.
			encryptOAuthTokens: true,
		},
		// A failed sign-in opens the sign-in page with `?error=<code>`, and the page shows the
		// message of the code. Better Auth then shows no error page of its own.
		onAPIError: { errorURL: SIGN_IN_PATH },
		// Better Auth turns the limit on only when `NODE_ENV` is `production`, and a Worker
		// has no `NODE_ENV`. The sign-in allows 3 requests in 10 seconds from one address.
		rateLimit: { enabled: true },
		advanced: {
			ipAddress: {
				// Cloudflare sets `CF-Connecting-IP` to the address of the client. A client can
				// set `X-Forwarded-For`, the default header of Better Auth.
				ipAddressHeaders: ["cf-connecting-ip"],
			},
		},
		socialProviders: {
			github: {
				clientId: env.GITHUB_CLIENT_ID,
				clientSecret: env.GITHUB_CLIENT_SECRET,
				// A GitHub user can change the username. Each sign-in writes the current one.
				overrideUserInfoOnSignIn: true,
				mapProfileToUser: (profile) => ({ githubLogin: profile.login }),
			},
		},
		session: {
			// The middleware reads the session on each request. The signed cookie saves a D1
			// query for 5 minutes.
			cookieCache: { enabled: true, maxAge: 5 * 60 },
		},
		databaseHooks: {
			user: {
				create: {
					before: async (user) => {
						assertAllowedUser(user, allowList);
						return { data: user };
					},
				},
			},
			session: {
				create: {
					before: async (session, context) => {
						const found = await context?.context.internalAdapter.findUserById(
							session.userId,
						);
						assertAllowedUser(found, allowList);
						return { data: session };
					},
				},
			},
		},
	});
}

export type Auth = ReturnType<typeof createAuth>;

/** The user and the session that the middleware puts in `Astro.locals`. */
export type AuthSession = NonNullable<
	Awaited<ReturnType<Auth["api"]["getSession"]>>
>;

export interface AuthLocals {
	user: AuthSession["user"] | null;
	session: AuthSession["session"] | null;
}
