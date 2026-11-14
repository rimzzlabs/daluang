// @vitest-environment jsdom
import type { Note } from "@daluang/notes/note";
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
	ResponsiveDialogTitle,
} from "@daluang/ui/components/responsive-dialog";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ImportForm } from "@/components/notes/import-posts-form";
import type { ImportRunHandle, RunState } from "@/hooks/notes/use-import-run";
import type { ImportRow, RowState } from "@/lib/notes/import-run";

const LANGUAGES = { languages: ["en", "id"], defaultLanguage: "en" };

const NOTE: Note = {
	id: "n1",
	title: "Jotai recipes",
	slug: "jotai-recipes",
	language: "en",
	description: "",
	keywords: [],
	status: "draft",
	publishedAt: null,
	updatedAt: "2026-10-18T00:00:00.000Z",
	createdAt: "2026-10-18T00:00:00.000Z",
	fields: {},
	body: "",
	published: null,
	mark: null,
};

const IMPORTED: RowState = {
	status: "imported",
	post: { note: NOTE, warnings: [] },
};

const MARKED: RowState = {
	status: "imported",
	post: { note: { ...NOTE, mark: "publish" }, warnings: [] },
};

function rows(states: readonly RowState[]): readonly ImportRow[] {
	return states.map((state, index) => ({
		file: new File([""], `${index}.md`),
		state,
	}));
}

interface FormOptions {
	run: RunState;
	rows?: readonly ImportRow[];
	languages?: typeof LANGUAGES;
}

function renderForm(options: FormOptions) {
	const importRun: ImportRunHandle = {
		rows: options.rows ?? [],
		run: options.run,
		choose: vi.fn(),
		start: vi.fn(() => Promise.resolve()),
	};
	const onLanguageChange = vi.fn();
	render(
		<ResponsiveDialog open onOpenChange={vi.fn()}>
			<ResponsiveDialogContent showCloseButton={false}>
				<ResponsiveDialogTitle>Import posts</ResponsiveDialogTitle>
				<ImportForm
					languages={options.languages ?? LANGUAGES}
					fields={[]}
					language="id"
					onLanguageChange={onLanguageChange}
					importRun={importRun}
				/>
			</ResponsiveDialogContent>
		</ResponsiveDialog>,
	);
	return { importRun, onLanguageChange };
}

function button(name: string) {
	return screen.getByRole("button", { name });
}

function disabled(element: HTMLElement) {
	return element.hasAttribute("disabled");
}

describe("ImportForm", () => {
	it("gives the chosen files and the language before a run", async () => {
		const { importRun, onLanguageChange } = renderForm({
			run: { status: "idle" },
		});
		const input = screen.getByLabelText("Markdown or MDX files");
		expect(
			screen.getByText(
				"Each file becomes a draft. The frontmatter gives the title, the dates, and the other values.",
			),
		).toBeTruthy();
		await userEvent.upload(input, [new File(["a"], "a.md")]);
		expect(importRun.choose).toHaveBeenCalledWith([expect.any(File)]);
		await userEvent.click(button("English"));
		expect(onLanguageChange).toHaveBeenCalledWith("en");
		expect(disabled(button("Import"))).toBe(true);
		expect(button("Cancel")).toBeTruthy();
		expect(screen.getByRole("status").textContent).toBe("");
	});

	it("starts the run in the language of the import", async () => {
		const { importRun } = renderForm({
			run: { status: "idle" },
			rows: rows([{ status: "waiting" }]),
		});
		await userEvent.click(button("Import"));
		expect(importRun.start).toHaveBeenCalledWith("id");
	});

	it("locks each control during a run, and tells the progress", () => {
		renderForm({
			run: { status: "running" },
			rows: rows([
				IMPORTED,
				{ status: "failed", failure: { code: "offline" } },
				{ status: "importing" },
			]),
		});
		expect(screen.getByRole("status").textContent).toBe(
			"Import in progress: 1 of 3 files done.",
		);
		expect(disabled(screen.getByLabelText("Markdown or MDX files"))).toBe(true);
		expect(disabled(button("Indonesia"))).toBe(true);
		expect(disabled(button("Done"))).toBe(true);
		expect(disabled(button("Import"))).toBe(true);
	});

	it("tells why a run stopped, and lets the writer continue", () => {
		renderForm({
			run: { status: "stopped", failure: { code: "signed-out" } },
			rows: rows([IMPORTED, { status: "waiting" }]),
		});
		expect(screen.getByRole("alert").textContent).toBe(
			"The import stopped. Your session ended. Sign in again in another tab, then select Import to continue.",
		);
		expect(screen.getByRole("status").textContent).toBe(
			"1 imported, 0 skipped, 0 failed, 1 not imported yet. 0 with the mark To publish.",
		);
		expect(disabled(button("Import"))).toBe(false);
		expect(disabled(button("Indonesia"))).toBe(true);
		expect(
			screen.getByText(
				"To import other files, select Done, then select Import again.",
			),
		).toBeTruthy();
	});

	it("gives the summary and the next steps at the end", () => {
		renderForm({ run: { status: "done" }, rows: rows([MARKED, IMPORTED]) });
		expect(screen.getByRole("status").textContent).toBe(
			"2 imported, 0 skipped, 0 failed. 1 with the mark To publish.",
		);
		expect(
			screen.getByText(
				"Select Publish changes to publish the posts with the mark.",
			),
		).toBeTruthy();
		expect(
			screen.getByText(
				"Open each post with the label Draft, check it, then publish it.",
			),
		).toBeTruthy();
		expect(disabled(button("Import"))).toBe(true);
		expect(disabled(button("Done"))).toBe(false);
	});

	it("gives no next step when no post was imported", () => {
		renderForm({
			run: { status: "done" },
			rows: rows([{ status: "skipped" }]),
		});
		expect(screen.queryByText(/Select Publish changes/)).toBeNull();
		expect(screen.queryByText(/Open each post/)).toBeNull();
	});

	it("shows no language choice in a CMS with one language", () => {
		renderForm({
			run: { status: "idle" },
			languages: { languages: ["id"], defaultLanguage: "id" },
		});
		expect(screen.queryByRole("group", { name: "Language" })).toBeNull();
	});
});
