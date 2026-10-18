import { useSyncExternalStore } from "react";
import type { ChangesStore } from "@/lib/notes/changes-store";

/** The number of changes of a store. The component renders again after each write. */
export function useChangeCount(store: ChangesStore): number {
	return useSyncExternalStore(store.subscribe, store.read, store.read);
}
