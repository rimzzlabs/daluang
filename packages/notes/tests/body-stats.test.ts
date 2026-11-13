import { describe, expect, it } from "vitest";
import { bodyStats, WORDS_PER_MINUTE } from "../src/body-stats";

describe("bodyStats", () => {
	it("counts the words, and not the marks of Markdown", () => {
		expect(bodyStats("# Resep Jotai\n\n- **satu** dua\n\n---\n").words).toBe(4);
	});

	it("counts a word with an accent, a digit, or an apostrophe as one word", () => {
		expect(bodyStats("Crème brûlée, React 19, it's").words).toBe(5);
	});

	it("counts each code point as one character", () => {
		expect(bodyStats("añ 🙂").characters).toBe(4);
	});

	it("rounds the read time up, and gives 0 for an empty body", () => {
		expect(bodyStats("").readMinutes).toBe(0);
		expect(bodyStats("word").readMinutes).toBe(1);
		const words = Array.from({ length: WORDS_PER_MINUTE + 1 }, () => "word");
		expect(bodyStats(words.join(" ")).readMinutes).toBe(2);
	});
});
