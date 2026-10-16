import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { apiTokensEnvSchema } from "../src/env";

const MIGRATIONS = join(import.meta.dirname, "../../../apps/cms/migrations");

function migrations(): string {
	return readdirSync(MIGRATIONS)
		.filter((name) => name.endsWith(".sql"))
		.toSorted((a, b) => a.localeCompare(b))
		.map((name) => readFileSync(join(MIGRATIONS, name), "utf8"))
		.join("\n");
}

interface FakeStatement {
	bind: (...params: SQLInputValue[]) => FakeStatement;
	all: () => Promise<{ results: unknown[]; success: true }>;
	run: () => Promise<{ success: true; meta: { changes: number } }>;
}

/**
 * A D1 binding on an in-memory SQLite database of Node.js, with each migration of the app.
 * It has the methods that the token store calls. The settings package has its own copy.
 */
export function createFakeD1() {
	const database = new DatabaseSync(":memory:");
	database.exec(migrations());

	function statement(
		query: string,
		params: readonly SQLInputValue[],
	): FakeStatement {
		return {
			bind: (...next) => statement(query, next),
			all: async () => ({
				results: database.prepare(query).all(...params),
				success: true,
			}),
			run: async () => {
				const result = database.prepare(query).run(...params);
				return { success: true, meta: { changes: Number(result.changes) } };
			},
		};
	}

	const binding = {
		prepare: (query: string) => statement(query, []),
		batch: () => Promise.reject(new Error("The token store sends no batch.")),
		exec: async (query: string) => {
			database.exec(query);
			return { count: 1, duration: 0 };
		},
	};
	return { db: apiTokensEnvSchema.parse({ DB: binding }).DB, database };
}
