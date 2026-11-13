import type { ListedNote } from "@daluang/notes/note-list";
import { R } from "@mobily/ts-belt";
import { useEffect, useState } from "react";
import type { ChangesStore } from "@/lib/notes/changes-store";
import { listPostsOfCms, type NotesError } from "@/lib/notes/client";

export type PostListState =
	| { status: "loading" }
	| { status: "ready"; posts: readonly ListedNote[] }
	| { status: "failed"; error: NotesError };

/** Reads the posts. The navbar gets the number of changes of the server. */
async function readPosts(changes: ChangesStore): Promise<PostListState> {
	return R.match(
		await listPostsOfCms(),
		(list): PostListState => {
			changes.write(list.count);
			return { status: "ready", posts: list.posts };
		},
		(error): PostListState => ({ status: "failed", error }),
	);
}

export interface PostListHandle {
	list: PostListState;
	/** Reads the posts again, and keeps the list on the page while it reads. */
	reload: () => Promise<void>;
	/** Reads the posts again after a failure, with the loading state. */
	retry: () => Promise<void>;
}

/** The posts of the CMS, each with its change. The component reads them when it opens. */
export function usePostList(changes: ChangesStore): PostListHandle {
	const [list, setList] = useState<PostListState>({ status: "loading" });

	// The posts are on the server, an external system. The component reads them when it opens.
	useEffect(() => {
		let current = true;
		readPosts(changes).then((state) => {
			if (current) setList(state);
		});
		return () => {
			current = false;
		};
	}, [changes]);

	async function reload() {
		setList(await readPosts(changes));
	}

	async function retry() {
		setList({ status: "loading" });
		setList(await readPosts(changes));
	}

	return { list, reload, retry };
}
