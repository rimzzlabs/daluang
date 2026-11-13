// @vitest-environment jsdom
import { R } from "@mobily/ts-belt";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	OPEN_POST_MESSAGES,
	PublishChanges,
} from "@/components/notes/publish-changes";
import { createChangesStore } from "@/lib/notes/changes-store";
import type { AutosaveOutcome } from "@/lib/notes/client";

const client = vi.hoisted(() => ({
	listChangesOfCms: vi.fn(),
	publishChanges: vi.fn(),
	NOTES_ERROR_MESSAGES: { offline: "Offline.", server: "Server." },
}));

vi.mock("@/lib/notes/client", () => client);

function summary(id: string, title: string) {
	return {
		id,
		title,
		slug: id,
		language: "en",
		status: "draft",
		publishedAt: null,
		updatedAt: "2026-10-18T00:00:00.000Z",
		mark: null,
	};
}

const LIST = {
	count: 2,
	changes: [
		{ note: summary("n1", "Jotai recipes"), change: "publish" },
		{ note: summary("n2", "Old post"), change: "delete" },
	],
};

beforeEach(() => {
	client.listChangesOfCms.mockReset();
	client.publishChanges.mockReset();
});

async function openAndPublish() {
	await userEvent.click(
		screen.getByRole("button", { name: /Publish changes/ }),
	);
	await screen.findByText("Jotai recipes");
	await userEvent.click(
		within(screen.getByRole("dialog")).getByRole("button", {
			name: "Publish changes",
		}),
	);
}

