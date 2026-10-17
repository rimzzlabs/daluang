# Code conventions

This page has the rules for each file that you write or change. The rules of the
architecture (packages and apps) are in `AGENTS.md`.

## Files and modules

- Name each file and each directory in kebab-case.
- Keep a file below 600 lines. Split a long module by concern into siblings that share
  its prefix: `note-list.tsx`, `note-list-item.tsx`.
- Use named exports. A default export is correct only where a tool needs it, for example
  in `astro.config.ts`.
- Import a symbol from the module that defines it. Do not write an `index.ts` that only
  exports from other files.
- A package lists its entries in `exports`. One pattern for each folder is correct:
  `"./components/*": "./src/components/*.tsx"`.

## Functions and types

- Declare each top-level function, component, and hook with the `function` keyword. An
  arrow function is for an inline callback.
- A function has a maximum of two parameters. Use one object for more.
- Do not destructure in a parameter list. Name the parameter (`props`, `params`) and
  destructure in the body. Destructure a maximum of three fields.
- Declare an object shape with `interface`. Use `type` for a union, an alias, or a mapped
  type.
- Do not use `enum`. Use a union of literal types. If the code also reads the list at run
  time, write an `as const` array and take the union from it.
- Do not use `any`, an `as` cast (with the exception of `as const`), or the `!`
  assertion. Narrow with a type guard, or validate with zod.
- Data from outside is `unknown`: a response, `JSON.parse`, storage, a binding, a `catch`
  clause. Validate it one time at the boundary.
- Declare with `const`. Use `let` only for state that a function replaces.
- Model one state as one union with a `status` field, not as a set of boolean flags.
- Do not mutate data. Make the new value with a literal, a spread, or ts-belt.
- Write a comment only for a reason that the code does not show.

## Data and branches

- Transform arrays, strings, and objects with the modules of `@mobily/ts-belt`.
- **A transform of two or more steps is a pipeline:**
  `pipe(users, A.filter(isActive), A.map(toName))`. The data comes first, and each step is
  one line.
- **One ts-belt call needs no pipe.** Give it the data first: `A.map(users, toName)`.
- Do not nest ts-belt calls. `S.toLowerCase(S.trim(name))` is two steps, so write
  `pipe(name, S.trim, S.toLowerCase)`.
- Do not write `.filter(Boolean)` or a `.sort()` with no comparator.
- For one condition, use `if` with an early return. A ternary is for two short values on
  one line. Do not nest a ternary.
- For more than two cases of a union, use `match` of `ts-pattern` and end with
  `.exhaustive()`.
- For a fixed map from a key to a value, use a `Record` lookup.

## Errors

- Code that runs in the browser returns an error as a value. It does not throw. Use the
  `R` module of ts-belt.
- The error is a code from a union, for example `"not-found" | "too-large"`. The UI shows
  one message for each code. Do not show the `message` of an exception to a person.
- Server code throws: an endpoint, the middleware, and a Worker handler. The endpoint
  changes the error to a status code.
- A `queryFn` and a `mutationFn` of TanStack Query throw. The library changes the throw to
  its error state.

## React

- The React Compiler memoizes. Do not write `useMemo`, `useCallback`, or `memo`.
- A component takes one `props` parameter.
- Use `useEffect` only to connect to an external system. Calculate derived state during
  render. Do the work of an event in its handler. Reset state with a `key`.
- Read an external value that has a subscription with `useSyncExternalStore`.
- `ref` is a prop. Do not use `forwardRef`.
- Do not use `use()`, form actions, or server actions.
- Export each part of a component by its name (`Card`, `CardHeader`). Do not attach a part
  as a property (`Card.Header`).
- Use the correct native element first (`button`, `a`, `label`, `input`). Add ARIA only for
  a name or a state that the element does not give.
- Do not write `dangerouslySetInnerHTML` for data that a person wrote. Render Markdown
  through Comark.

## Pages and islands

The sign-in page and the landing page obey these rules. The app island is the exception:
see `docs/app-shell.md`.

- A page is an `.astro` file in `apps/cms/src/pages/`.
- **Write a part as an Astro component, unless it needs JavaScript in the browser.** The
  server sends it as HTML.
- **An island is the smallest part that needs JavaScript:** a menu, a form, the editor.
  Do not make a full page or a full layout one island.
