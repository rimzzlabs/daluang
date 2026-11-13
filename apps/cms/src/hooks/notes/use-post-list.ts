import type { ListedNote } from "@daluang/notes/note-list";
import { R } from "@mobily/ts-belt";
import { useEffect, useRef, useState } from "react";
import { usePublishCount } from "@/hooks/notes/use-change-count";
import type { ChangesStore } from "@/lib/notes/changes-store";
import { listPostsOfCms, type NotesError } from "@/lib/notes/client";

export type PostListState =
	| { status: "loading" }
	| { status: "ready"; posts: readonly ListedNote[] }
	| { status: "failed"; error: NotesError };

/**
 * The state after a read of the posts. A read again after Publish changes keeps a list that
 * is on the page when it fails. The next action reads the posts again.
 */
function keepShownList(
	shown: PostListState,
	read: PostListState,
): PostListState {
	if (read.status === "failed" && shown.status === "ready") return shown;
	return read;
}

export interface PostListHandle {
	list: PostListState;
	/** Reads the posts again, and keeps the list on the page while it reads. */
	reload: () => Promise<void>;
	/** Reads the posts again after a failure, with the loading state. */
	retry: () => Promise<void>;
}

/**
 * The posts of the CMS, each with its change. The component reads them when it opens, and
 * again after each Publish changes. It keeps the list on the page while it reads again,
 * and after a read again after Publish changes that fails.
 */
export function usePostList(changes: ChangesStore): PostListHandle {
	const [list, setList] = useState<PostListState>({ status: "loading" });
	const published = usePublishCount(changes);
	// The number of the last read. Only the answer of the last read changes the list and the
	// number of changes, so an old answer that comes late does not replace a new one.
	const turn = useRef(0);

	/** Reads the posts. `null` when a newer read started. The navbar gets the number of changes. */
	async function readPosts(): Promise<PostListState | null> {
		turn.current += 1;
		const mine = turn.current;
		const result = await listPostsOfCms();
		if (mine !== turn.current) return null;
		return R.match(
			result,
			(found): PostListState => {
				changes.write(found.count);
				return { status: "ready", posts: found.posts };
			},
			(error): PostListState => ({ status: "failed", error }),
		);
	}

	// The posts are on the server, an external system. The component reads them when it opens,
	// and again when Publish changes changed them.
	// biome-ignore lint/correctness/useExhaustiveDependencies: a new `published` reads the posts again.
	useEffect(() => {
		readPosts().then((read) => {
			if (read !== null) setList((shown) => keepShownList(shown, read));
		});
		return () => {
			// The answer of a read that runs when the component closes changes nothing.
			turn.current += 1;
		};
	}, [changes, published]);

	async function reload() {
		const read = await readPosts();
		if (read !== null) setList(read);
	}

	async function retry() {
		setList({ status: "loading" });
		const read = await readPosts();
		if (read !== null) setList(read);
	}

	return { list, reload, retry };
}
