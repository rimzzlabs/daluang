import { describe, expect, it, vi } from "vitest";
import { readSettings, writeSettings } from "../src/store";
import { createFakeD1 } from "./fake-d1";

const SITE = { name: "rimzzlabs", url: "https://rimzzlabs.com" };
const LANGUAGES = { languages: ["en", "id"], defaultLanguage: "en" };
const NOW = new Date("2026-10-17T00:00:00.000Z");

describe("readSettings", () => {
	it("gives null for each setting of an empty table", async () => {
		const { db } = createFakeD1();
		await expect(readSettings(db)).resolves.toEqual({
			site: null,
			languages: null,
		});
	});

	it("gives null for a value that its schema refuses, with a log", async () => {
		const log = vi.spyOn(console, "error").mockImplementation(() => {});
		const { db, database } = createFakeD1();
		database
			.prepare(`insert into "setting" values ('site', '{"name": ""}', 'now')`)
			.run();
		await expect(readSettings(db)).resolves.toEqual({
			site: null,
			languages: null,
		});
		expect(log).toHaveBeenCalledWith(
			'The setting "site" in D1 is not valid. The CMS asks for it again.',
		);
		log.mockRestore();
	});

	it("skips a row of another key", async () => {
		const { db, database } = createFakeD1();
		database
			.prepare(`insert into "setting" values ('theme', '"dark"', 'now')`)
			.run();
		await expect(readSettings(db)).resolves.toEqual({
			site: null,
			languages: null,
		});
	});
});

describe("writeSettings", () => {
	it("writes each setting of the patch, and reads them back", async () => {
		const { db } = createFakeD1();
		await writeSettings({
			db,
			patch: { site: SITE, languages: LANGUAGES },
			now: NOW,
		});
		await expect(readSettings(db)).resolves.toEqual({
			site: SITE,
			languages: LANGUAGES,
		});
	});

	it("replaces a setting and keeps the others", async () => {
		const { db, database } = createFakeD1();
		await writeSettings({
			db,
			patch: { site: SITE, languages: LANGUAGES },
			now: NOW,
		});
		const later = new Date("2026-10-18T00:00:00.000Z");
		const renamed = { name: "Rimzz", url: null };
		await writeSettings({ db, patch: { site: renamed }, now: later });
		await expect(readSettings(db)).resolves.toEqual({
			site: renamed,
			languages: LANGUAGES,
		});
		expect(
			database
				.prepare(`select "key", "updatedAt" from "setting" order by "key"`)
				.all(),
		).toEqual([
			{ key: "languages", updatedAt: NOW.toISOString() },
			{ key: "site", updatedAt: later.toISOString() },
		]);
	});

	it("writes nothing for an empty patch", async () => {
		const { db } = createFakeD1();
		await writeSettings({ db, patch: {}, now: NOW });
		await expect(readSettings(db)).resolves.toEqual({
			site: null,
			languages: null,
		});
	});
});
