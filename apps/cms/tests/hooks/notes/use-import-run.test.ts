// @vitest-environment jsdom
import { R } from "@mobily/ts-belt";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useImportRun } from "@/hooks/notes/use-import-run";

const client = vi.hoisted(() => ({ importNoteOfCms: vi.fn() }));
vi.mock("@/lib/notes/client", () => client);

const POST = { note: { id: "n1", mark: null }, warnings: [] };

function files() {
	return [new File(["a"], "b.md"), new File(["a"], "a.md")];
}

function renderRun(onImported = vi.fn(() => Promise.resolve())) {
	return { ...renderHook(() => useImportRun(onImported)), onImported };
}

function sentNames() {
	return client.importNoteOfCms.mock.calls.map((call) => call[0].fileName);
}

beforeEach(() => {
	client.importNoteOfCms.mockReset();
});

describe("useImportRun", () => {
	it("imports the chosen files, then reads the posts again", async () => {
		client.importNoteOfCms.mockResolvedValue(R.Ok(POST));
		const { result, onImported } = renderRun();
		act(() => result.current.choose(files()));
		await act(() => result.current.start("id"));
		expect(result.current.run).toEqual({ status: "done" });
		expect(result.current.rows.map((row) => row.state.status)).toEqual([
			"imported",
			"imported",
		]);
		expect(onImported).toHaveBeenCalledOnce();
	});

	it("starts one run only, also after a second start during the run", async () => {
		client.importNoteOfCms.mockResolvedValue(R.Ok(POST));
		const { result } = renderRun();
		act(() => result.current.choose(files()));
		await act(() =>
			Promise.all([result.current.start("en"), result.current.start("en")]),
		);
		expect(client.importNoteOfCms).toHaveBeenCalledTimes(2);
	});

	it("stops at an offline file, and continues with the files that are not imported", async () => {
		client.importNoteOfCms
			.mockResolvedValueOnce(R.Ok(POST))
			.mockResolvedValueOnce(R.Error({ code: "offline" }));
		const { result } = renderRun();
		act(() => result.current.choose([...files(), new File(["a"], "c.md")]));
		await act(() => result.current.start("en"));
		expect(result.current.run).toEqual({
			status: "stopped",
			failure: { code: "offline" },
		});
		expect(result.current.rows.map((row) => row.state.status)).toEqual([
			"imported",
			"failed",
			"waiting",
		]);
		client.importNoteOfCms.mockResolvedValue(R.Ok(POST));
		await act(() => result.current.start("en"));
		expect(sentNames()).toEqual(["a.md", "b.md", "b.md", "c.md"]);
		expect(result.current.run).toEqual({ status: "done" });
	});

	it("keeps the files after the first run", async () => {
		client.importNoteOfCms.mockResolvedValue(R.Ok(POST));
		const { result } = renderRun();
		act(() => result.current.choose(files()));
		await act(() => result.current.start("en"));
		act(() => result.current.choose([new File(["a"], "z.md")]));
		expect(result.current.rows.map((row) => row.file.name)).toEqual([
			"a.md",
			"b.md",
		]);
	});

	it("sends no more files after an unmount during a run", async () => {
		const answers: ((value: unknown) => void)[] = [];
		client.importNoteOfCms.mockImplementation(
			() => new Promise((resolve) => answers.push(resolve)),
		);
		const { result, unmount } = renderRun();
		act(() => result.current.choose(files()));
		const run = result.current.start("en");
		await vi.waitFor(() => expect(answers).toHaveLength(1));
		unmount();
		answers[0]?.(R.Ok(POST));
		await run;
		expect(sentNames()).toEqual(["a.md"]);
	});

	it("ends the run when the read of the posts fails, so a new run can start", async () => {
		client.importNoteOfCms
			.mockResolvedValueOnce(R.Error({ code: "server" }))
			.mockResolvedValue(R.Ok(POST));
		const { result } = renderRun(vi.fn(() => Promise.reject(new Error("x"))));
		act(() => result.current.choose([new File(["a"], "a.md")]));
		await act(() => result.current.start("en"));
		expect(result.current.run).toEqual({ status: "done" });
		await act(() => result.current.start("en"));
		expect(sentNames()).toEqual(["a.md", "a.md"]);
		expect(result.current.rows[0]?.state.status).toBe("imported");
	});
});
