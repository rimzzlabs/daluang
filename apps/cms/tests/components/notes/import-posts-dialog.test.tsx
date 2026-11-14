// @vitest-environment jsdom
import { NOTE_BODY_MAX_BYTES } from "@daluang/notes/note-draft";
import { R } from "@mobily/ts-belt";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ImportPostsDialog } from "@/components/notes/import-posts-dialog";

const client = vi.hoisted(() => ({ importNoteOfCms: vi.fn() }));
vi.mock("@/lib/notes/client", () => client);

const LANGUAGES = { languages: ["en", "id"], defaultLanguage: "en" };

function imported(mark: "publish" | null, warnings: readonly object[] = []) {
	return R.Ok({ note: { id: "n1", mark }, warnings });
}

function file(name: string) {
	return new File([`---\ntitle: ${name}\n---\n`], name);
}

function renderDialog(languages = LANGUAGES) {
	const onOpenChange = vi.fn();
	const onImported = vi.fn(() => Promise.resolve());
	render(
		<ImportPostsDialog
			open
			onOpenChange={onOpenChange}
			languages={languages}
			fields={[]}
			onImported={onImported}
		/>,
	);
	return { onOpenChange, onImported };
}

/** Holds each request until the test gives its answer. */
function holdRequests() {
	const answers: ((value: unknown) => void)[] = [];
	client.importNoteOfCms.mockImplementation(
		() => new Promise((resolve) => answers.push(resolve)),
	);
	return answers;
}

async function choose(files: readonly File[]) {
	await userEvent.upload(screen.getByLabelText("Markdown or MDX files"), [
		...files,
	]);
}

function importButton() {
	return screen.getByRole("button", { name: "Import" });
}

function status() {
	return screen.getByRole("status").textContent;
}

function rowOf(name: string) {
	const item = screen.getByText(name).closest("li");
	if (item === null) throw new Error(`No row for ${name}`);
	return within(item);
}

beforeEach(() => {
	client.importNoteOfCms.mockReset();
});

