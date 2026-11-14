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
  the component tests of `apps/cms` do with `@/lib/auth/client`.
- A test that passes prints nothing. A test of a failure collects the log it expects with
  `vi.spyOn(console, "error")` and checks it.

## The flow test

- `apps/cms/tests/flow/publish-flow.test.ts` checks the publish flow from end to end on the
  server: the settings, a webhook, an API token, a new draft, an autosave, Publish
  changes, and the content API. It also checks that a later save and a delete wait for
  the next Publish changes.
- A second test imports an old post with `status: published`. After Publish changes, the
  content API gives the post with the dates of its file.
- Each step calls the handler of an endpoint with the wiring of its route file, on one
  fake D1. A step of the editor uses the pure functions of the editor. A fake `fetch`
  gets the calls of the webhook.
- The flow test does not drive a browser, and it does not sign in. The guard has its own
  tests in `packages/auth`.
- `apps/cms/tests/fake-d1.ts` is the fake D1 of the app, with the migrations of
  `apps/cms/migrations`. If a change of the flow adds a step, add it to the flow test.

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

- The tests run in the `node` environment, in the `vmThreads` pool. The root
  `vitest.config.ts` limits the workers to 50% of the CPU cores (`maxWorkers`). CI uses
  the default of Vitest. A React component test uses `@testing-library/react`, and its
  first line is `// @vitest-environment jsdom`.
- A test of `apps/cms` has 15 s, not the 5 s of Vitest. A test that loads CodeMirror in
  jsdom can take 5 s on a busy computer, and the pre-push hook runs all tests together.
- A `findBy` query that waits for a lazy chunk, such as the preview of Comark, gets a
  timeout of 10 s. The default of 1 s fails on a busy computer.
- jsdom has no layout. `apps/cms/tests/setup.ts` gives a text range no box, because
  CodeMirror measures text. jsdom sends no input that CodeMirror reads, so
  `typeInEditor` of `apps/cms/tests/components/notes/editor.ts` gives a change to the
  editor through its API.
- `packages/auth/tests/fake-d1.ts` is a D1 binding on `node:sqlite`, with the migrations
  of `apps/cms/migrations`. A test of `createAuth` uses it, and a test checks that the
  migrations match the schema of Better Auth.
