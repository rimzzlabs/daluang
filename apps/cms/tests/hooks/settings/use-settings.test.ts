// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useSettings } from "@/hooks/settings/use-settings";
import { createSettingsStore } from "@/lib/settings/settings-store";

const SETTINGS = {
	site: { name: "rimzzlabs", url: null },
	languages: { languages: ["en"], defaultLanguage: "en" },
	fields: [],
};
const RENAMED = { ...SETTINGS, site: { name: "Catatan", url: null } };

describe("useSettings", () => {
	it("renders again after a write", () => {
		const store = createSettingsStore(SETTINGS);
		const { result } = renderHook(() => useSettings(store));
		expect(result.current.site.name).toBe("rimzzlabs");
		act(() => store.write(RENAMED));
		expect(result.current.site.name).toBe("Catatan");
	});
});
