import { R } from "@mobily/ts-belt";
import { afterEach, describe, expect, it, vi } from "vitest";
import { openPage, saveSettings } from "@/lib/settings/client";

const SITE = { name: "rimzzlabs", url: null };
const STORED = { site: SITE, languages: null, fields: null };

function answer(response: Response | Error) {
	const fetch = vi.fn(() =>
		response instanceof Error
			? Promise.reject(response)
			: Promise.resolve(response),
	);
	vi.stubGlobal("fetch", fetch);
	return fetch;
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("saveSettings", () => {
	it("sends the patch as JSON and gives the stored settings", async () => {
		const fetch = answer(Response.json({ settings: STORED }));
		await expect(saveSettings({ site: SITE })).resolves.toEqual(R.Ok(STORED));
		expect(fetch).toHaveBeenCalledWith("/api/settings", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ site: SITE }),
		});
	});

	it.each([
		[401, "signed-out"],
		[403, "server"],
		[422, "invalid"],
		[413, "invalid"],
		[500, "server"],
	])("gives the error of the status %i", async (status, error) => {
		answer(Response.json({}, { status }));
		await expect(saveSettings({ site: SITE })).resolves.toEqual(R.Error(error));
	});

	it("gives offline when the request fails", async () => {
		answer(new TypeError("Failed to fetch"));
		await expect(saveSettings({ site: SITE })).resolves.toEqual(
			R.Error("offline"),
		);
	});

	it("gives server for a body that is not JSON", async () => {
		answer(new Response("<html>"));
		await expect(saveSettings({ site: SITE })).resolves.toEqual(
			R.Error("server"),
		);
	});

	it("gives server for a body of another shape", async () => {
		answer(Response.json({ ok: true }));
		await expect(saveSettings({ site: SITE })).resolves.toEqual(
			R.Error("server"),
		);
	});
});

describe("openPage", () => {
	it("opens the page with a full page load", () => {
		const assign = vi.fn();
		vi.stubGlobal("location", { assign });
		openPage("/");
		expect(assign).toHaveBeenCalledWith("/");
	});
});
