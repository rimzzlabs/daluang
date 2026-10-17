import type { CmsSettings } from "@daluang/settings/settings";
import { useSyncExternalStore } from "react";
import type { SettingsStore } from "@/lib/settings/settings-store";

/** The settings of a store. The component renders again after each write. */
export function useSettings(store: SettingsStore): CmsSettings {
	return useSyncExternalStore(store.subscribe, store.read, store.read);
}
