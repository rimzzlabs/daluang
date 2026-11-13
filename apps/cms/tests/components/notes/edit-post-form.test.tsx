// @vitest-environment jsdom
import type { Note } from "@daluang/notes/note";
import { R } from "@mobily/ts-belt";
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	RouterProvider,
} from "@tanstack/react-router";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EditPostForm } from "@/components/notes/edit-post-form";
import {
	AUTOSAVE_DELAY_MS,
	AUTOSAVE_RETRY_MS,
} from "@/hooks/notes/use-autosave";
import { createChangesStore } from "@/lib/notes/changes-store";
import { settingsStore } from "../../settings";
import { typeInEditor } from "./editor";

const client = vi.hoisted(() => ({
	saveNote: vi.fn(),
	refreshChangeCount: vi.fn(),
	NOTES_ERROR_MESSAGES: { "slug-taken": "Slug taken." },
	SAVE_ERROR_OUTCOMES: {
		"slug-taken": "refused",
		"signed-out": "failed",
		offline: "failed",
		server: "failed",
	},
}));

vi.mock("@/lib/notes/client", () => client);

const NOTE: Note = {
	id: "n1",
	title: "Jotai recipes",
	slug: "jotai",
	language: "en",
	description: "",
	keywords: ["react"],
	status: "published",
	publishedAt: "2026-10-18T12:00:00.000Z",
	updatedAt: "2026-10-18T12:00:00.000Z",
	createdAt: "2026-10-18T12:00:00.000Z",
	fields: {},
	body: "# Jotai",
	published: null,
	mark: null,
};

beforeEach(() => {
	client.saveNote.mockReset();
	client.refreshChangeCount.mockReset();
});

function renderForm(onSaved = vi.fn()) {
	const changes = createChangesStore(0);
	render(
		<EditPostForm
			note={NOTE}
			settings={settingsStore()}
			changes={changes}
			linkKind="anchor"
			onSaved={onSaved}
		/>,
	);
	return { changes, onSaved };
}

/** The form in the app island: a router with the page of the post and the list. */
function renderFormInRouter() {
	const rootRoute = createRootRoute({ component: () => <Outlet /> });
	const postRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "/posts/$id",
		component: () => (
			<EditPostForm
				note={NOTE}
				settings={settingsStore()}
				changes={createChangesStore(0)}
				linkKind="router"
				onSaved={vi.fn()}
			/>
		),
	});
	const postsRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "/posts",
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([postRoute, postsRoute]),
		history: createMemoryHistory({ initialEntries: ["/posts/n1"] }),
	});
	render(<RouterProvider router={router} />);
	return router;
}

async function leaveByLink() {
	await userEvent.click(
		screen.getByRole("link", { name: "Back to the posts" }),
	);
}

