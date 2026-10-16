// The values that the sign-in guard puts in `Astro.locals`. `apps/cms/src/env.d.ts`
// references this file.
declare namespace App {
	interface Locals {
		user: import("../server").AuthLocals["user"];
		session: import("../server").AuthLocals["session"];
	}
}
