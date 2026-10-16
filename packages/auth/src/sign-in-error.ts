import { S } from "@mobily/ts-belt";

/** The error code that the allow list gives. The OAuth callback puts it in `?error=`. */
export const NOT_ALLOWED_ERROR_CODE = "github_user_not_allowed";

const MESSAGES: Record<string, string> = {
	[NOT_ALLOWED_ERROR_CODE]:
		"This GitHub account has no access to this CMS. Ask the owner to add your username to ALLOWED_GITHUB_USERS.",
	access_denied:
		"You cancelled the sign-in on GitHub. Try again when you are ready.",
	invalid_code: "The sign-in expired. Try again.",
	state_mismatch: "The sign-in expired. Try again.",
};

const FALLBACK_MESSAGE = "The sign-in with GitHub failed. Try again.";

// A code from Better Auth, for example `MISSING_FIELD`. The page shows a code of this form
// only, because the value comes from the URL.
const CODE_PATTERN = /^[A-Za-z0-9_]{1,64}$/;

export interface SignInError {
	message: string;
	/** The code to show for a failure that has no message of its own, or `null`. */
	code: string | null;
}

/** The error of an `?error=` value of the sign-in page, or `null` when there is no value. */
export function signInError(code: string | null): SignInError | null {
	if (code === null || S.isEmpty(code)) return null;
	const message = MESSAGES[code];
	if (message !== undefined) return { message, code: null };
	return {
		message: FALLBACK_MESSAGE,
		code: CODE_PATTERN.test(code) ? code : null,
	};
}
