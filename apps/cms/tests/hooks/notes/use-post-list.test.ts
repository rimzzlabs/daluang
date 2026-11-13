// @vitest-environment jsdom
import { R } from "@mobily/ts-belt";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePostList } from "@/hooks/notes/use-post-list";
import { createChangesStore } from "@/lib/notes/changes-store";

const client = vi.hoisted(() => ({ listPostsOfCms: vi.fn() }));

vi.mock("@/lib/notes/client", () => client);

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
});
