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

/** The message for an `?error=` code of the sign-in page, or `null` when there is no code. */
export function signInErrorMessage(code: string | null): string | null {
	if (code === null || code === "") return null;
	return MESSAGES[code] ?? FALLBACK_MESSAGE;
}