describe("EditPostForm", () => {
	it("saves at Mod-S, then reads the number of changes again", async () => {
		const saved = { ...NOTE, title: "Jotai" };
		client.saveNote.mockResolvedValue(R.Ok(saved));
		const { changes, onSaved } = renderForm();
		const title = screen.getByDisplayValue("Jotai recipes");
		// One change, not one change for each key: on a busy computer, a gap between two keys
		// can pass the wait of the autosave, and an early save would send a part of the title.
		fireEvent.change(title, { target: { value: "Jotai" } });
		expect(screen.getByRole("status").textContent).toBe("Not saved yet");
		await userEvent.type(title, "{Control>}s{/Control}");
		expect(client.saveNote).toHaveBeenCalledExactlyOnceWith({
			id: "n1",
			draft: {
				title: "Jotai",
				slug: "jotai",
				language: "en",
				description: "",
				keywords: ["react"],
				fields: {},
				body: "# Jotai",
			},
		});
		await waitFor(() =>
			expect(screen.getByRole("status").textContent).toBe("Saved"),
		);
		expect(onSaved).toHaveBeenCalledWith(saved);
		expect(client.refreshChangeCount).toHaveBeenCalledWith(changes);
	});

	it("saves by itself after the writer stops", async () => {
		client.saveNote.mockResolvedValue(R.Ok(NOTE));
		renderForm();
		await userEvent.type(screen.getByDisplayValue("Jotai recipes"), "!");
		expect(client.saveNote).not.toHaveBeenCalled();
		await waitFor(() => expect(client.saveNote).toHaveBeenCalledOnce(), {
			timeout: 3000,
		});
	});

	it("shows the message of a refused save", async () => {
		client.saveNote.mockResolvedValue(R.Error("slug-taken"));
		renderForm();
		await userEvent.type(
			screen.getByDisplayValue("Jotai recipes"),
			"!{Control>}s{/Control}",
		);
		expect((await screen.findByRole("alert")).textContent).toBe("Slug taken.");
	});

	it.each([
		[
			"offline",
			"Not saved: Daluang could not reach the server. Daluang tries again in 5 seconds.",
		],
		[
			"server",
			"Not saved: the server could not save the post. Daluang tries again in 5 seconds.",
		],
		[
			"signed-out",
			"Not saved: your session ended. Sign in again in another tab. The text stays on this page, and Daluang tries again in 5 seconds.",
		],
	])(
		"tells the writer that Daluang tries again after %s",
		async (error, message) => {
			client.saveNote.mockResolvedValue(R.Error(error));
			renderForm();
			await userEvent.type(
				screen.getByDisplayValue("Jotai recipes"),
				"!{Control>}s{/Control}",
			);
			expect((await screen.findByRole("alert")).textContent).toBe(message);
		},
	);

	it("shows the errors of the form, and saves nothing", async () => {
		renderForm();
		const title = screen.getByDisplayValue("Jotai recipes");
		await userEvent.clear(title);
		await userEvent.type(title, "{Control>}s{/Control}");
		expect(screen.getByText("Give the post a title.")).toBeTruthy();
		expect(screen.getByRole("status").textContent).toBe(
			"Not saved: correct the marked values",
		);
		expect(client.saveNote).not.toHaveBeenCalled();
	});

	it("shows the error of a long keyword at the keywords input, and saves nothing", async () => {
		renderForm();
		const keywords = screen.getByDisplayValue("react");
		await userEvent.clear(keywords);
		await userEvent.type(keywords, `${"k".repeat(61)}{Control>}s{/Control}`);
		expect(
			screen.getByText("Keep each keyword at 60 characters or fewer."),
		).toBeTruthy();
		expect(screen.getByRole("status").textContent).toBe(
			"Not saved: correct the marked values",
		);
		expect(client.saveNote).not.toHaveBeenCalled();
	});

	it("asks in the app island before it leaves a form that is not valid", async () => {
		const router = renderFormInRouter();
		const title = await screen.findByDisplayValue("Jotai recipes");
		await userEvent.clear(title);
		await userEvent.type(title, "{Control>}s{/Control}");
		await leaveByLink();
		await userEvent.click(
			await screen.findByRole("button", { name: "Cancel" }),
		);
		await waitFor(() =>
			expect(
				screen.queryByRole("heading", { name: "Leave the post?" }),
			).toBeNull(),
		);
		expect(router.state.location.pathname).toBe("/posts/n1");
		expect(screen.getByRole("textbox", { name: "Title" })).toHaveProperty(
			"value",
			"",
		);
		expect(client.saveNote).not.toHaveBeenCalled();
	});

	it("asks before it leaves a form that is not valid and waits for its save", async () => {
		renderFormInRouter();
		const title = await screen.findByDisplayValue("Jotai recipes");
		await userEvent.clear(title);
		await userEvent.type(title, "{Control>}s{/Control}");
		await typeInEditor("Body", "!");
		expect(screen.getByRole("status").textContent).toBe("Not saved yet");
		await leaveByLink();
		expect(
			await screen.findByRole("heading", { name: "Leave the post?" }),
		).toBeTruthy();
	});

	it("leaves after a failed save at the confirmation, and sends the form one last time", async () => {
		client.saveNote.mockResolvedValue(R.Error("offline"));
		const router = renderFormInRouter();
		await userEvent.type(
			await screen.findByDisplayValue("Jotai recipes"),
			"!{Control>}s{/Control}",
		);
		await screen.findByRole("alert");
		expect(client.saveNote).toHaveBeenCalledOnce();
		await leaveByLink();
		await userEvent.click(
			await screen.findByRole("button", { name: "Leave the page" }),
		);
		await waitFor(() => expect(router.state.location.pathname).toBe("/posts"));
		expect(client.saveNote).toHaveBeenCalledTimes(2);
	});

	it("links back to the list of posts", () => {
		renderForm();
		expect(
			screen
				.getByRole("link", { name: "Back to the posts" })
				.getAttribute("href"),
		).toBe("/posts");
	});

	it("shows the details in a panel on a wide screen", () => {
		renderForm();
		const panel = screen.getByRole("complementary", { name: "Details" });
		expect(panel.querySelector("input")?.value).toBe("Jotai recipes");
		expect(screen.queryByRole("button", { name: "Details" })).toBeNull();
	});
});

