// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	AUTOSAVE_DELAY_MS,
	AUTOSAVE_RETRY_MS,
	useAutosave,
} from "@/hooks/notes/use-autosave";
import type { AutosaveOutcome } from "@/lib/notes/client";

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

type Save = (value: string) => Promise<AutosaveOutcome>;

function renderAutosave(save: Save) {
	return renderHook(() => useAutosave(save));
}

function saving(outcome: AutosaveOutcome) {
	return vi.fn<Save>(() => Promise.resolve(outcome));
}

function closing(): boolean {
	const event = new Event("beforeunload", { cancelable: true });
	window.dispatchEvent(event);
	return event.defaultPrevented;
}

describe("useAutosave", () => {
	it("saves the last value after the wait", async () => {
		const save = saving("saved");
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
		const first = Promise.withResolvers<AutosaveOutcome>();
		const save = vi
			.fn<Save>()
			.mockReturnValueOnce(first.promise)
			.mockResolvedValue("saved");
		const { result } = renderAutosave(save);
		act(() => result.current.schedule("a"));
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));
		act(() => result.current.schedule("ab"));
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));
		expect(save).toHaveBeenCalledTimes(1);
		await act(async () => first.resolve("saved"));
		expect(save).toHaveBeenLastCalledWith("ab");
		expect(save).toHaveBeenCalledTimes(2);
	});

	it("saves at once on flush, and gives nothing to save after it", async () => {
		const save = saving("saved");
		const { result } = renderAutosave(save);
		act(() => result.current.schedule("a"));
		await act(async () => result.current.flush());
		expect(save).toHaveBeenCalledExactlyOnceWith("a");
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));
		await act(async () => result.current.flush());
		expect(save).toHaveBeenCalledTimes(1);
	});

	it("saves the waiting value when the component goes away", () => {
		const save = saving("saved");
		const { result, unmount } = renderAutosave(save);
		act(() => result.current.schedule("a"));
		unmount();
		expect(save).toHaveBeenCalledExactlyOnceWith("a");
	});

	it("asks before the page closes while a value waits", async () => {
		const save = saving("saved");
		const { result } = renderAutosave(save);
		expect(closing()).toBe(false);
		act(() => result.current.schedule("a"));
		expect(closing()).toBe(true);
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));
		expect(closing()).toBe(false);
	});

	it("keeps a failed value, and sends it again after the retry wait", async () => {
		const save = vi
			.fn<Save>()
			.mockResolvedValueOnce("failed")
			.mockResolvedValue("saved");
		const { result } = renderAutosave(save);
		act(() => result.current.schedule("a"));
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));
		expect(save).toHaveBeenCalledOnce();
		expect(closing()).toBe(true);
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_RETRY_MS - 1));
		expect(save).toHaveBeenCalledOnce();
		await act(() => vi.advanceTimersByTimeAsync(1));
		expect(save).toHaveBeenCalledTimes(2);
		expect(save).toHaveBeenLastCalledWith("a");
		expect(closing()).toBe(false);
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_RETRY_MS));
		expect(save).toHaveBeenCalledTimes(2);
	});

	it("keeps a refused value with no retry, and sends it when the component goes away", async () => {
		const save = saving("refused");
		const { result, unmount } = renderAutosave(save);
		act(() => result.current.schedule("a"));
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));
		expect(closing()).toBe(true);
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_RETRY_MS * 2));
		expect(save).toHaveBeenCalledOnce();
		unmount();
		expect(save).toHaveBeenCalledTimes(2);
		expect(save).toHaveBeenLastCalledWith("a");
	});

	it("sends a kept value again on flush", async () => {
		const save = saving("refused");
		const { result } = renderAutosave(save);
		act(() => result.current.schedule("a"));
		await act(async () => result.current.flush());
		await act(async () => result.current.flush());
		expect(save).toHaveBeenCalledTimes(2);
		expect(save).toHaveBeenLastCalledWith("a");
	});

	it("sends the newer value after a failed save, and never the old value", async () => {
		const first = Promise.withResolvers<AutosaveOutcome>();
		const save = vi
			.fn<Save>()
			.mockReturnValueOnce(first.promise)
			.mockResolvedValue("saved");
		const { result } = renderAutosave(save);
		act(() => result.current.schedule("a"));
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));
		act(() => result.current.schedule("ab"));
		await act(async () => first.resolve("failed"));
		expect(save).toHaveBeenCalledOnce();
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));
		expect(save).toHaveBeenCalledTimes(2);
		expect(save).toHaveBeenLastCalledWith("ab");
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_RETRY_MS * 2));
		expect(save).toHaveBeenCalledTimes(2);
		expect(closing()).toBe(false);
	});

	it("waits the normal time for a change during the retry wait", async () => {
		const save = vi
			.fn<Save>()
			.mockResolvedValueOnce("failed")
			.mockResolvedValue("saved");
		const { result } = renderAutosave(save);
		act(() => result.current.schedule("a"));
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));
		act(() => result.current.schedule("ab"));
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));
		expect(save).toHaveBeenCalledTimes(2);
		expect(save).toHaveBeenLastCalledWith("ab");
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_RETRY_MS));
		expect(save).toHaveBeenCalledTimes(2);
	});

	it("does not try again after the component goes away", async () => {
		const save = saving("failed");
		const { result, unmount } = renderAutosave(save);
		act(() => result.current.schedule("a"));
		unmount();
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_RETRY_MS * 2));
		expect(save).toHaveBeenCalledOnce();
	});

	it("does not try again when a save that runs at unmount fails", async () => {
		const first = Promise.withResolvers<AutosaveOutcome>();
		const save = vi.fn<Save>().mockReturnValueOnce(first.promise);
		const { result, unmount } = renderAutosave(save);
		act(() => result.current.schedule("a"));
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));
		// The save of "a" runs, so the send of the unmount cannot start a second save.
		unmount();
		await act(async () => first.resolve("failed"));
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_RETRY_MS * 2));
		expect(save).toHaveBeenCalledExactlyOnceWith("a");
	});

	it("tells if the server does not have the last value", async () => {
		const first = Promise.withResolvers<AutosaveOutcome>();
		const save = vi
			.fn<Save>()
			.mockReturnValueOnce(first.promise)
			.mockResolvedValueOnce("refused")
			.mockResolvedValueOnce("failed");
		const { result } = renderAutosave(save);
		expect(result.current.hasUnsaved()).toBe(false);
		act(() => result.current.schedule("a"));
		expect(result.current.hasUnsaved()).toBe(true);
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));
		expect(save).toHaveBeenCalledOnce();
		expect(result.current.hasUnsaved()).toBe(true);
		await act(async () => first.resolve("saved"));
		expect(result.current.hasUnsaved()).toBe(false);
		act(() => result.current.schedule("ab"));
		await act(async () => result.current.flush());
		expect(save).toHaveBeenLastCalledWith("ab");
		expect(result.current.hasUnsaved()).toBe(true);
		await act(async () => result.current.flush());
		expect(save).toHaveBeenCalledTimes(3);
		expect(result.current.hasUnsaved()).toBe(true);
	});

	it("starts no second save on a flush during a save", async () => {
		const first = Promise.withResolvers<AutosaveOutcome>();
		const save = vi
			.fn<Save>()
			.mockReturnValueOnce(first.promise)
			.mockResolvedValue("saved");
		const { result } = renderAutosave(save);
		act(() => result.current.schedule("a"));
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));
		act(() => result.current.schedule("ab"));
		await act(async () => result.current.flush());
		expect(save).toHaveBeenCalledOnce();
		await act(async () => first.resolve("saved"));
		expect(save).toHaveBeenCalledTimes(2);
		expect(save).toHaveBeenLastCalledWith("ab");
	});
});

