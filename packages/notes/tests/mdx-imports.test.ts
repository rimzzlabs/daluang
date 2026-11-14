import { describe, expect, it } from "vitest";
import { fenceEnd, withoutImports } from "../src/mdx-imports";

function lines(...parts: string[]): string {
	return parts.join("\n");
}

describe("fenceEnd", () => {
	it.each<[string, number | undefined]>([
		["```js\na\n```", 2],
		["~~~\na\n```\n~~~~", 3],
		["````\n```\n````", 2],
		["   ```\na\n   ```", 2],
		["```\nno end", 1],
		["    ```\na\n```", undefined],
		["\t```\na\n```", undefined],
		["``` a`b\n```", undefined],
		["Text", undefined],
	])("gives the end of %j", (text, end) => {
		expect(fenceEnd(text.split("\n"), 0)).toBe(end);
	});

	it("does not close at a fence with 4 spaces or a tab", () => {
		expect(fenceEnd(["```", "    ```", "```"], 0)).toBe(2);
		expect(fenceEnd(["```", "\t```", "x", "```"], 0)).toBe(3);
	});
});

describe("withoutImports", () => {
	it("removes each import at the start, and the blank lines around them", () => {
		const body = lines(
			"",
			'import Image from "./a.png";',
			"import {",
			"  b,",
			"  c",
			'} from "x";',
			"",
			"import './style.css'",
			'import type { T } from "t";',
			'import * as all from "all";',
			"import d, { e } from 'd';",
			"",
			"",
			"# Title",
			"",
		);
		expect(withoutImports(body)).toBe("# Title\n");
	});

	it("accepts \\r\\n", () => {
		expect(withoutImports('import A from "a";\r\n\r\nText\r\n')).toBe(
			"Text\r\n",
		);
	});

	it.each([
		"",
		"\n\nText\n",
		'Text\nimport "x" is a phrase',
		'import the data from "a CSV" file\nand more prose',
		'import the data from "a CSV"',
		"import x from y;",
		'import a from "a"; import b from "b";',
		'Text\n\nimport A from "a";',
		'<Callout>\n\nimport A from "a";\n\n</Callout>',
		'```js\nimport A from "a";\n```',
		'export const meta = {};\nimport A from "a";',
	])("keeps %j", (body) => {
		expect(withoutImports(body)).toBe(body);
	});

	it("stops at a statement of more than 64 lines", () => {
		const names = Array.from({ length: 70 }, (_, index) => `  n${index},`);
		const body = lines("import {", ...names, '} from "x";');
		expect(withoutImports(body)).toBe(body);
	});

	it("removes the whole body when it holds only imports", () => {
		expect(withoutImports('import A from "a";\n')).toBe("");
	});
});
