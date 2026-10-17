import { vi } from "vitest";

export const TOKEN = {
	id: "t1",
	name: "Build",
	start: "dlg_AbCd",
	createdAt: "2026-10-17T12:00:00.000Z",
	lastUsedAt: null,
};

/** The messages of the fake of `src/client.ts`. */
export const MESSAGES = {
	invalid: "Invalid.",
	"too-many": "Too many.",
	"signed-out": "Signed out.",
	offline: "Offline.",
	server: "Server.",
};

/** A stub of matchMedia: a phone matches no `min-width` query, and a desktop each one. */
export function stubScreen(screen: "phone" | "desktop") {
	vi.stubGlobal("matchMedia", (query: string) => ({
		matches: screen === "desktop" && query.includes("min-width"),
		media: query,
		addEventListener: () => {},
		removeEventListener: () => {},
	}));
}
