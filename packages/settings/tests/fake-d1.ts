import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { settingsEnvSchema } from "../src/env";

const MIGRATIONS = join(import.meta.dirname, "../../../apps/cms/migrations");

/** The SQL of each migration of the app, in the order of the file names. */
export function migrations(): string {
	return readdirSync(MIGRATIONS)
		.filter((name) => name.endsWith(".sql"))
		.toSorted((a, b) => a.localeCompare(b))
		.map((name) => readFileSync(join(MIGRATIONS, name), "utf8"))
		.join("\n");
}

interface FakeStatement {
	bind: (...params: SQLInputValue[]) => FakeStatement;
	all: () => Promise<{ results: unknown[]; success: true }>;
	run: () => Promise<{ success: true }>;
}

/**
 * A D1 binding on an in-memory SQLite database of Node.js, with each migration of the app.
 * It has the methods that the settings store calls. `batch` is one transaction, as in D1.
 */
export function createFakeD1(sql = migrations()) {
	const database = new DatabaseSync(":memory:");
	database.exec(sql);

	function statement(
		query: string,
		params: readonly SQLInputValue[],
	): FakeStatement & { runSync: () => void } {
		return {
			bind: (...next) => statement(query, next),
			all: async () => ({
				results: database.prepare(query).all(...params),
				success: true,
			}),
			run: async () => {
				database.prepare(query).run(...params);
				return { success: true };
			},
			runSync: () => {
				database.prepare(query).run(...params);
			},
		};
	}

	const binding = {
		prepare: (query: string) => statement(query, []),
		batch: async (statements: readonly ReturnType<typeof statement>[]) => {
			database.exec("begin");
			try {
				statements.forEach((item) => {
					item.runSync();
				});
				database.exec("commit");
			} catch (error) {
				database.exec("rollback");
				throw error;
			}
			return statements.map(() => ({ success: true }));
		},
		exec: async (query: string) => {
			database.exec(query);
			return { count: 1, duration: 0 };
		},
	};
	return { db: settingsEnvSchema.parse({ DB: binding }).DB, database };
}