describe("useAutosave settle", () => {
	it("gives saved at once when nothing waits", async () => {
		const save = saving("saved");
		const { result } = renderAutosave(save);
		await expect(result.current.settle()).resolves.toBe("saved");
		expect(save).not.toHaveBeenCalled();
	});

	it("sends a waiting value at once, and gives saved after its save", async () => {
		const save = saving("saved");
		const { result } = renderAutosave(save);
		act(() => result.current.schedule("a"));
		await expect(result.current.settle()).resolves.toBe("saved");
		expect(save).toHaveBeenCalledExactlyOnceWith("a");
		expect(result.current.hasUnsaved()).toBe(false);
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));
		expect(save).toHaveBeenCalledOnce();
	});

	it("waits for the save of the last value behind a save that runs", async () => {
		const first = Promise.withResolvers<AutosaveOutcome>();
		const save = vi
			.fn<Save>()
			.mockReturnValueOnce(first.promise)
			.mockResolvedValue("saved");
		const { result } = renderAutosave(save);
		act(() => result.current.schedule("a"));
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));
		act(() => result.current.schedule("ab"));
		const settled = result.current.settle();
		await act(async () => first.resolve("saved"));
		await expect(settled).resolves.toBe("saved");
		expect(save).toHaveBeenCalledTimes(2);
		expect(save).toHaveBeenLastCalledWith("ab");
		expect(result.current.hasUnsaved()).toBe(false);
	});

	it("waits for a save of the same value that runs", async () => {
		const first = Promise.withResolvers<AutosaveOutcome>();
		const save = vi.fn<Save>().mockReturnValueOnce(first.promise);
		const { result } = renderAutosave(save);
		act(() => result.current.schedule("a"));
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));
		const settled = result.current.settle();
		await act(async () => first.resolve("saved"));
		await expect(settled).resolves.toBe("saved");
		expect(save).toHaveBeenCalledOnce();
	});

	it("gives refused after a refused save", async () => {
		const save = saving("refused");
		const { result } = renderAutosave(save);
		act(() => result.current.schedule("a"));
		await expect(result.current.settle()).resolves.toBe("refused");
		expect(save).toHaveBeenCalledOnce();
		expect(result.current.hasUnsaved()).toBe(true);
	});

	it("gives failed after a failed save, and the retry still runs", async () => {
		const save = vi
			.fn<Save>()
			.mockResolvedValueOnce("failed")
			.mockResolvedValue("saved");
		const { result } = renderAutosave(save);
		act(() => result.current.schedule("a"));
		await expect(result.current.settle()).resolves.toBe("failed");
		expect(save).toHaveBeenCalledOnce();
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_RETRY_MS));
		expect(save).toHaveBeenCalledTimes(2);
		expect(result.current.hasUnsaved()).toBe(false);
	});

	it("gives failed when a save of the same value that runs fails", async () => {
		const first = Promise.withResolvers<AutosaveOutcome>();
		const save = vi.fn<Save>().mockReturnValueOnce(first.promise);
		const { result } = renderAutosave(save);
		act(() => result.current.schedule("a"));
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));
		const settled = result.current.settle();
		await act(async () => first.resolve("failed"));
		await expect(settled).resolves.toBe("failed");
		expect(save).toHaveBeenCalledOnce();
	});
});
