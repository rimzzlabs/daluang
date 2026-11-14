import { handleTokensRequest } from "@daluang/api-tokens/api";
import { handleNotesRequest } from "@daluang/notes/api";
import { handleChangesRequest } from "@daluang/notes/changes";
import { handleContentRequest } from "@daluang/notes/content";
import { handleImportRequest } from "@daluang/notes/import";
import { type Note, noteSchema, noteSummarySchema } from "@daluang/notes/note";
import { untitledDraft } from "@daluang/notes/note-draft";
import { noteFormOf, parseNoteForm, withTitle } from "@daluang/notes/note-form";
import { handleSettingsRequest } from "@daluang/settings/api";
import { readSettings } from "@daluang/settings/store";
import { handleWebhooksRequest } from "@daluang/webhooks/api";
import { R } from "@mobily/ts-belt";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { authorizeSite } from "@/lib/notes/authorize";
import { notifySites } from "@/lib/notes/notify";
import { createFakeD1 } from "../fake-d1";

/**
 * The publish flow of a CMS, from the first settings to the content API of a site, also for
 * an imported post. Each step calls the handler of an endpoint with the wiring of its route
 * file, on one D1. A step of the editor uses the pure functions of the editor, as the
 * browser does.
 */

const ORIGIN = "http://localhost:4321";
const HOOK = "https://api.example.com/deploy-hook";
const NOW = () => new Date("2026-11-14T08:00:00.000Z");
const LANGUAGES = { languages: ["en", "id"], defaultLanguage: "en" };

function request(method: string, path: string, body?: unknown): Request {
	if (body === undefined) return new Request(`${ORIGIN}${path}`, { method });
	return new Request(`${ORIGIN}${path}`, {
		method,
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
	});
}

// Each answer is JSON from outside the test, so the test reads it with a schema.
const noteAnswer = z.object({ note: noteSchema });
const listAnswer = z.object({ notes: z.array(noteSummarySchema) });
const tokenAnswer = z.object({ secret: z.string() });
const changesAnswer = z.object({
	count: z.number(),
	changes: z.array(z.object({ change: z.string() })),
});
const appliedAnswer = z.object({ applied: z.array(z.unknown()) });
const contentAnswer = z.object({
	notes: z.array(
		z.looseObject({
			title: z.string(),
			slug: z.string(),
			language: z.string(),
		}),
	),
});

