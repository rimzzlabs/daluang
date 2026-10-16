# AGENTS.md

## wcontent

wcontent is a content management system (CMS) for writing. A writer edits notes in
Markdown, and the CMS keeps and publishes them. The CMS runs as a Cloudflare Worker.

wcontent is open source under the MIT license. A developer can host a copy on their own
Cloudflare account in three steps: set the environment, fork the repository, and deploy.
The documentation site in `apps/docs` is the guide for these steps.

The first site that reads the notes is rimzzlabs.com. Its source is in
`../old-rimzzlabs`, a static Astro site. Do not edit that repository from this one.

`CLAUDE.md` is a symbolic link to this file. Read this file before you change code.

## Product scope

- **Markdown is the one content format.** The CMS does not keep HTML, MDX, or rich text.
  Comark ([comark.dev](https://comark.dev)) parses and renders the Markdown.
- **A note is text only, for now.** Images and videos in a note come in a later step.
- Each step of this list has a plan before its code. "Open decisions" has the questions
  that have no answer yet.

### Open decisions

Do not decide these in code. Ask the person you work for.

| Question                                      | Current direction                                                                                                                                                                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| How does a static site get a changed note?    | The site stays static. A publish in the CMS starts a rebuild of the site. The site reads the notes at build time through a content loader package. `experimental.incrementalBuild` of Astro 7.2 skips each page whose `cacheKey` did not change. |
| Where do the bytes of an image or a video go? | R2 keeps the bytes. A Durable Object can keep the state of an upload. A Durable Object does not keep the bytes: one stored value has a size limit of 2 MB.                                                                                       |
| Where does the CMS keep notes?                | Not decided.                                                                                                                                                                                                                                     |

## Repository layout

A pnpm workspace. The shared tools (Biome, Prettier, lefthook, commitlint,
release-please) are at the root. A version that more than one workspace uses comes from
the `catalog` in `pnpm-workspace.yaml`.

- `apps/cms` (`@wcontent/cms`): the CMS. Astro pages, React islands, and endpoints. It
  deploys as a Cloudflare Worker. `wrangler.jsonc` has its config.
- `apps/docs` (`@wcontent/docs`): the documentation site on Vocs 2. It tells a developer
  how to host wcontent. Its pages are the Markdown files in `src/pages/`. The build is
  static HTML in `dist/public`, which deploys as Cloudflare static assets.
- `packages/ui` (`@wcontent/ui`): the UI primitives on Base UI and the Tailwind CSS 4
  theme, with the font tokens. Each app loads the font files.
- `packages/tsconfig` (`@wcontent/tsconfig`): the TypeScript base that each workspace
  extends.

To use a workspace package, write `"@wcontent/<name>": "workspace:*"` in the
`package.json` by hand. Then run `pnpm install`. `pnpm add` puts a package in the
`catalog`, which is for versions.

Run each script from the root:

| Command           | Does                                                |
| ----------------- | --------------------------------------------------- |
| `pnpm dev`        | `astro dev` in `apps/cms`                           |
| `pnpm build`      | `astro build` in `apps/cms`                         |
| `pnpm docs:dev`   | `vocs dev` in `apps/docs`                           |
| `pnpm docs:build` | `vocs build` in `apps/docs`. A dead link fails it.  |
| `pnpm typecheck`  | The type check of each workspace                    |
| `pnpm check`      | Biome (lint and format) and Prettier, with no write |
| `pnpm fix`        | Biome and Prettier, with write                      |
| `pnpm commit`     | The commit prompt of commitlint                     |

Each app also has a `deploy` script: a build, then `wrangler deploy`. Run it only when
the person tells you to.

## Tech stack

- pnpm 12 workspace, Node.js 24 (`.nvmrc`).
- Astro 7 with server output, on Cloudflare Workers through `@astrojs/cloudflare`.
- React 19 islands, with the React Compiler (`react({ compiler: true })`). The compiler
  runs through `oxc-transform-react`.
- **TypeScript 6 in each workspace.** `astro check` needs the compiler API of TypeScript
  6, and TypeScript 7 has no such API. Do not move to TypeScript 7 before
  `@astrojs/check` accepts it.
- Tailwind CSS 4 through `@tailwindcss/vite`.
- Base UI (`@base-ui/react`) for UI primitives. No Radix UI.
- The shadcn registry, style `base-maia`, is the source of a new primitive. It goes in
  `packages/ui` only.
- `cn` (the package of shadcn) to merge class names: `import { cn } from "cn"`. No `clsx`
  and no `tailwind-merge`.
- Hugeicons for icons: `HugeiconsIcon` of `@hugeicons/react`, with an icon of
  `@hugeicons/core-free-icons`.
- Comark for Markdown: `comark` parses, `@comark/react` and `@comark/html` render.
- Vocs 2 (with Waku) for the documentation site. `react-server-dom-webpack` has the exact
  version of `react`, for the RSC runtime of Waku.
- Fonts: Inter (sans), Lora (serif), and JetBrains Mono (mono). `apps/cms` loads them
  with the Fonts API of Astro. `apps/docs` loads them from `@fontsource-variable`.
- `@mobily/ts-belt` for data transforms, `ts-pattern` for branches on a union, and zod for
  validation. Each one comes into a workspace with the first code that needs it.
- Biome for lint and format of code. Prettier for Markdown and YAML only.
- lefthook, commitlint, `@commitlint/prompt-cli`, release-please, and GitHub Actions.

Do not add a library that this list does not name. Ask first.

## Architecture rules

The code follows domain-driven design. A domain is one area of the product, with its
own words and its own rules: for example, the editor, the notes, or the media.

1. **A domain is a package.** The code of a domain goes in `packages/<domain>`, for
   example `packages/wysiwyg` for the editor. The package holds the model, the logic,
   the schemas, the components, and the hooks of that domain.
2. **The package name is the domain name.** Use the words of the domain in its code. Do
   not name a package for a technical layer, for example `utils`, `helpers`, or `types`.
3. **Packages are source-only.** `exports` points at `.ts` and `.tsx` files, and Vite
   compiles them with the app. A package has no build step.
4. **A package does not import an app.** Across workspaces, import by package name.
5. **Dependencies go in one direction.** `@wcontent/tsconfig` and `@wcontent/ui` import
   no domain package. A domain package can import `@wcontent/ui` and another domain
   package. Do not make a cycle.
6. **The app is thin.** `apps/cms` holds pages, islands, and wiring. Logic that handles
   data goes in the package of its domain.
7. **The app imports with `@/`.** `@/` is `apps/cms/src`. Do not write `../` in the app.
   A file in the same folder keeps `./`. In a package, import by relative path.
8. **Each entry is one file that defines its symbols.** Do not add a file that only
   exports from other files.
9. **A package with endpoints has an Astro layer.** `packages/<domain>/src/astro/` holds
   an Astro integration, the route entry files, and the wiring. The app adds the
   integration in `astro.config.ts`.
10. **One module reads the environment.** The Cloudflare bindings and the variables come
    into `apps/cms` in one module. All other code gets a value as a parameter.

## Pages and islands

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

## Code conventions

Apply each rule to a file that you write or change.

### Files and modules

- Name each file and each directory in kebab-case.
- Keep a file below 600 lines. Split a long module by concern into siblings that share
  its prefix: `note-list.tsx`, `note-list-item.tsx`.
- Use named exports. A default export is correct only where a tool needs it, for example
  in `astro.config.ts`.
- Import a symbol from the module that defines it. Do not write an `index.ts` that only
  exports from other files.
- A package lists its entries in `exports`. One pattern for each folder is correct:
  `"./components/*": "./src/components/*.tsx"`.

### Functions and types

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

### Data and branches

- Transform arrays, strings, and objects with `pipe` and the modules of
  `@mobily/ts-belt`. Write each transform as a pipeline, with the data first.
- Do not write `.filter(Boolean)` or a `.sort()` with no comparator.
- For one condition, use `if` with an early return. A ternary is for two short values on
  one line. Do not nest a ternary.
- For more than two cases of a union, use `match` of `ts-pattern` and end with
  `.exhaustive()`.
- For a fixed map from a key to a value, use a `Record` lookup.

### Errors

- Code that runs in the browser returns an error as a value. It does not throw. Use the
  `R` module of ts-belt.
- The error is a code from a union, for example `"not-found" | "too-large"`. The UI shows
  one message for each code. Do not show the `message` of an exception to a person.
- Server code throws: an endpoint, the middleware, and a Worker handler. The endpoint
  changes the error to a status code.
- A `queryFn` and a `mutationFn` of TanStack Query throw. The library changes the throw to
  its error state.

### React

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

### UI primitives

- A primitive is in `packages/ui/src/components`. Import it as
  `@wcontent/ui/components/<name>`.
- `packages/ui/components.json` is the one config of the shadcn CLI. `apps/cms` has no
  `components.json` and no file from the registry.
- To add a primitive, run `pnpm dlx shadcn@latest add <name> -c packages/ui` from the root.
- After the CLI writes a file, apply the code rules of this file: one `props` parameter,
  an `export` at each declaration, and a maximum of three fields in a destructure.
- A file from the registry keeps the classes of the registry, also an arbitrary value.
  The look of `base-maia` is the look of the product.
- Only `packages/ui` imports `@base-ui/react`. The app uses the primitive from
  `@wcontent/ui` and changes its look with `className`.
- If `@wcontent/ui` has no such primitive, add one there. Do not write it in the app.
- `render` replaces the `asChild` prop of Radix UI. Do not install or import Radix UI.

### Styles

- The config is CSS. `packages/ui/src/styles/theme.css` holds the tokens. Do not add a
  `tailwind.config` file.
- The theme has a light set and a dark set of tokens. The dark set applies below an
  element with the class `dark`.
- Use a token of the theme: `bg-background`, `text-muted-foreground`, `border-border`. Do
  not write a color value in a class.
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
- **lefthook** runs the Git hooks. `pnpm install` installs them.
  - `pre-commit`: Biome and Prettier on the staged files. The hook stages each fix.
  - `commit-msg`: commitlint on the message.
  - `pre-push`: `pnpm typecheck`.
- Do not skip a hook with `LEFTHOOK=0` or `--no-verify`.

## Git

- **Write each commit message as a Conventional Commit:** `type(scope): subject`. The
  scope is the workspace name without the prefix, for example `cms`, `ui`, or `docs`.
- `pnpm commit` opens the prompt of commitlint.
- Write the subject in the imperative and in lower case, with no period at the end.
- Do not add a trailer, a session link, or a "generated with" line to a commit or a pull
  request.
- Do not push and do not open a pull request unless the person tells you to.
- A release is a tag that release-please cuts. Do not edit `CHANGELOG.md` or a `version`
  field by hand.

## Documentation

- A document is part of the change. If a change makes a document false, update the
  document in the same commit.
- Write each document, commit message, and error message in Simplified Technical English
  (ASD-STE100). The `ste` skill has the rules.
- Describe what the code does now. Verify each statement against the code.
- A page of `apps/docs` is one `.md` file in `src/pages/`. Add a new page to the sidebar
  in `apps/docs/vocs.config.ts`. Then run `pnpm docs:build` to check the links.
- The H1 of a page has the Vocs form: `# The title [One line about the page]`. Vocs puts
  the text in brackets into `/llms.txt`.
- A link to a page is a route from the root: `/guide/local-development`.

## Skills

The skills are in `.agents/skills/`. `.claude/skills` holds a symbolic link to each one.
`skills-lock.json` records the source of each skill.

**Load the skill before the first edit of that type. Do not wait for a request.**

| When you                                                                                  | Load                              |
| ----------------------------------------------------------------------------------------- | --------------------------------- |
| Write or change a `.ts`, `.tsx`, `.js`, or `.mjs` file, or the script of an `.astro` file | `typescript`                      |
| Write or change a component, a hook, or JSX                                               | `react`, and `typescript` with it |
| Add or change a primitive in `packages/ui`                                                | `shadcn`                          |
| Write a Tailwind CSS class, a token, or a theme                                           | `tailwind-design-system`          |
| Write a document, a commit message, or an error message                                   | `ste`                             |

- One load for each session is sufficient.
- If your tool cannot load a skill, read `.agents/skills/<name>/SKILL.md` as a file.

**This file has priority.** A skill is a general rule set. If a skill and this file
disagree, obey this file.

| Skill rule                                                    | Rule in this repository                            |
| ------------------------------------------------------------- | -------------------------------------------------- |
| `typescript`: ask before you add `ts-belt` and `ts-pattern`   | The two libraries are part of the stack. Use them. |
| `typescript`: sort with `toSorted`                            | Sort with `A.sort` or `A.sortBy` of ts-belt.       |
| `typescript`: a hand-written `Result` union                   | The `R` module of ts-belt                          |
| `typescript` and `react`: destructure a maximum of five keys  | A maximum of three keys                            |
| `react`: ask before you enable the React Compiler             | The compiler is on in `apps/cms`.                  |
| `tailwind-design-system`: Radix UI, `asChild`, `lucide-react` | Base UI, the `render` prop, and Hugeicons          |
| `tailwind-design-system`: `clsx` with `tailwind-merge`        | The package `cn`                                   |

Biome refuses an import of Radix UI, `lucide-react`, `clsx`, `tailwind-merge`, lodash,
`radash`, `ramda`, and `remeda`. In `apps/`, Biome also refuses an import of
`@base-ui/react`.
