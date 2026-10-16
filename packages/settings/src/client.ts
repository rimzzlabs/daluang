import { R } from "@mobily/ts-belt";
import { match, P } from "ts-pattern";
import { z } from "zod";
import {
	SETTINGS_API_PATH,
	type SettingsPatch,
	type StoredSettings,
	storedSettingsSchema,
} from "./settings";

const savedSchema = z.object({ settings: storedSettingsSchema });

/** Why a save failed. The UI shows one message for each code. */
export type SaveSettingsError = "invalid" | "signed-out" | "offline" | "server";

export const SAVE_ERROR_MESSAGES: Record<SaveSettingsError, string> = {
	invalid: "Daluang refused a value. Check each field, then try again.",
	"signed-out": "Your session ended. Sign in again, then try again.",
	offline:
		"Daluang could not reach the server. Check your connection, then try again.",
	server: "The server could not save the settings. Try again.",
};

function statusError(status: number): SaveSettingsError {
	return match(status)
		.with(401, () => "signed-out" as const)
		.with(P.union(400, 413, 415, 422), () => "invalid" as const)
		.otherwise(() => "server" as const);
}

async function readSaved(
	response: Response,
): Promise<R.Result<StoredSettings, SaveSettingsError>> {
	if (!response.ok) return R.Error(statusError(response.status));
	const body = await R.fromPromise<unknown>(response.json());
	if (R.isError(body)) return R.Error("server");
	const parsed = savedSchema.safeParse(R.getExn(body));
	return parsed.success ? R.Ok(parsed.data.settings) : R.Error("server");
}

/** Saves one setting or more. On success, it gives the stored settings. */
export async function saveSettings(
	patch: SettingsPatch,
): Promise<R.Result<StoredSettings, SaveSettingsError>> {
	const response = await R.fromPromise(
		fetch(SETTINGS_API_PATH, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(patch),
		}),
	);
	if (R.isError(response)) return R.Error("offline");
	return readSaved(R.getExn(response));
}

/** Opens a page of the CMS with a full page load, so the server reads the new settings. */
export function openPage(path: string) {
	location.assign(path);
}