async function read<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
	return schema.parse(await response.json());
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("the publish flow", () => {
	it("gives a site the post only after Publish changes, with one webhook call", async () => {
		const { db } = createFakeD1();
		const hook = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
			Promise.resolve(new Response(null, { status: 200 })),
		);
		vi.stubGlobal("fetch", hook);

		async function notes(params: {
			method: string;
			path: string;
			id?: string;
			action?: string;
			body?: unknown;
		}): Promise<Response> {
			return handleNotesRequest({
				request: request(params.method, params.path, params.body),
				db,
				id: params.id,
				action: params.action,
				settings: await readSettings(db),
				now: NOW,
			});
		}

		function changes(method: string): Promise<Response> {
			return handleChangesRequest({
				request: request(method, "/api/changes"),
				db,
				now: NOW,
				notify: notifySites(db),
			});
		}

		async function content(
			secret: string,
		): Promise<z.infer<typeof contentAnswer>["notes"]> {
			const response = await handleContentRequest({
				request: new Request(`${ORIGIN}/api/content/notes`, {
					headers: { authorization: `Bearer ${secret}` },
				}),
				db,
				authorize: authorizeSite(db),
			});
			expect(response.status).toBe(200);
			return (await read(response, contentAnswer)).notes;
		}

		// The onboarding saves the languages. A webhook and an API token connect the site.
		const settings = await handleSettingsRequest({
			request: request("PATCH", "/api/settings", { languages: LANGUAGES }),
			db,
			now: NOW,
		});
		expect(settings.status).toBe(200);
		const webhook = await handleWebhooksRequest({
			request: request("POST", "/api/webhooks", { name: "Site", url: HOOK }),
			db,
			now: NOW,
			fetcher: hook,
		});
		expect(webhook.status).toBe(201);
		const token = await handleTokensRequest({
			request: request("POST", "/api/tokens", { name: "Site" }),
			db,
			id: undefined,
			now: NOW,
		});
		expect(token.status).toBe(201);
		const { secret } = await read(token, tokenAnswer);

		// New post adds an untitled draft with a free slug.
		const listed = await read(
			await notes({ method: "GET", path: "/api/notes" }),
			listAnswer,
		);
		const rules = { languages: LANGUAGES, fields: [] };
		const added = await notes({
			method: "POST",
			path: "/api/notes",
			body: untitledDraft({ notes: listed.notes, rules }),
		});
		expect(added.status).toBe(201);
		const draft: Note = (await read(added, noteAnswer)).note;
		expect([draft.title, draft.slug]).toEqual(["Untitled", "untitled"]);

		// The autosave sends the form of the editor. The slug follows the first title.
		const form = {
			...withTitle(noteFormOf(draft, []), "Jotai recipes"),
			body: '# Jotai\n\n::callout{type="note"}\nSmall atoms.\n::',
		};
		const saved = await notes({
			method: "PATCH",
			path: `/api/notes/${draft.id}`,
			id: draft.id,
			body: R.getExn(parseNoteForm(form, rules)),
		});
		expect(saved.status).toBe(200);
		expect((await read(saved, noteAnswer)).note.slug).toBe("jotai-recipes");

		// A save changes no site.
		expect(await content(secret)).toEqual([]);
		expect(hook).toHaveBeenCalledTimes(0);

		// Publish marks the post. Publish changes copies it, and calls the webhook one time.
		const marked = await notes({
			method: "POST",
			path: `/api/notes/${draft.id}/publish`,
			id: draft.id,
			action: "publish",
		});
		expect(marked.status).toBe(200);
		expect((await read(await changes("GET"), changesAnswer)).count).toBe(1);
		const applied = await changes("POST");
		expect((await read(applied, appliedAnswer)).applied).toHaveLength(1);
		expect(hook).toHaveBeenCalledTimes(1);
		const [target, init] = hook.mock.calls[0] ?? [];
		expect(String(target)).toBe(HOOK);
		expect(JSON.parse(String(init?.body)).event).toBe("publish");

		// The site reads the published copy, with the document of Comark.
		const [published] = await content(secret);
		expect(published).toMatchObject({
			title: "Jotai recipes",
			slug: "jotai-recipes",
			language: "en",
		});
		expect(JSON.stringify(published)).toContain("callout");

		// A later save waits for the next Publish changes.
		await notes({
			method: "PATCH",
			path: `/api/notes/${draft.id}`,
			id: draft.id,
			body: R.getExn(
				parseNoteForm({ ...form, title: "Jotai recipes, part 2" }, rules),
			),
		});
		expect((await content(secret))[0]?.title).toBe("Jotai recipes");
		const waiting = await read(await changes("GET"), changesAnswer);
		expect(waiting.changes).toEqual([{ change: "edit" }]);
		await changes("POST");
		expect((await content(secret))[0]?.title).toBe("Jotai recipes, part 2");

		// A delete of a published post waits for Publish changes also.
		const deleted = await notes({
			method: "DELETE",
			path: `/api/notes/${draft.id}`,
			id: draft.id,
		});
		expect(deleted.status).toBe(200);
		expect(await content(secret)).toHaveLength(1);
		await changes("POST");
		expect(await content(secret)).toEqual([]);
		expect(hook).toHaveBeenCalledTimes(3);
	});

	it("gives a site the dates of an imported post after Publish changes", async () => {
		const { db } = createFakeD1();
		await handleSettingsRequest({
			request: request("PATCH", "/api/settings", { languages: LANGUAGES }),
			db,
			now: NOW,
		});
		const token = await handleTokensRequest({
			request: request("POST", "/api/tokens", { name: "Site" }),
			db,
			id: undefined,
			now: NOW,
		});
		const { secret } = await read(token, tokenAnswer);

		// The writer imports an old post. The file asks for a publish, so the post gets the mark.
		const text = `---\ntitle: Jotai recipes\npublishedAt: "09/30/2023"\nupdatedAt: "10/16/2026"\nstatus: published\n---\n\n<Callout type="note">\n  Small atoms.\n</Callout>\n`;
		const imported = await handleImportRequest({
			request: request("POST", "/api/notes/import", {
				fileName: "jotai-recipes.mdx",
				language: "en",
				text,
			}),
			db,
			settings: await readSettings(db),
			now: NOW,
		});
		expect(imported.status).toBe(201);
		const answer = await read(imported, z.object({ note: noteSchema }));
		expect(answer.note.mark).toBe("publish");

		// Publish changes copies it. The site gets the dates of the file, not of the import.
		const applied = await handleChangesRequest({
			request: request("POST", "/api/changes"),
			db,
			now: NOW,
			notify: notifySites(db),
		});
		expect(applied.status).toBe(200);
		const response = await handleContentRequest({
			request: new Request(`${ORIGIN}/api/content/notes`, {
				headers: { authorization: `Bearer ${secret}` },
			}),
			db,
			authorize: authorizeSite(db),
		});
		const [published] = (await read(response, contentAnswer)).notes;
		expect(published).toMatchObject({
			slug: "jotai-recipes",
			publishedAt: "2023-09-30T00:00:00.000Z",
			updatedAt: "2026-10-16T00:00:00.000Z",
		});
		expect(published?.document).toMatchObject({
			nodes: [["callout", { type: "note" }, "Small atoms."]],
		});
	});

	it("refuses the content API without a valid token", async () => {
		const { db } = createFakeD1();
		const response = await handleContentRequest({
			request: new Request(`${ORIGIN}/api/content/notes`, {
				headers: { authorization: "Bearer dlg_not-a-token" },
			}),
			db,
			authorize: authorizeSite(db),
		});
		expect(response.status).toBe(401);
	});
});
