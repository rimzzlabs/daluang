import { describe, expect, it, vi } from "vitest";
import { createChangesStore } from "@/lib/notes/changes-store";
import type { AutosaveOutcome } from "@/lib/notes/client";

describe("createChangesStore", () => {
	it("reads the number that it got, then the written one", () => {
		const store = createChangesStore(3);
		expect(store.read()).toBe(3);
		store.write(0);
		expect(store.read()).toBe(0);
	});

	it("tells each listener of a write, until the listener leaves", () => {
		const store = createChangesStore(0);
		const first = vi.fn();
		const second = vi.fn();
		const leave = store.subscribe(first);
		store.subscribe(second);
		store.write(1);
		leave();
		store.write(2);
		expect(first).toHaveBeenCalledOnce();
		expect(second).toHaveBeenCalledTimes(2);
	});

	it("counts each Publish changes, with no change after it", () => {
		const store = createChangesStore(2);
		const listener = vi.fn();
		store.subscribe(listener);
		expect(store.readPublished()).toBe(0);
		store.markPublished();
		expect(store.readPublished()).toBe(1);
		expect(store.read()).toBe(0);
		expect(listener).toHaveBeenCalledOnce();
		store.write(1);
		expect(store.readPublished()).toBe(1);
	});

	it("saves the open post that is registered, and gives saved with no open post", async () => {
		const store = createChangesStore(0);
		await expect(store.saveOpenPost()).resolves.toBe("saved");
		const first = vi.fn(() => Promise.resolve<AutosaveOutcome>("refused"));
		const second = vi.fn(() => Promise.resolve<AutosaveOutcome>("saved"));
		const removeFirst = store.registerOpenPost(first);
		await expect(store.saveOpenPost()).resolves.toBe("refused");
		const removeSecond = store.registerOpenPost(second);
		// The old page goes away after the new page registers: the new save stays.
		removeFirst();
		await expect(store.saveOpenPost()).resolves.toBe("saved");
		expect(second).toHaveBeenCalledOnce();
		removeSecond();
		await expect(store.saveOpenPost()).resolves.toBe("saved");
		expect(second).toHaveBeenCalledOnce();
	});
});
