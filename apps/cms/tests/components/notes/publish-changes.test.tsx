// @vitest-environment jsdom
import { R } from "@mobily/ts-belt";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PublishChanges } from "@/components/notes/publish-changes";
import { createChangesStore } from "@/lib/notes/changes-store";

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
		expect(client.publishChanges).toHaveBeenCalledOnce();
		expect(store.read()).toBe(0);
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
});