describe("PublishChanges", () => {
	it("shows nothing when no change waits", () => {
		const { container } = render(
			<PublishChanges changes={createChangesStore(0)} />,
		);
		expect(container.innerHTML).toBe("");
	});

	it("lists the changes, publishes them, and hides the button", async () => {
		client.listChangesOfCms.mockResolvedValue(R.Ok(LIST));
		client.publishChanges.mockResolvedValue(R.Ok(2));
		const store = createChangesStore(2);
		render(<PublishChanges changes={store} />);
		await userEvent.click(
			screen.getByRole("button", { name: /Publish changes/ }),
		);
		expect(
			await screen.findByRole("heading", { name: "Publish 2 changes?" }),
		).toBeTruthy();
		expect(screen.getByText("Jotai recipes")).toBeTruthy();
		expect(screen.getByText("To publish")).toBeTruthy();
		expect(screen.getByText("To delete")).toBeTruthy();
		await userEvent.click(
			within(screen.getByRole("dialog")).getByRole("button", {
				name: "Publish changes",
			}),
		);
		// With no open post, the dialog reads the list one time and publishes.
		expect(client.listChangesOfCms).toHaveBeenCalledOnce();
		expect(client.publishChanges).toHaveBeenCalledOnce();
		expect(store.read()).toBe(0);
		expect(store.readPublished()).toBe(1);
		expect(
			screen.queryByRole("button", { name: /Publish changes/ }),
		).toBeNull();
	});

	it("shows the message of a failed publish, and keeps the count", async () => {
		client.listChangesOfCms.mockResolvedValue(R.Ok(LIST));
		client.publishChanges.mockResolvedValue(R.Error("offline"));
		const store = createChangesStore(2);
		render(<PublishChanges changes={store} />);
		await userEvent.click(
			screen.getByRole("button", { name: /Publish changes/ }),
		);
		await screen.findByText("Jotai recipes");
		await userEvent.click(
			within(screen.getByRole("dialog")).getByRole("button", {
				name: "Publish changes",
			}),
		);
		expect(await screen.findByRole("alert")).toHaveProperty(
			"textContent",
			"Offline.",
		);
		expect(store.read()).toBe(2);
	});

	it("shows the message of a list that does not load", async () => {
		client.listChangesOfCms.mockResolvedValue(R.Error("server"));
		render(<PublishChanges changes={createChangesStore(1)} />);
		await userEvent.click(
			screen.getByRole("button", { name: /Publish changes/ }),
		);
		expect(await screen.findByRole("alert")).toHaveProperty(
			"textContent",
			"Server.",
		);
	});

	it("saves the open post before it lists and before it publishes", async () => {
		const order: string[] = [];
		client.listChangesOfCms.mockImplementation(() => {
			order.push("list");
			return Promise.resolve(R.Ok(LIST));
		});
		client.publishChanges.mockImplementation(() => {
			order.push("publish");
			return Promise.resolve(R.Ok(2));
		});
		const store = createChangesStore(2);
		store.registerOpenPost(() => {
			order.push("save");
			return Promise.resolve<AutosaveOutcome>("saved");
		});
		render(<PublishChanges changes={store} />);
		await openAndPublish();
		await waitFor(() => expect(store.readPublished()).toBe(1));
		expect(order).toEqual(["save", "list", "save", "publish"]);
	});

	it("does not publish after a failed save of the open post", async () => {
		client.listChangesOfCms.mockResolvedValue(R.Ok(LIST));
		const store = createChangesStore(2);
		const save = vi
			.fn<() => Promise<AutosaveOutcome>>()
			.mockResolvedValueOnce("saved")
			.mockResolvedValueOnce("failed");
		store.registerOpenPost(save);
		render(<PublishChanges changes={store} />);
		await openAndPublish();
		expect(await screen.findByRole("alert")).toHaveProperty(
			"textContent",
			OPEN_POST_MESSAGES.failed,
		);
		expect(client.publishChanges).not.toHaveBeenCalled();
		expect(store.read()).toBe(2);
		expect(store.readPublished()).toBe(0);
	});

	it("shows the list with the message of a refused save of the open post", async () => {
		client.listChangesOfCms.mockResolvedValue(R.Ok(LIST));
		const store = createChangesStore(2);
		store.registerOpenPost(() => Promise.resolve<AutosaveOutcome>("refused"));
		render(<PublishChanges changes={store} />);
		await userEvent.click(
			screen.getByRole("button", { name: /Publish changes/ }),
		);
		expect(await screen.findByText("Jotai recipes")).toBeTruthy();
		expect(screen.getByRole("alert").textContent).toBe(
			OPEN_POST_MESSAGES.refused,
		);
	});

	it("reads the list again after the open post saves, and publishes only after a second click", async () => {
		const later = {
			count: 3,
			changes: [
				...LIST.changes,
				{ note: summary("n3", "Open post"), change: "edit" },
			],
		};
		client.listChangesOfCms
			.mockResolvedValueOnce(R.Ok(LIST))
			.mockResolvedValueOnce(R.Ok(later));
		client.publishChanges.mockResolvedValue(R.Ok(3));
		const store = createChangesStore(2);
		const save = vi
			.fn<() => Promise<AutosaveOutcome>>()
			.mockResolvedValueOnce("failed")
			.mockResolvedValue("saved");
		store.registerOpenPost(save);
		render(<PublishChanges changes={store} />);
		await openAndPublish();
		expect(await screen.findByText("Open post")).toBeTruthy();
		expect(screen.queryByRole("alert")).toBeNull();
		expect(client.publishChanges).not.toHaveBeenCalled();
		expect(store.read()).toBe(3);
		await userEvent.click(
			within(screen.getByRole("dialog")).getByRole("button", {
				name: "Publish changes",
			}),
		);
		await waitFor(() => expect(store.readPublished()).toBe(1));
		expect(client.publishChanges).toHaveBeenCalledOnce();
	});

	it("does not publish when the list did not load after a failed save", async () => {
		client.listChangesOfCms
			.mockResolvedValueOnce(R.Error("offline"))
			.mockResolvedValue(R.Ok(LIST));
		const store = createChangesStore(2);
		const save = vi
			.fn<() => Promise<AutosaveOutcome>>()
			.mockResolvedValueOnce("failed")
			.mockResolvedValue("saved");
		store.registerOpenPost(save);
		render(<PublishChanges changes={store} />);
		await userEvent.click(
			screen.getByRole("button", { name: /Publish changes/ }),
		);
		expect((await screen.findByRole("alert")).textContent).toBe("Offline.");
		await userEvent.click(
			within(screen.getByRole("dialog")).getByRole("button", {
				name: "Publish changes",
			}),
		);
		expect(await screen.findByText("Jotai recipes")).toBeTruthy();
		expect(client.listChangesOfCms).toHaveBeenCalledTimes(2);
		expect(client.publishChanges).not.toHaveBeenCalled();
	});
});
