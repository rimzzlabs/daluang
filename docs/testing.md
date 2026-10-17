# Testing

This page tells which code needs a test, where the test goes, and how coverage counts.

## Rules

- Each source file of `apps/*/src` and `packages/*/src` has a unit test, with the
  exception of `packages/ui`. A change to code comes with its test, in the same commit.
- `packages/ui` has no tests. Its primitives come from the shadcn registry.
- Each workspace keeps its tests in `tests/`, next to `src/`, with the same structure as
  `src/`. The test of `src/guard.ts` is `tests/guard.test.ts`.
- A test calls a function with parameters. Do not mock a framework module, for example
  `astro:middleware`. A test can replace a module of its own workspace with `vi.mock`, as
  the component tests of `packages/auth` do with `src/client.ts`.
- A test that passes prints nothing. A test of a failure collects the log it expects with
  `vi.spyOn(console, "error")` and checks it.

## Coverage

- `pnpm test` runs Vitest with coverage. Each source file counts, also a file that no test
  imports. The totals must reach 90% statements, functions, and lines, and 80% branches.
  Each file must reach 80% statements, functions, and lines, and 70% branches.
- Do not lower a threshold. `vitest.config.ts` lists each file that coverage does not
  count, with the reason. Add a file to the list only when it is wiring with no logic: it
  connects a framework to functions that have tests, and it has no branch.
- If a wiring file gets logic, move the logic into a function in its own file and test
  that function. `decideAccess` of `packages/auth/src/guard.ts` came out of the middleware
  in this way.

## Environment

- The tests run in the `node` environment, in the `vmThreads` pool. A React component test
  uses `@testing-library/react`, and its first line is `// @vitest-environment jsdom`.
- `packages/auth/tests/fake-d1.ts` is a D1 binding on `node:sqlite`, with the migrations
  of `apps/cms/migrations`. A test of `createAuth` uses it, and a test checks that the
  migrations match the schema of Better Auth.
