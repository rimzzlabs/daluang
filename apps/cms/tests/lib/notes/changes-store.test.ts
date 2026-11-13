import { describe, expect, it, vi } from "vitest";
import { createChangesStore } from "@/lib/notes/changes-store";

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
});
