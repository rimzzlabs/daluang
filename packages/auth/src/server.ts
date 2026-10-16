import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { isAllowedGitHubUser, parseAllowList } from "./allow-list";
import type { AuthEnv } from "./env";
import { NOT_ALLOWED_ERROR_CODE } from "./sign-in-error";

/** The GitHub username of a user row. `findUserById` types the row without `githubLogin`. */
function readGitHubLogin(user: unknown): string {
	if (typeof user !== "object" || user === null || !("githubLogin" in user))
		return "";
	return typeof user.githubLogin === "string" ? user.githubLogin : "";
}

function refuse(login: string): APIError {
	return new APIError("FORBIDDEN", {
		code: NOT_ALLOWED_ERROR_CODE,
		message: `The GitHub user ${login} has no access to this CMS.`,
	});
}

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
				// field takes input. `disabledPaths` below closes each endpoint that writes a
				// user, so only the GitHub profile sets `githubLogin`.
				githubLogin: { type: "string", required: true },
			},
		},
		// The allow list trusts `githubLogin`. A signed-in user must not change it.
		disabledPaths: ["/update-user", "/change-email"],
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
						const login = readGitHubLogin(user);
						if (!isAllowedGitHubUser({ login, allowList })) throw refuse(login);
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
						const login = readGitHubLogin(found);
						if (!isAllowedGitHubUser({ login, allowList })) throw refuse(login);
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
