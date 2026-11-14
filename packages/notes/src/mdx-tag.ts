import { O } from "@mobily/ts-belt";

/** A prop with a text value. `true` is a prop with no value, for example `open`. */
export interface Prop {
	name: string;
	value: string | true;
}

/** An opening tag. `end` is the offset after its `>`, or the offset where the parse stops. */
export type Tag =
	| {
			status: "parsed";
			name: string;
			props: readonly Prop[];
			expression: boolean;
			selfClosing: boolean;
			end: number;
	  }
	| { status: "broken"; name: string; end: number };

/** A prop of a tag. `prop` is `None` for an expression. `end` is -1 for a syntax error. */
interface PropStep {
	prop: O.Option<Prop>;
	end: number;
}

function skipWhile(
	text: string,
	params: { from: number; pattern: RegExp },
): number {
	let index = params.from;
	while (params.pattern.test(text.charAt(index))) index += 1;
	return index;
}

function skipSpace(text: string, from: number): number {
	return skipWhile(text, { from, pattern: /\s/ });
}

function skipExpression(text: string, from: number): number {
	let depth = 0;
	let quote = "";
	for (let index = from; index < text.length; index += 1) {
		const char = text.charAt(index);
		if (quote !== "") {
			if (char === "\\") index += 1;
			else if (char === quote) quote = "";
		} else if (char === '"' || char === "'" || char === "`") quote = char;
		else if (char === "{") depth += 1;
		else if (char === "}") {
			depth -= 1;
			if (depth === 0) return index + 1;
		}
	}
	return text.length;
}

function parseProp(text: string, from: number): PropStep {
	const nameEnd = skipWhile(text, { from, pattern: /[\w:.-]/ });
	if (nameEnd === from) return { prop: O.None, end: -1 };
	const name = text.slice(from, nameEnd);
	const equals = skipSpace(text, nameEnd);
	if (text.charAt(equals) !== "=")
		return { prop: O.Some({ name, value: true }), end: nameEnd };
	const start = skipSpace(text, equals + 1);
	const quote = text.charAt(start);
	if (quote === "{") return { prop: O.None, end: skipExpression(text, start) };
	if (quote !== '"' && quote !== "'") return { prop: O.None, end: -1 };
	const close = text.indexOf(quote, start + 1);
	if (close < 0) return { prop: O.None, end: text.length };
	return {
		prop: O.Some({ name, value: text.slice(start + 1, close) }),
		end: close + 1,
	};
}

/**
 * The opening tag at `start`, which can span lines. A string or an expression with no end
 * breaks the tag up to the end of the text, so each part of the text is read one time. The
 * props go in a local array: a copy for each prop costs too much on a long tag.
 */
export function parseTag(text: string, start: number): Tag {
	const nameEnd = skipWhile(text, { from: start + 1, pattern: /\w/ });
	const name = text.slice(start + 1, nameEnd);
	const props: Prop[] = [];
	let expression = false;
	let index = nameEnd;
	if (!/[\s/>]/.test(text.charAt(index)))
		return { status: "broken", name, end: index };
	while (index < text.length) {
		index = skipSpace(text, index);
		const selfClosing = text.startsWith("/>", index);
		if (selfClosing || text.charAt(index) === ">") {
			const end = index + (selfClosing ? 2 : 1);
			return { status: "parsed", name, props, expression, selfClosing, end };
		}
		const step =
			text.charAt(index) === "{"
				? { prop: O.None, end: skipExpression(text, index) }
				: parseProp(text, index);
		if (step.end < 0) return { status: "broken", name, end: index };
		if (O.isSome(step.prop)) props.push(step.prop);
		expression = expression || O.isNone(step.prop);
		index = step.end;
	}
	return { status: "broken", name, end: text.length };
}
