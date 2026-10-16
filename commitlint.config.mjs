import { readdirSync } from "node:fs";

// The scope of a commit is the folder name of a workspace: `cms`, `docs`, `ui`.
const workspaces = ["apps", "packages"].flatMap((folder) =>
	readdirSync(new URL(`./${folder}/`, import.meta.url), { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name),
);

const config = {
	extends: ["@commitlint/config-conventional"],
	rules: {
		"scope-enum": [2, "always", [...workspaces, "deps", "ci", "release"]],
	},
};

export default config;
