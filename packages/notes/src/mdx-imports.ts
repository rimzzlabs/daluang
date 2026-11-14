import { A, O, pipe, S } from "@mobily/ts-belt";

interface Fence {
	char: string;
	size: number;
}

/** An import statement that is longer stays as text. */
const MAX_IMPORT_LINES = 64;
/** A fence of CommonMark: 0 to 3 spaces, then 3 or more backticks or tildes. */
const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})(.*)$/;
/** A default name, `* as name`, `{ … }`, or a default name with one of the two others. */
const IMPORT_NAMES =
	/^(?:[\w$]+|(?:[\w$]+\s*,\s*)?(?:\*\s+as\s+[\w$]+|\{[^{}]*\}))$/;
const MODULE_SOURCE = /^[^"'\n]+$/;

function isBlank(line: string): boolean {
	return pipe(line, S.trim, S.isEmpty);
}

function fenceOpen(line: string): O.Option<Fence> {
	const found = FENCE_OPEN.exec(line);
	const marker = found?.[1];
	if (marker === undefined) return O.None;
	const char = marker.charAt(0);
	if (char === "`" && S.includes(found?.[2] ?? "", "`")) return O.None;
	return O.Some({ char, size: S.length(marker) });
}

function closesFence(line: string, fence: Fence): boolean {
	const trimmed = S.trim(line);
	return (
		/^ {0,3}\S/.test(line) &&
		S.length(trimmed) >= fence.size &&
		trimmed === S.repeat(fence.char, S.length(trimmed))
	);
}

/**
 * The last line of the code fence that opens at `index`: its closing fence, or the last
 * line. `None` when the line opens no fence. The indentation counts from column 0, so the
 * caller removes the indentation of a container first.
 */
export function fenceEnd(
	lines: readonly string[],
	index: number,
): O.Option<number> {
	const fence = fenceOpen(lines[index] ?? "");
	if (!O.isSome(fence)) return O.None;
	for (let next = index + 1; next < lines.length; next += 1)
		if (closesFence(lines[next] ?? "", fence)) return O.Some(next);
	return O.Some(lines.length - 1);
}

/**
 * True for the head of an import before its source: `import`, or `import names from`.
 * Each check is linear: no pattern has two quantifiers that can match the same text.
 */
function isImportHead(head: string): boolean {
	if (head === "import") return true;
	if (!/^import\s/.test(head) || !/\sfrom$/.test(head)) return false;
	const names = pipe(head.slice(6, -4), S.trim, S.replaceByRe(/^type\s+/, ""));
	return IMPORT_NAMES.test(names);
}

/** True for one whole import statement, for example `import A from "a";`. */
function isImportStatement(statement: string): boolean {
	const code = S.trimEnd(statement);
	const bare = S.endsWith(code, ";") ? S.trimEnd(code.slice(0, -1)) : code;
	const quote = bare.slice(-1);
	if (quote !== '"' && quote !== "'") return false;
	const open = bare.lastIndexOf(quote, bare.length - 2);
	if (open < 0 || !MODULE_SOURCE.test(bare.slice(open + 1, -1))) return false;
	return isImportHead(S.trimEnd(bare.slice(0, open)));
}

function endsStatement(line: string): boolean {
	const last = S.trimEnd(line).slice(-1);
	return last === ";" || last === '"' || last === "'";
}

/**
 * The last line of the import statement at `index`, or `None`. The statement ends at the
 * first line that ends with `;` or a quote, before a blank line, in 64 lines or less.
 */
function importEnd(lines: readonly string[], index: number): O.Option<number> {
	if (!S.startsWith(lines[index] ?? "", "import")) return O.None;
	const limit = Math.min(lines.length, index + MAX_IMPORT_LINES) - 1;
	let end = index;
	while (
		end < limit &&
		!endsStatement(lines[end] ?? "") &&
		!isBlank(lines[end + 1] ?? "")
	)
		end += 1;
	const statement = pipe(lines, A.slice(index, end - index + 1), A.join("\n"));
	return isImportStatement(statement) ? O.Some(end) : O.None;
}

function skipBlankLines(lines: readonly string[], from: number): number {
	let index = from;
	while (index < lines.length && isBlank(lines[index] ?? "")) index += 1;
	return index;
}

/**
 * Removes the import statements at the start of an MDX body, and the blank lines around
 * them. The first line that is not blank and not an import ends the search, so an import
 * in a component or in a paragraph stays. A body with no import stays the same.
 */
export function withoutImports(body: string): string {
	const lines = S.split(body, "\n");
	let index = skipBlankLines(lines, 0);
	let removed = false;
	for (
		let end = importEnd(lines, index);
		O.isSome(end);
		end = importEnd(lines, index)
	) {
		index = skipBlankLines(lines, end + 1);
		removed = true;
	}
	return removed ? pipe(lines, A.sliceToEnd(index), A.join("\n")) : body;
}
