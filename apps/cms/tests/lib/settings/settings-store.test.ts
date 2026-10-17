// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
	createSettingsStore,
	useSettings,
} from "@/lib/settings/settings-store";

const SETTINGS = {
	site: { name: "rimzzlabs", url: null },
	languages: { languages: ["en"], defaultLanguage: "en" },
	fields: [],
};
const RENAMED = { ...SETTINGS, site: { name: "Catatan", url: null } };

describe("createSettingsStore", () => {
	it("reads the settings that it got, then the written ones", () => {
		const store = createSettingsStore(SETTINGS);
		expect(store.read()).toBe(SETTINGS);
		store.write(RENAMED);
		expect(store.read()).toBe(RENAMED);
	});

	it("tells each listener of a write, until the listener leaves", () => {
		const store = createSettingsStore(SETTINGS);
		const first = vi.fn();
		const second = vi.fn();
		const leave = store.subscribe(first);
		store.subscribe(second);
		store.write(RENAMED);
		leave();
		store.write(SETTINGS);
		expect(first).toHaveBeenCalledOnce();
		expect(second).toHaveBeenCalledTimes(2);
	});
});

describe("useSettings", () => {
	it("renders again after a write", () => {
		const store = createSettingsStore(SETTINGS);
		const { result } = renderHook(() => useSettings(store));
		expect(result.current.site.name).toBe("rimzzlabs");
		act(() => store.write(RENAMED));
		expect(result.current.site.name).toBe("Catatan");
	});
});
