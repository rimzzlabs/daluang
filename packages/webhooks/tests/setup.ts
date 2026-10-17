import { afterEach, vi } from "vitest";

// The tests run in Node.js. A test file that renders a component sets jsdom in its first
// line, and only such a file has a document. The other files skip this setup.
if (typeof document !== "undefined") {
	const { cleanup } = await import("@testing-library/react");

	// jsdom has no matchMedia. A dialog asks for the width of a desktop: a `min-width`
	// query matches, so a dialog opens as a dialog. A test of the drawer stubs it again.
	vi.stubGlobal("matchMedia", (query: string) => ({
		matches: query.includes("min-width"),
		media: query,
		addEventListener: () => {},
		removeEventListener: () => {},
	}));

	// Each test starts with an empty document.
	afterEach(cleanup);
}
