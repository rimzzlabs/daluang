// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useChangeCount } from "@/hooks/notes/use-change-count";
import { createChangesStore } from "@/lib/notes/changes-store";

describe("useChangeCount", () => {
	it("renders again after a write", () => {
		const store = createChangesStore(2);
		const { result } = renderHook(() => useChangeCount(store));
		expect(result.current).toBe(2);
		act(() => store.write(0));
		expect(result.current).toBe(0);
	});
});