describe("ImportPostsDialog", () => {
	it("imports the files in the order of their names, in the chosen language", async () => {
		client.importNoteOfCms
			.mockResolvedValueOnce(imported("publish"))
			.mockResolvedValueOnce(
				imported(null, [{ code: "field-left-out", name: "cover" }]),
			)
			.mockResolvedValueOnce(R.Error({ code: "slug-taken" }))
			.mockResolvedValueOnce(
				R.Error({
					code: "invalid-note",
					issues: [{ path: "title", message: "Give the post a title." }],
				}),
			);
		const { onImported } = renderDialog();
		const large = new File(["a".repeat(NOTE_BODY_MAX_BYTES + 1)], "e.md");
		await choose([
			file("d.md"),
			large,
			file("b.md"),
			file("a.md"),
			file("c.md"),
		]);
		expect(rowOf("a.md").getByText("Not sent yet")).toBeTruthy();
		await userEvent.click(screen.getByRole("button", { name: "Indonesia" }));
		await userEvent.click(importButton());
		await waitFor(() =>
			expect(status()).toBe(
				"2 imported, 1 skipped, 2 failed. 1 with the mark To publish.",
			),
		);
		expect(
			client.importNoteOfCms.mock.calls.map((call) => call[0]),
		).toMatchObject([
			{ fileName: "a.md", language: "id" },
			{ fileName: "b.md", language: "id" },
			{ fileName: "c.md", language: "id" },
			{ fileName: "d.md", language: "id" },
		]);
		expect(rowOf("a.md").getByText("To publish")).toBeTruthy();
		expect(rowOf("b.md").getByText("Draft")).toBeTruthy();
		expect(
			rowOf("b.md").getByText(/The import left out the key "cover"/),
		).toBeTruthy();
		expect(rowOf("c.md").getByText("Skipped")).toBeTruthy();
		expect(
			rowOf("d.md").getByText("Title: Give the post a title."),
		).toBeTruthy();
		expect(
			rowOf("e.md").getByText(/The file is too large to send/),
		).toBeTruthy();
		expect(
			screen.getByText(
				"Select Publish changes to publish the posts with the mark.",
			),
		).toBeTruthy();
		expect(onImported).toHaveBeenCalledOnce();
		expect(importButton().getAttribute("aria-disabled")).toBe("true");
		expect(
			screen.getByText(
				"To import other files, select Done, then select Import again.",
			),
		).toBeTruthy();
	});

	it("closes on Escape when no run goes on", async () => {
		const { onOpenChange } = renderDialog();
		await userEvent.keyboard("{Escape}");
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("does not start a second run, and does not close during a run", async () => {
		const answers = holdRequests();
		const { onOpenChange } = renderDialog();
		await choose([file("a.md")]);
		await userEvent.click(importButton());
		await userEvent.click(importButton());
		await userEvent.keyboard("{Escape}");
		await userEvent.click(document.body);
		expect(importButton().getAttribute("aria-disabled")).toBe("true");
		expect(status()).toBe("Import in progress: 0 of 1 files done.");
		expect(client.importNoteOfCms).toHaveBeenCalledOnce();
		expect(onOpenChange).not.toHaveBeenCalled();
		answers[0]?.(imported(null));
		await screen.findByText("Done");
	});

	it("keeps the focus on Import when the run starts", async () => {
		const answers = holdRequests();
		renderDialog();
		await choose([file("a.md")]);
		await userEvent.click(importButton());
		expect(status()).toBe("Import in progress: 0 of 1 files done.");
		// A browser blurs a button with the native `disabled` attribute. jsdom does not,
		// so the test also checks that the attribute is absent.
		expect(importButton().hasAttribute("disabled")).toBe(false);
		expect(document.activeElement).toBe(importButton());
		answers[0]?.(imported(null));
		await screen.findByText("Done");
		expect(document.activeElement).toBe(importButton());
	});

	it("keeps the run when the width changes from a dialog to a drawer", async () => {
		const shown = window.matchMedia;
		const listeners = new Set<() => void>();
		const width = { desktop: true };
		vi.stubGlobal("matchMedia", (query: string) => ({
			matches: width.desktop && query.includes("min-width"),
			media: query,
			addEventListener: (_type: string, listener: () => void) =>
				listeners.add(listener),
			removeEventListener: (_type: string, listener: () => void) =>
				listeners.delete(listener),
		}));
		const answers = holdRequests();
		renderDialog();
		await choose([file("a.md"), file("b.md")]);
		await userEvent.click(importButton());
		act(() => {
			width.desktop = false;
			for (const listener of listeners) listener();
		});
		await waitFor(() =>
			expect(
				document.querySelector('[data-slot="drawer-popup"]'),
			).not.toBeNull(),
		);
		expect(rowOf("a.md").getByText("In progress")).toBeTruthy();
		expect(importButton().getAttribute("aria-disabled")).toBe("true");
		answers[0]?.(imported(null));
		await waitFor(() => expect(answers).toHaveLength(2));
		expect(client.importNoteOfCms).toHaveBeenCalledTimes(2);
		answers[1]?.(imported(null));
		await waitFor(() =>
			expect(status()).toBe(
				"2 imported, 0 skipped, 0 failed. 0 with the mark To publish.",
			),
		);
		vi.stubGlobal("matchMedia", shown);
	});

	it("stops at an offline file, locks the language, and continues on Import", async () => {
		client.importNoteOfCms
			.mockResolvedValueOnce(imported(null))
			.mockResolvedValueOnce(R.Error({ code: "offline" }));
		renderDialog();
		await choose([file("a.md"), file("b.md"), file("c.md")]);
		await userEvent.click(importButton());
		expect((await screen.findByRole("alert")).textContent).toContain(
			"The import stopped. Daluang cannot reach the server.",
		);
		expect(rowOf("c.md").getByText("Not sent yet")).toBeTruthy();
		await userEvent.click(screen.getByRole("button", { name: "Indonesia" }));
		client.importNoteOfCms.mockResolvedValue(imported(null));
		await userEvent.click(importButton());
		await waitFor(() =>
			expect(status()).toBe(
				"3 imported, 0 skipped, 0 failed. 0 with the mark To publish.",
			),
		);
		expect(
			client.importNoteOfCms.mock.calls.map((call) => [
				call[0].fileName,
				call[0].language,
			]),
		).toEqual([
			["a.md", "en"],
			["b.md", "en"],
			["b.md", "en"],
			["c.md", "en"],
		]);
		expect(
			screen.getByText(
				"Open each post with the label Draft, check it, then publish it.",
			),
		).toBeTruthy();
	});

	it("shows no language choice in a CMS with one language", async () => {
		client.importNoteOfCms.mockResolvedValue(imported(null));
		renderDialog({ languages: ["id"], defaultLanguage: "id" });
		expect(screen.queryByRole("group", { name: "Language" })).toBeNull();
		await choose([file("a.md")]);
		await userEvent.click(importButton());
		await screen.findByText("Done");
		expect(client.importNoteOfCms).toHaveBeenCalledWith(
			expect.objectContaining({ language: "id" }),
		);
	});
});
