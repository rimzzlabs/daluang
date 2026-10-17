// The values that the sign-in guard puts in `Astro.locals`. `apps/cms/src/env.d.ts`
// references this file.
declare namespace App {
	interface Locals {
		user: import("@daluang/auth/server").AuthLocals["user"];
		session: import("@daluang/auth/server").AuthLocals["session"];
	}
}
