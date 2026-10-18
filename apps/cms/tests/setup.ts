import { afterEach, vi } from "vitest";

// The tests run in Node.js. A test file that renders a component sets jsdom in its first
// line, and only such a file has a document. The other files skip this setup.
if (typeof document !== "undefined") {
	const { cleanup } = await import("@testing-library/react");

	// jsdom has no matchMedia. The sidebar asks for the width of a phone, and a dialog for
	// the width of a desktop. The tests run as a desktop: a `min-width` query matches.
	vi.stubGlobal("matchMedia", (query: string) => ({
		matches: query.includes("min-width"),
		media: query,
		addEventListener: () => {},
		removeEventListener: () => {},
	}));

	// jsdom has no scrolling. The router scrolls to the top after each navigation.
	vi.stubGlobal("scrollTo", () => {});

	// jsdom has no layout. CodeMirror measures the boxes of a text range, so a range has no
	// box here.
	Object.defineProperty(Range.prototype, "getClientRects", {
		configurable: true,
		value: () => [],
	});
	Object.defineProperty(Range.prototype, "getBoundingClientRect", {
		configurable: true,
		value: () => ({
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
		}),
	});

	// Each test starts with an empty document.
	afterEach(cleanup);
}
