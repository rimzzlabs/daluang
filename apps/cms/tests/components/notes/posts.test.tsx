// @vitest-environment jsdom
import { R } from "@mobily/ts-belt";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Posts } from "@/components/notes/posts";
import { createChangesStore } from "@/lib/notes/changes-store";
import { createSettingsStore } from "@/lib/settings/settings-store";
import { SETTINGS, settingsStore } from "../../settings";

const client = vi.hoisted(() => ({
	listPostsOfCms: vi.fn(),
	markNoteOfCms: vi.fn(),
	deleteNoteOfCms: vi.fn(),
	readNote: vi.fn(),
	NOTES_ERROR_MESSAGES: { offline: "Offline.", invalid: "Refused." },
}));

vi.mock("@/lib/notes/client", () => client);

const POST = {
	note: {
		id: "n1",
		title: "Jotai recipes",
		slug: "jotai-recipes",
		language: "en",
		status: "draft",
		publishedAt: null,
		updatedAt: "2026-10-18T12:00:00.000Z",
		mark: "publish",
	},
	change: "publish",
};

beforeEach(() => {
	client.listPostsOfCms.mockReset();
	client.markNoteOfCms.mockReset();
	client.deleteNoteOfCms.mockReset();
	client.readNote.mockReset();
});

describe("Posts", () => {
	it("lists the posts, and gives the navbar the number of changes", async () => {
		client.listPostsOfCms.mockResolvedValue(R.Ok({ posts: [POST], count: 3 }));
		const changes = createChangesStore(0);
		render(
			<Posts settings={settingsStore()} changes={changes} linkKind="anchor" />,
		);
		expect(screen.getByRole("status").textContent).toBe("Loading the posts");
		expect(await screen.findByText("Jotai recipes")).toBeTruthy();
		expect(screen.getByText("To publish")).toBeTruthy();
		expect(changes.read()).toBe(3);
		expect(
			screen.getByRole("link", { name: "New post" }).getAttribute("href"),
		).toBe("/posts/new");
	});

	it("shows the steps to set up a site when no post exists", async () => {
		client.listPostsOfCms.mockResolvedValue(R.Ok({ posts: [], count: 0 }));
		render(
			<Posts
				settings={settingsStore()}
				changes={createChangesStore(0)}
				linkKind="anchor"
			/>,
		);
		expect(
			await screen.findByRole("heading", { name: "No posts yet" }),
		).toBeTruthy();
	});

	it("shows the message of a failed list, and tries again", async () => {
		client.listPostsOfCms
			.mockResolvedValueOnce(R.Error("offline"))
			.mockResolvedValueOnce(R.Ok({ posts: [POST], count: 1 }));
		render(
			<Posts
				settings={settingsStore()}
				changes={createChangesStore(0)}
				linkKind="anchor"
			/>,
		);
		expect((await screen.findByRole("alert")).textContent).toContain(
			"Offline.",
		);
		await userEvent.click(screen.getByRole("button", { name: "Try again" }));
		expect(await screen.findByText("Jotai recipes")).toBeTruthy();
	});

	it("shows the posts of the chosen language", async () => {
		const other = {
			...POST,
			note: { ...POST.note, id: "n2", title: "Resep Jotai", language: "id" },
		};
		client.listPostsOfCms.mockResolvedValue(
			R.Ok({ posts: [POST, other], count: 1 }),
		);
		render(
			<Posts
				settings={settingsStore()}
				changes={createChangesStore(0)}
				linkKind="anchor"
			/>,
		);
		await userEvent.click(
			await screen.findByRole("button", { name: "Indonesia" }),
		);
		expect(screen.queryByText("Jotai recipes")).toBeNull();
		expect(screen.getByText("Resep Jotai")).toBeTruthy();
	});

	it("tells when the chosen language has no post", async () => {
		client.listPostsOfCms.mockResolvedValue(R.Ok({ posts: [POST], count: 1 }));
		render(
			<Posts
				settings={settingsStore()}
				changes={createChangesStore(0)}
				linkKind="anchor"
			/>,
		);
		await userEvent.click(
			await screen.findByRole("button", { name: "Indonesia" }),
		);
		expect(screen.getByText("No posts in this language")).toBeTruthy();
	});

	it("has no filter in a CMS with one language", async () => {
		client.listPostsOfCms.mockResolvedValue(R.Ok({ posts: [POST], count: 1 }));
		const settings = createSettingsStore({
			...SETTINGS,
			languages: { languages: ["en"], defaultLanguage: "en" },
		});
		render(
			<Posts
				settings={settings}
				changes={createChangesStore(0)}
				linkKind="anchor"
			/>,
		);
		expect(await screen.findByText("Jotai recipes")).toBeTruthy();
		expect(screen.queryByRole("group", { name: "Language" })).toBeNull();
		expect(screen.queryByRole("button", { name: "All" })).toBeNull();
	});

	it("marks a post, then reads the list again", async () => {
		const draft = { ...POST, change: null };
		client.listPostsOfCms
			.mockResolvedValueOnce(R.Ok({ posts: [draft], count: 0 }))
			.mockResolvedValueOnce(R.Ok({ posts: [POST], count: 1 }));
		client.markNoteOfCms.mockResolvedValue(R.Ok(POST.note));
		const changes = createChangesStore(0);
		render(
			<Posts settings={settingsStore()} changes={changes} linkKind="anchor" />,
		);
		await userEvent.click(
			await screen.findByRole("button", { name: "Actions of Jotai recipes" }),
		);
		await userEvent.click(
			await screen.findByRole("menuitem", { name: "Publish" }),
		);
		expect(client.markNoteOfCms).toHaveBeenCalledWith({
			id: "n1",
			action: "publish",
		});
		expect(await screen.findByText("To publish")).toBeTruthy();
		expect(changes.read()).toBe(1);
	});

	it("shows the message of a failed mark, and keeps the list", async () => {
		client.listPostsOfCms.mockResolvedValue(R.Ok({ posts: [POST], count: 1 }));
		client.markNoteOfCms.mockResolvedValue(R.Error("offline"));
		render(
			<Posts
				settings={settingsStore()}
				changes={createChangesStore(0)}
				linkKind="anchor"
			/>,
		);
		await userEvent.click(
			await screen.findByRole("button", { name: "Actions of Jotai recipes" }),
		);
		await userEvent.click(
			await screen.findByRole("menuitem", { name: "Cancel the change" }),
		);
		expect((await screen.findByRole("alert")).textContent).toBe("Offline.");
		expect(screen.getByText("Jotai recipes")).toBeTruthy();
		expect(client.listPostsOfCms).toHaveBeenCalledOnce();
	});

	it("deletes a post after a confirmation, then reads the list again", async () => {
		client.listPostsOfCms
			.mockResolvedValueOnce(R.Ok({ posts: [POST], count: 1 }))
			.mockResolvedValueOnce(R.Ok({ posts: [], count: 0 }));
		client.deleteNoteOfCms.mockResolvedValue(R.Ok(true));
		render(
			<Posts
				settings={settingsStore()}
				changes={createChangesStore(0)}
				linkKind="anchor"
			/>,
		);
		await userEvent.click(
			await screen.findByRole("button", { name: "Actions of Jotai recipes" }),
		);
		await userEvent.click(
			await screen.findByRole("menuitem", { name: "Delete" }),
		);
		await userEvent.click(
			await screen.findByRole("button", { name: "Delete the post" }),
		);
		expect(client.deleteNoteOfCms).toHaveBeenCalledWith("n1");
		expect(
			await screen.findByRole("heading", { name: "No posts yet" }),
		).toBeTruthy();
	});

	describe("a publish that the server refuses", () => {
		const DRAFT = { ...POST, change: null };
		const NOTE = {
			...POST.note,
			description: "Small recipes.",
			keywords: [],
			fields: { series: " " },
			body: "",
		};
		const store = () =>
			createSettingsStore({
				...SETTINGS,
				fields: [
					{ name: "series", label: "Series", type: "text", required: true },
				],
			});

		async function publishFromMenu(action: string) {
			client.listPostsOfCms.mockResolvedValue(
				R.Ok({ posts: [DRAFT], count: 0 }),
			);
			render(
				<Posts
					settings={store()}
					changes={createChangesStore(0)}
					linkKind="anchor"
				/>,
			);
			await userEvent.click(
				await screen.findByRole("button", { name: "Actions of Jotai recipes" }),
			);
			await userEvent.click(
				await screen.findByRole("menuitem", { name: action }),
			);
		}

		it("names the post and each field, and links to the post", async () => {
			client.markNoteOfCms.mockResolvedValue(R.Error("invalid"));
			client.readNote.mockResolvedValue(R.Ok(NOTE));
			await publishFromMenu("Publish");
			const alert = await screen.findByRole("alert");
			expect(alert.textContent).toBe(
				'Daluang cannot publish "Jotai recipes". Correct each field in this list: Series. Open the post',
			);
			expect(
				screen
					.getByRole("link", { name: "Open the post" })
					.getAttribute("href"),
			).toBe("/posts/n1");
		});

		it("shows the generic message when the post cannot be read", async () => {
			client.markNoteOfCms.mockResolvedValue(R.Error("invalid"));
			client.readNote.mockResolvedValue(R.Error("offline"));
			await publishFromMenu("Publish");
			expect((await screen.findByRole("alert")).textContent).toBe("Refused.");
			expect(client.readNote).toHaveBeenCalledWith("n1");
		});

		it("shows the generic message when no field blocks the post", async () => {
			client.markNoteOfCms.mockResolvedValue(R.Error("invalid"));
			client.readNote.mockResolvedValue(
				R.Ok({ ...NOTE, fields: { series: "Jotai" } }),
			);
			await publishFromMenu("Publish");
			expect((await screen.findByRole("alert")).textContent).toBe("Refused.");
			expect(client.readNote).toHaveBeenCalledWith("n1");
		});

		it("keeps the generic message for an action that is not a publish", async () => {
			client.listPostsOfCms.mockResolvedValue(
				R.Ok({ posts: [POST], count: 1 }),
			);
			client.markNoteOfCms.mockResolvedValue(R.Error("invalid"));
			render(
				<Posts
					settings={store()}
					changes={createChangesStore(0)}
					linkKind="anchor"
				/>,
			);
			await userEvent.click(
				await screen.findByRole("button", { name: "Actions of Jotai recipes" }),
			);
			await userEvent.click(
				await screen.findByRole("menuitem", { name: "Cancel the change" }),
			);
			expect((await screen.findByRole("alert")).textContent).toBe("Refused.");
			expect(client.readNote).not.toHaveBeenCalled();
		});

		async function choose(name: string) {
			await userEvent.click(
				await screen.findByRole("button", { name: "Actions of Jotai recipes" }),
			);
			await userEvent.click(await screen.findByRole("menuitem", { name }));
		}

		function renderPosts() {
			render(
				<Posts
					settings={store()}
					changes={createChangesStore(0)}
					linkKind="anchor"
				/>,
			);
		}

		it("clears the alert when a later action succeeds", async () => {
			client.listPostsOfCms.mockResolvedValue(
				R.Ok({ posts: [POST], count: 1 }),
			);
			client.markNoteOfCms
				.mockResolvedValueOnce(R.Error("invalid"))
				.mockResolvedValueOnce(R.Ok(POST.note));
			renderPosts();
			await choose("Cancel the change");
			expect((await screen.findByRole("alert")).textContent).toBe("Refused.");
			await choose("Cancel the change");
			await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
		});

		it("ignores the alert of an older action", async () => {
			client.listPostsOfCms.mockResolvedValue(
				R.Ok({ posts: [DRAFT], count: 0 }),
			);
			client.markNoteOfCms
				.mockResolvedValueOnce(R.Error("invalid"))
				.mockResolvedValueOnce(R.Ok(POST.note));
			let release: (value: unknown) => void = () => {};
			client.readNote.mockReturnValue(
				new Promise((resolve) => {
					release = resolve;
				}),
			);
			renderPosts();
			await choose("Publish");
			await waitFor(() => expect(client.readNote).toHaveBeenCalledOnce());
			await choose("Publish");
			await waitFor(() =>
				expect(client.listPostsOfCms).toHaveBeenCalledTimes(2),
			);
			release(R.Ok(NOTE));
			await new Promise((resolve) => setTimeout(resolve, 20));
			expect(screen.queryByRole("alert")).toBeNull();
		});
	});
});
