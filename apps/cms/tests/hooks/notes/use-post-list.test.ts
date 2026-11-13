// @vitest-environment jsdom
import { R } from "@mobily/ts-belt";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePostList } from "@/hooks/notes/use-post-list";
import { createChangesStore } from "@/lib/notes/changes-store";

const client = vi.hoisted(() => ({ listPostsOfCms: vi.fn() }));

vi.mock("@/lib/notes/client", () => client);

const POST = {
	id: "n1",
	title: "Jotai recipes",
	slug: "jotai",
	language: "en",
	status: "draft",
	publishedAt: null,
	updatedAt: "2026-10-18T00:00:00.000Z",
	mark: null,
	change: null,
};

beforeEach(() => {
	client.listPostsOfCms.mockReset();
});

describe("usePostList", () => {
	it("reads the posts and gives the navbar the number of changes", async () => {
		client.listPostsOfCms.mockResolvedValue(R.Ok({ posts: [], count: 4 }));
		const changes = createChangesStore(0);
		const { result } = renderHook(() => usePostList(changes));
		expect(result.current.list.status).toBe("loading");
		await waitFor(() =>
			expect(result.current.list).toEqual({ status: "ready", posts: [] }),
		);
		expect(changes.read()).toBe(4);
	});

	it("gives the error, and reads again on retry and on reload", async () => {
		client.listPostsOfCms.mockResolvedValue(R.Error("offline"));
		const changes = createChangesStore(0);
		const { result } = renderHook(() => usePostList(changes));
		await waitFor(() =>
			expect(result.current.list).toEqual({
				status: "failed",
				error: "offline",
			}),
		);
		client.listPostsOfCms.mockResolvedValue(R.Ok({ posts: [], count: 0 }));
		await act(() => result.current.retry());
		expect(result.current.list.status).toBe("ready");
		const calls = client.listPostsOfCms.mock.calls.length;
		await act(() => result.current.reload());
		expect(client.listPostsOfCms).toHaveBeenCalledTimes(calls + 1);
	});

	it("keeps no answer that comes after the component closes", async () => {
		const answer = Promise.withResolvers<unknown>();
		client.listPostsOfCms.mockReturnValue(answer.promise);
		const changes = createChangesStore(0);
		const { result, unmount } = renderHook(() => usePostList(changes));
		unmount();
		answer.resolve(R.Ok({ posts: [], count: 2 }));
		await answer.promise;
		expect(result.current.list.status).toBe("loading");
	});

	it("reads the posts one time when it opens, and again after Publish changes", async () => {
		client.listPostsOfCms.mockResolvedValueOnce(R.Ok({ posts: [], count: 2 }));
		const changes = createChangesStore(0);
		const { result } = renderHook(() => usePostList(changes));
		await waitFor(() => expect(result.current.list.status).toBe("ready"));
		expect(client.listPostsOfCms).toHaveBeenCalledOnce();
		const second = Promise.withResolvers<unknown>();
		client.listPostsOfCms.mockReturnValueOnce(second.promise);
		act(() => changes.markPublished());
		expect(client.listPostsOfCms).toHaveBeenCalledTimes(2);
		// The list stays on the page while the hook reads it again.
		expect(result.current.list.status).toBe("ready");
		await act(async () => second.resolve(R.Ok({ posts: [], count: 1 })));
		expect(changes.read()).toBe(1);
	});

	it("keeps the answer of the last read when an older answer comes last", async () => {
		client.listPostsOfCms.mockResolvedValueOnce(R.Ok({ posts: [], count: 0 }));
		const changes = createChangesStore(0);
		const { result } = renderHook(() => usePostList(changes));
		await waitFor(() => expect(result.current.list.status).toBe("ready"));
		const older = Promise.withResolvers<unknown>();
		client.listPostsOfCms
			.mockReturnValueOnce(older.promise)
			.mockResolvedValueOnce(R.Ok({ posts: [POST], count: 1 }));
		act(() => changes.markPublished());
		await act(() => result.current.reload());
		await act(async () => older.resolve(R.Ok({ posts: [], count: 0 })));
		expect(result.current.list).toEqual({ status: "ready", posts: [POST] });
		expect(changes.read()).toBe(1);
	});

	it("keeps the list when the read after Publish changes fails", async () => {
		client.listPostsOfCms.mockResolvedValueOnce(
			R.Ok({ posts: [POST], count: 1 }),
		);
		const changes = createChangesStore(0);
		const { result } = renderHook(() => usePostList(changes));
		await waitFor(() => expect(result.current.list.status).toBe("ready"));
		const failed = Promise.withResolvers<unknown>();
		client.listPostsOfCms.mockReturnValueOnce(failed.promise);
		act(() => changes.markPublished());
		await act(async () => failed.resolve(R.Error("offline")));
		expect(result.current.list).toEqual({ status: "ready", posts: [POST] });
	});
});
