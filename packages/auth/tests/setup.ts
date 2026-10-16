import { afterEach } from "vitest";

// The tests run in Node.js. A test file that renders a component sets jsdom in its first
// line, and only such a file has a document. The other files skip this setup.
if (typeof document !== "undefined") {
	const { cleanup } = await import("@testing-library/react");

	// Each test starts with an empty document.
	afterEach(cleanup);
}
