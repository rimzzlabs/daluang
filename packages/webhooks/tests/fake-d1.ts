import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { webhooksEnvSchema } from "../src/env";

const MIGRATIONS = join(import.meta.dirname, "../../../apps/cms/migrations");

function migrations(): string {
	return readdirSync(MIGRATIONS)
		.filter((name) => name.endsWith(".sql"))
		.toSorted((a, b) => a.localeCompare(b))
		.map((name) => readFileSync(join(MIGRATIONS, name), "utf8"))
		.join("\n");
}

interface FakeResult {
	results: unknown[];
	success: true;
	meta: { changes: number };
}

interface FakeStatement {
	bind: (...params: SQLInputValue[]) => FakeStatement;
	all: () => Promise<FakeResult>;
	run: () => Promise<FakeResult>;
	execute: () => FakeResult;
}

/**
 * A D1 binding on an in-memory SQLite database of Node.js, with each migration of the app.
 * `batch` is one transaction, and it gives one result for each statement, as D1 does. The
 * foreign keys apply, as in D1.
 */
export function createFakeD1() {
	const database = new DatabaseSync(":memory:");
	// D1 enforces the foreign keys. SQLite needs this line for the same rule.
	database.exec("pragma foreign_keys = on");
	database.exec(migrations());

	function statement(
		query: string,
		params: readonly SQLInputValue[],
	): FakeStatement {
		function execute(): FakeResult {
			const prepared = database.prepare(query);
			if (/^\s*select/i.test(query))
				return {
					results: prepared.all(...params),
					success: true,
					meta: { changes: 0 },
				};
			const result = prepared.run(...params);
			return {
				results: [],
				success: true,
				meta: { changes: Number(result.changes) },
			};
		}
		return {
			bind: (...next) => statement(query, next),
			all: async () => execute(),
			run: async () => execute(),
			execute,
		};
	}

	const binding = {
		prepare: (query: string) => statement(query, []),
		batch: async (statements: readonly FakeStatement[]) => {
			database.exec("begin");
			try {
				const results = statements.map((item) => item.execute());
				database.exec("commit");
				return results;
			} catch (error) {
				database.exec("rollback");
				throw error;
			}
		},
		exec: async (query: string) => {
			database.exec(query);
			return { count: 1, duration: 0 };
		},
	};
	return { db: webhooksEnvSchema.parse({ DB: binding }).DB, database };
}
