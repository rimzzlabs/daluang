import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";

// The migration of the auth tables. The app owns the migration folder, and the tests check
// that the migration matches the schema of `createAuth`. It is a path, not a URL: jsdom
// replaces the URL class of Node.js in these tests.
const MIGRATION = join(
	import.meta.dirname,
	"../../../apps/cms/migrations/0001_auth.sql",
);

/** The SQL of the auth migration. */
export function authMigration(): string {
	return readFileSync(MIGRATION, "utf8");
}

interface FakeStatement {
	bind: (...params: SQLInputValue[]) => FakeStatement;
	all: () => Promise<{
		results: unknown[];
		success: true;
		meta: { changes: number };
	}>;
	first: () => Promise<unknown>;
}

/**
 * A D1 binding on an in-memory SQLite database of Node.js, for tests. It has the methods
 * that Better Auth calls: `prepare(sql).bind(...).all()`, `batch`, and `exec`.
 */
export function createFakeD1(sql: string) {
	const database = new DatabaseSync(":memory:");
	database.exec(sql);

	function statement(
		query: string,
		params: readonly SQLInputValue[],
	): FakeStatement {
		return {
			bind: (...next) => statement(query, next),
			all: async () => ({
				results: database.prepare(query).all(...params),
				success: true,
				meta: { changes: 0 },
			}),
			first: async () => database.prepare(query).get(...params) ?? null,
		};
	}

	return {
		prepare: (query: string) => statement(query, []),
		batch: (statements: readonly FakeStatement[]) =>
			Promise.all(statements.map((item) => item.all())),
		exec: async (query: string) => {
			database.exec(query);
			return { count: 1, duration: 0 };
		},
	};
}