- `client:load` is for an island that the person uses at once. `client:idle` and
  `client:visible` are for an island that can wait.
- `client:only="react"` gives no HTML from the server. Use it only for a part that cannot
  render on a server. Write the reason in a comment, and give a `fallback` slot.
- Each island is its own React root. React context does not go from one island to the
  next. Module state, for example a Zustand store, goes across islands.

## UI primitives

- A primitive is in `packages/ui/src/components`. Import it as
  `@daluang/ui/components/<name>`.
- `packages/ui/components.json` is the one config of the shadcn CLI. `apps/cms` has no
  `components.json` and no file from the registry.
- To add a primitive, run `pnpm dlx shadcn@latest add <name> -c packages/ui` from the root.
- After the CLI writes a file, apply the code rules of this file: one `props` parameter,
  an `export` at each declaration, and a maximum of three fields in a destructure.
- A file from the registry keeps the classes of the registry, also an arbitrary value.
  The look of `base-maia` is the look of the product.
- Only `packages/ui` imports `@base-ui/react`. The app uses the primitive from
  `@daluang/ui` and changes its look with `className`.
- If `@daluang/ui` has no such primitive, add one there. Do not write it in the app.
- A registry file of more than 600 lines is split by concern. The sidebar is three files:
  `sidebar.tsx` (the provider, the frame, the trigger, the rail, and the inset),
  `sidebar-sections.tsx`, and `sidebar-menu.tsx`. `shadcn add sidebar --overwrite`
  writes one file again: split it again, and keep the rail of `sidebar.tsx`.
- The sidebar rail resizes the sidebar. It is a window splitter of WAI-ARIA: drag it,
  or use the arrow keys, Home, and End. A click, Enter, or Space collapses the sidebar to
  its icons. The width stays between 13 rem and 24 rem.
- The sidebar keeps its open state and its width in localStorage. See
  `docs/app-shell.md`, "Preferences".
- **Each action of a page opens a `ResponsiveDialog`**: a form, or a `ConfirmDialog`
  before a change. It is a dialog from 64rem (`lg`, `useIsDesktop`), and a drawer from the
  bottom on a phone or a tablet. Do not put a form or a confirmation inline in a list.
- **A page of the app shell is a `Page`** of `@daluang/ui/components/page`: the full
  width of the shell, with compact padding. Its `PageHeader` has the title and the
  description on the left and the primary action at the right edge. A form keeps a
  readable width below the header. An empty list is a compact `Empty` box. A full empty
  page, such as the notes page, centers its content.
- `render` replaces the `asChild` prop of Radix UI. Do not install or import Radix UI.

## Styles

- The config is CSS. `packages/ui/src/styles/theme.css` holds the tokens. Do not add a
  `tailwind.config` file.
- The theme has a light set and a dark set of tokens. The dark set applies below an
  element with the class `dark`.
- Use a token of the theme: `bg-background`, `text-muted-foreground`, `border-border`. Do
  not write a color value in a class.
- **Tailwind CSS scans only the files that it knows.** `theme.css` adds `packages/ui`.
  `apps/cms/src/styles/global.css` adds each domain package with components, with an
  `@source` line. Add the line for a new domain package, or its classes are missing.
- Do not write an arbitrary value in a class: `w-[400px]`, `text-[15px]`, `bg-[#fff]`. Use
  a step of the scale, or add a token to `theme.css`.
- A variant in square brackets is correct only when Tailwind CSS has no named variant for
  it: `data-[side=bottom]:`, `[&_svg]:`.
- Merge class names with `cn` of the package `cn`. Write variants with `cva`.
- `font-sans` is Inter, `font-serif` is Lora, and `font-mono` is JetBrains Mono. The body
  text of a note uses `font-serif`.

## Tools

- **Biome** lints and formats JavaScript, TypeScript, JSON, CSS, and Astro files. Do not
  add ESLint.
- **Prettier** formats Markdown and YAML files only. It does not read a lockfile
  (`*-lock.yaml`) or `CHANGELOG.md`.
- Biome refuses an import of Radix UI, `lucide-react`, Hugeicons, `clsx`, `tailwind-merge`,
  lodash, `radash`, `ramda`, and `remeda`. In `apps/`, Biome also refuses an import of
  `@base-ui/react`.
