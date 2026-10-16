import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// jsdom has no matchMedia. The sidebar asks for the width of a phone.
vi.stubGlobal("matchMedia", (query: string) => ({
	matches: false,
	media: query,
	addEventListener: () => {},
	removeEventListener: () => {},
}));

// jsdom has no scrolling. The router scrolls to the top after each navigation.
vi.stubGlobal("scrollTo", () => {});

// Each test starts with an empty document.
afterEach(cleanup);
