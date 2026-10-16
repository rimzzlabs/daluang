import { afterEach, vi } from "vitest";

// The tests run in Node.js. A test file that renders a component sets jsdom in its first
// line, and only such a file has a document. The other files skip this setup.
if (typeof document !== "undefined") {
	const { cleanup } = await import("@testing-library/react");

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
}
