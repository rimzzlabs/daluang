// Copies the build of `apps/docs` into `dist/docs`. The docs site has `basePath: "/docs"`,
// so each of its URLs starts with `/docs/`. Run `pnpm web:build` from the root: it builds
// the docs site first.
import { cpSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

const source = fileURLToPath(
	new URL("../../docs/dist/public/", import.meta.url),
);
const target = fileURLToPath(new URL("../dist/docs/", import.meta.url));

if (!existsSync(source)) {
	throw new Error(
		`The docs build is not at ${source}. Run "pnpm docs:build", then try again.`,
	);
}

rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
