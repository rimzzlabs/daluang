import { A, pipe, S } from "@mobily/ts-belt";

/**
 * Reads `ALLOWED_GITHUB_USERS`: GitHub usernames, separated by commas. The names are
 * compared in lower case, because GitHub usernames are not case-sensitive.
 */
export function parseAllowList(value: string): readonly string[] {
	return pipe(
		value,
		S.split(","),
		A.map(S.trim),
		A.map(S.toLowerCase),
		A.reject(S.isEmpty),
	);
}

export interface AllowListCheck {
	login: string;
	allowList: readonly string[];
}

/**
 * True when the GitHub username is on the allow list. An empty list allows nobody: the
 * CMS publishes to a public site, so a missing value must not open it to each GitHub user.
 */
export function isAllowedGitHubUser(check: AllowListCheck): boolean {
	const login = pipe(check.login, S.trim, S.toLowerCase);
	return A.includes(check.allowList, login);
}
