// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUTOSAVE_DELAY_MS, useAutosave } from "@/hooks/notes/use-autosave";

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

function renderAutosave(save: (value: string) => Promise<void>) {
	return renderHook(() => useAutosave(save));
}

describe("useAutosave", () => {
	it("saves the last value after the wait", async () => {
		const save = vi.fn(() => Promise.resolve());
		const { result } = renderAutosave(save);
		act(() => result.current.schedule("a"));
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS - 1));
		act(() => result.current.schedule("ab"));
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS - 1));
		expect(save).not.toHaveBeenCalled();
		await act(() => vi.advanceTimersByTimeAsync(1));
		expect(save).toHaveBeenCalledExactlyOnceWith("ab");
	});

	it("runs one save at a time, and then saves the change of the wait", async () => {
		const first = Promise.withResolvers<void>();
		const save = vi
			.fn<(value: string) => Promise<void>>()
			.mockReturnValueOnce(first.promise)
			.mockResolvedValue(undefined);
		const { result } = renderAutosave(save);
		act(() => result.current.schedule("a"));
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));
		act(() => result.current.schedule("ab"));
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));
		expect(save).toHaveBeenCalledTimes(1);
		await act(async () => first.resolve());
		expect(save).toHaveBeenLastCalledWith("ab");
		expect(save).toHaveBeenCalledTimes(2);
	});

	it("saves at once on flush, and gives nothing to save after it", async () => {
		const save = vi.fn(() => Promise.resolve());
		const { result } = renderAutosave(save);
		act(() => result.current.schedule("a"));
		await act(async () => result.current.flush());
		expect(save).toHaveBeenCalledExactlyOnceWith("a");
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));
		await act(async () => result.current.flush());
		expect(save).toHaveBeenCalledTimes(1);
	});

	it("saves the waiting value when the component goes away", () => {
		const save = vi.fn(() => Promise.resolve());
		const { result, unmount } = renderAutosave(save);
		act(() => result.current.schedule("a"));
		unmount();
		expect(save).toHaveBeenCalledExactlyOnceWith("a");
	});

	it("asks before the page closes while a value waits", async () => {
		const save = vi.fn(() => Promise.resolve());
		const { result } = renderAutosave(save);
		function closing(): boolean {
			const event = new Event("beforeunload", { cancelable: true });
			window.dispatchEvent(event);
			return event.defaultPrevented;
		}
		expect(closing()).toBe(false);
		act(() => result.current.schedule("a"));
		expect(closing()).toBe(true);
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));
		expect(closing()).toBe(false);
	});
});