describe("EditPostForm with fake timers", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	function status(): string | null {
		return screen.getByRole("status").textContent;
	}

	function saveNow() {
		fireEvent.keyDown(window, { key: "s", ctrlKey: true });
	}

	it("shows Saved only after the save of the last change", async () => {
		const first = Promise.withResolvers<R.Result<Note, string>>();
		client.saveNote
			.mockReturnValueOnce(first.promise)
			.mockResolvedValue(R.Ok(NOTE));
		renderForm();
		const title = screen.getByDisplayValue("Jotai recipes");
		fireEvent.change(title, { target: { value: "Jotai" } });
		saveNow();
		expect(status()).toBe("Saving");
		fireEvent.change(title, { target: { value: "Jotai!" } });
		await act(async () => first.resolve(R.Ok(NOTE)));
		expect(status()).toBe("Not saved yet");
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));
		expect(status()).toBe("Saved");
		expect(client.saveNote).toHaveBeenCalledTimes(2);
		expect(client.saveNote).toHaveBeenLastCalledWith(
			expect.objectContaining({
				draft: expect.objectContaining({ title: "Jotai!" }),
			}),
		);
	});

	it("shows Saved again after the retry of a failed save", async () => {
		client.saveNote
			.mockResolvedValueOnce(R.Error("offline"))
			.mockResolvedValue(R.Ok(NOTE));
		renderForm();
		fireEvent.change(screen.getByDisplayValue("Jotai recipes"), {
			target: { value: "Jotai" },
		});
		await act(async () => saveNow());
		expect(screen.getByRole("alert").textContent).toBe(
			"Not saved: Daluang could not reach the server. Daluang tries again in 5 seconds.",
		);
		await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_RETRY_MS));
		expect(client.saveNote).toHaveBeenCalledTimes(2);
		expect(status()).toBe("Saved");
	});
});

describe("EditPostForm on a smaller screen", () => {
	beforeEach(() => {
		vi.stubGlobal("matchMedia", (query: string) => ({
			matches: !query.includes("80rem"),
			media: query,
			addEventListener: () => {},
			removeEventListener: () => {},
		}));
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.stubGlobal("matchMedia", (query: string) => ({
			matches: query.includes("min-width"),
			media: query,
			addEventListener: () => {},
			removeEventListener: () => {},
		}));
	});

	it("opens the details in a sheet, and counts their errors", async () => {
		renderForm();
		expect(screen.queryByRole("complementary", { name: "Details" })).toBeNull();
		await userEvent.click(screen.getByRole("button", { name: "Details" }));
		const sheet = await screen.findByRole("dialog", { name: "Details" });
		const title = within(sheet).getByDisplayValue("Jotai recipes");
		await userEvent.clear(title);
		await userEvent.type(title, "{Control>}s{/Control}");
		await userEvent.keyboard("{Escape}");
		expect(
			await screen.findByRole("button", { name: "Details 1 error" }),
		).toBeTruthy();
		expect(client.saveNote).not.toHaveBeenCalled();
	});
});
