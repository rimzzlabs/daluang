import { SIGN_IN_PATH } from "@daluang/auth/paths";
import { createAuthClient } from "better-auth/react";

// The browser client of Better Auth. The CMS serves `/api/auth` on its own origin.
const authClient = createAuthClient();

/** Starts the sign-in with GitHub. On success, the browser leaves for GitHub. */
export function startGitHubSignIn(next: string) {
	return authClient.signIn.social({
		provider: "github",
		callbackURL: next,
		errorCallbackURL: SIGN_IN_PATH,
	});
}

/** Ends the session, then opens the sign-in page. */
export function signOut() {
	return authClient.signOut({
		fetchOptions: { onSuccess: () => window.location.assign(SIGN_IN_PATH) },
	});
}
