# AGENTS.md

## Daluang

Daluang is a content management system (CMS) for writing. A writer edits notes in
Markdown, and the CMS keeps and publishes them. The CMS runs as a Cloudflare Worker.

The name comes from daluang, the bark paper of old Sundanese manuscripts. Write the name
as "Daluang" in text, and as `daluang` in code, package names, and Worker names.

Daluang is open source under the MIT license. A developer can host a copy on their own
Cloudflare account in three steps: set the environment, fork the repository, and deploy.
The documentation site in `apps/docs` is the guide for these steps.

The first site that reads the notes is rimzzlabs.com. Its source is in
`../old-rimzzlabs`, a static Astro site. Do not edit that repository from this one.

`CLAUDE.md` is a symbolic link to this file. Read this file before you change code.

## Product scope

- **The interface calls a note a post.** Each label, message, and page of the docs says
  "post". The code, the package `@daluang/notes`, and this file keep the domain word
  "note" until a rename of the domain.
- **Markdown is the one content format.** The CMS does not keep HTML, MDX, or rich text.
  Comark ([comark.dev](https://comark.dev)) parses and renders the Markdown.
- **A note can hold components in the syntax of Comark**, for example
  `::callout{type="note"}`. The CMS keeps the text. Comark parses the text into a
  document of plain data: a node is a string, or `[tag, props, ...children]`.
- **Each site renders the document with its own components.** The content API gives the
  text and the parsed document of a note. A site maps each tag to a component of its own,
  for example an Astro component or a React island. The CMS does not decide how a
  component looks on a site. The preview of the CMS renders each component with a simple
  default, so the preview and a site can look different.
- **D1 keeps the Markdown of a note**, in the row of the note, with its metadata and its
  extra fields. One write saves all of them. A row of D1 can hold 2 MB, and the largest
  post of rimzzlabs.com has 30 KB.
- **A note is text only, for now.** Images and videos in a note come in a later step.
- **A note has core metadata and extra fields.** The core fields are the same for each
  site: title, slug, language, description, keywords, status, publishedAt, and
  updatedAt. A site adds its own fields, for example `featured` or `relatedPosts`, and
  Daluang keeps them as they are. `packages/notes` has the schemas.
- **The language is part of the metadata.** A writer can write in more than
  one language. Each note has one language, as a BCP 47 tag, for example `en` or `id`.
  The languages of a CMS are a setting.
- Each step of this list has a plan before its code. "Open decisions" has the questions
  that have no answer yet.

### Open decisions

Do not decide these in code. Ask the person you work for.

| Question                                      | Current direction                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| How does a static site get a changed note?    | The site stays static. A publish in the CMS starts a rebuild of the site. The site reads the notes at build time through a content loader. The docs site gives the loader as a file to copy into the site. A package comes when a second site needs it. `experimental.incrementalBuild` of Astro 7.2 skips each page whose `cacheKey` did not change. |
| Where do the bytes of an image or a video go? | R2 keeps the bytes. A Durable Object can keep the state of an upload. A Durable Object does not keep the bytes: one stored value has a size limit of 2 MB.                                                                                                                                                                                            |
| How does a translation link to its note?      | Two notes with the same slug and different languages are translations of each other, as on rimzzlabs.com: `notes/en/<slug>` and `notes/id/<slug>`.                                                                                                                                                                                                    |

## Repository layout

A pnpm workspace. The shared tools (Biome, Prettier, lefthook, commitlint,
release-please) are at the root. A version that more than one workspace uses comes from
the `catalog` in `pnpm-workspace.yaml`.

- `apps/cms` (`@daluang/cms`): the CMS. Astro pages, React islands, and endpoints. It
  deploys as a Cloudflare Worker. `wrangler.jsonc` has its config.
- `apps/web` (`@daluang/web`): the landing page. Static Astro pages, with React islands.
  Its build also holds the docs site at `/docs`. See `docs/infrastructure.md`.
- `apps/docs` (`@daluang/docs`): the documentation site on Vocs 2. It tells a developer
  how to host Daluang. Its pages are the Markdown files in `src/pages/`. The build is
  static HTML in `dist/public`. The docs site has no Worker of its own.
- `packages/ui` (`@daluang/ui`): the UI primitives on Base UI and the Tailwind CSS 4
  theme, with the font tokens. Each app loads the font files. `src/assets/` holds the
  masters of the mark (the Sundanese letter da) and of the app icon. `DaluangMark` is the
  mark as a component. Each app keeps its own copy of the icon files in `public/`.
  `ThemeToggle` and `lib/theme.ts` switch the light and the dark theme.
- `packages/auth` (`@daluang/auth`): sign-in with GitHub through Better Auth, the allow
  list, the rule of the sign-in guard, the session types, and the auth env schema. The
  sign-in button, the user menu, the route of `/api/auth/*`, and the guard middleware are
  in `apps/cms`. See `docs/auth.md`.
- `packages/notes` (`@daluang/notes`): the model of a note, its store in D1, and the
  handler of the endpoint `/api/notes`. The language tag, the languages setting, the
  slug, the core metadata, the extra fields and their definitions, and the rule of a
  translation. The route file is in `apps/cms`. See `docs/notes.md`.
- `packages/api-tokens` (`@daluang/api-tokens`): the API tokens that let a site read the
  published notes. Make, list, revoke, and check a token, and the handler of the endpoint
  `/api/tokens`. The page and the route files of the tokens are in `apps/cms`. See
  `docs/api-tokens.md`.
- `packages/webhooks` (`@daluang/webhooks`): the webhooks that tell a site to rebuild,
  their deliveries, and the handler of the endpoint `/api/webhooks`. The page and the
  route files of the webhooks are in `apps/cms`. See `docs/webhooks.md`.
- `packages/settings` (`@daluang/settings`): the settings of a CMS (the site and the
  languages), their store in D1, the handler of the endpoint `/api/settings`, and the
  rules of the onboarding of the first sign-in. The settings pages, the onboarding, the
  route file, and the middleware are in `apps/cms`. See `docs/settings.md`.
- `packages/tsconfig` (`@daluang/tsconfig`): the TypeScript base that each workspace
  extends.

To use a workspace package, write `"@daluang/<name>": "workspace:*"` in the
`package.json` by hand. Then run `pnpm install`. `pnpm add` puts a package in the
`catalog`, which is for versions.

Run each script from the root. `CONTRIBUTING.md` lists each script.

## Topic docs

`docs/` at the root holds one file for each topic of the code. These files are for a
person or an agent who changes Daluang. `apps/docs` is for a person who hosts Daluang.

**Read the file of a topic before you change that topic.** Update the file in the same
commit as the change.

| File                       | Topic                                                                     |
| -------------------------- | ------------------------------------------------------------------------- |
| `docs/code-conventions.md` | The rules for each file: modules, types, ts-belt, errors, React, styles   |
| `docs/testing.md`          | Which code needs a test, where the test goes, and the coverage thresholds |
| `docs/infrastructure.md`   | The hosting, the Workers, the release, the deploy, and the checks of CI   |
| `docs/auth.md`             | The sign-in with GitHub, the allow list, and the guard                    |
| `docs/security-headers.md` | The headers of each response and the Content Security Policy              |
| `docs/notes.md`            | The model of a note, and its store in D1                                  |
| `docs/settings.md`         | The settings, their store in D1, and the onboarding                       |
| `docs/api-tokens.md`       | The tokens that let a site read the published notes                       |
| `docs/webhooks.md`         | The webhooks that tell a site to rebuild                                  |
| `docs/app-shell.md`        | The app island, the menus of the sidebar, and the preferences             |

Read `docs/code-conventions.md` and `docs/testing.md` before the first code edit of a
session.

## Workflow

Each change goes to `main` through a pull request of its own. Keep each commit and each
pull request small: a small change is fast to review and safe to revert.
`CONTRIBUTING.md` has the branch names, the commit format, and each script. Read it
before the first commit of a session.

### Steps

1. Make a branch from `main` for the change: `type/short-description`. The type is the
   type of its commits and of the PR title.
2. Make one change of behavior in each commit, with its test and its docs.
3. Run `pnpm check`, `pnpm typecheck`, and `pnpm test` on your computer. Each one must
   pass.
4. If the change touches `apps/cms` or a package, run `pnpm build`.
5. If the change touches `apps/web` or `apps/docs`, run `pnpm web:build`.
6. If the change is visible in the interface, look at it in `pnpm dev`. Ask the person
   before you open a browser.
7. Compare the name of the branch with its commits. If the type is different, rename
   the branch with `git branch -m`.
8. Ask the person: "Shall I open a PR?"
9. If the answer is yes, push the branch. Then open the pull request with `gh pr create`,
   and fill in the template.
10. If the answer is no, stop. Tell the person that the branch is ready to push.

### Rules

- Do not push and do not open a pull request before the person answers yes.
- **Name each branch for its one change.** Do not collect changes on a long-lived
  branch, for example `chore/next`. Do not use a name with no subject: `next`, `wip`,
  `dev`, `temp`, or `misc`.
- Keep one subject in each pull request. If a pull request changes more than 400 lines
  of code, split it. Moved files and generated files do not count.
- If a task has two subjects, make two branches and two pull requests.
- The title of a pull request is a Conventional Commit, in lower case. The repository
  merges with squash only, so the title becomes the commit on `main`.
- **Do not mix commit types in one pull request.** Each commit has the type of the title.
  The squash merge keeps only the title, so release-please does not see the type of
  another commit. If the work needs a commit of another type, open a second pull
  request.
- Do not add a trailer, a session link, or a "generated with" line to a commit or a pull
  request.
- Do not skip a hook with `LEFTHOOK=0` or `--no-verify`. If a hook fails, correct the
  cause, then make the commit again.
- Do not run `cf:deploy`. `deploy.yml` deploys, after a release.
- A release is a tag that release-please cuts. Do not edit `CHANGELOG.md` or a `version`
  field by hand.
- When the person tells you that a pull request is merged, switch to `main` and pull.
  Then run `git fetch --prune`, delete each local branch whose remote is gone, and make
  a new branch for the next task.

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
- Phosphor for icons: `@phosphor-icons/react`. Import the name with the `Icon` suffix,
  for example `SunIcon`.
- TanStack Router (`@tanstack/react-router`) for the app island of the CMS.
- Better Auth (`better-auth`) for sign-in with GitHub, with Cloudflare D1 as its database.
- Cloudflare D1 is the database of the CMS. The binding is `DB`.
- Comark for Markdown: `comark` parses, `@comark/react` and `@comark/html` render.
- CodeMirror 6 for the Markdown editor of the CMS: `@codemirror/state`, `@codemirror/view`,
  and `@codemirror/lang-markdown`. It keeps the text as the writer types it, also the
  syntax of Comark, and it draws only the visible lines. It comes in with the editor.
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

A domain is one area of the product, with its own words: for example, the notes, the
settings, or the webhooks. A package holds the logic of one domain as plain functions.
An app connects that logic to a person, to a framework, and to the runtime.

### Packages

These rules are for the domain packages. `packages/ui` and `packages/tsconfig` are not
domain packages.

1. **A package holds the logic of one domain.** It holds functions, zod schemas, types,
   and constants. Name the package for its domain, for example `notes` or `webhooks`. Do
   not name a package for a technical layer: `utils`, `helpers`, or `types`.
2. **A package has no UI.** Do not put JSX, a React component, a hook, or HTML in a
   domain package. The UI primitives that `apps/cms` and `apps/web` share are in
   `packages/ui`.
3. **A package does not import a framework.** Do not import `react`, `astro`, `astro:*`,
   or `cloudflare:workers` in a domain package. A library of the domain is correct: zod,
   ts-belt, ts-pattern, and Better Auth on the server. `Request` and `Response` are Web
   standards, so a package can hold the handler of an endpoint.
4. **Write plain functions and data.** Do not add a class, a repository layer, or a
   service object. Use the words of the domain in the names.
5. **A computation is a pure function.** It gets each input as a parameter and returns a
   new value. It changes no input and no state outside the function. It does not read the
   clock, a random value, the environment, the network, or a global variable. For the
   same input, it gives the same output.
6. **Keep each side effect in a function of its own.** A side effect is a read or a write
   outside the function: D1, `fetch`, the clock, a random value, or a log. A side-effect
   function calls pure functions for its logic. A pure function never calls a side-effect
   function.
7. **A side-effect function gets each external system as a parameter:** the D1 binding,
   `fetch`, or the clock (`now: () => Date`). A test then gives a fake. `sendWebhook` of
   `packages/webhooks/src/deliver.ts` gets `fetcher` and `now` in this way. A random
   value from `crypto` is the exception: the function can call `crypto` directly.
8. **A comment above a side-effect function gives the side effect and its reason.** Start
   the comment with `Side effect:`, so that a search finds each one:

   ```ts
   /** Side effect: a POST to the webhook URL. The deploy hook of the site starts a rebuild. */
   export async function sendWebhook(send: WebhookSend): Promise<Delivery> {
   ```

9. **Packages are source-only.** `exports` points at `.ts` files, and Vite compiles them
   with the app. A package has no build step.
10. **Each entry is one file that defines its symbols.** Do not add a file that only
    exports from other files.
11. **Dependencies go in one direction.** `@daluang/tsconfig` and `@daluang/ui` import no
    domain package. A domain package can import another domain package. It does not
    import `@daluang/ui` or an app. Do not make a cycle. Across workspaces, import by
    package name.

### Apps

1. **The app connects the domains to a person and to the runtime.** It holds the pages,
   the components, the hooks, the endpoint files, the middleware, the Astro integrations,
   and the read of the environment. Logic that handles data goes in the package of its
   domain.
2. **Group the files of `src/` by kind, then by domain:**

   | Folder                 | Holds                                                                                  |
   | ---------------------- | -------------------------------------------------------------------------------------- |
   | `components/<domain>/` | The components of one domain, for example `components/webhooks/webhook-card.tsx`       |
   | `components/shared/`   | A component that two or more domains use, and that is not a primitive                  |
   | `hooks/<domain>/`      | The hooks of one domain. `hooks/shared/` holds a hook that two or more domains use.    |
   | `lib/<domain>/`        | The code of one domain with no JSX: the calls of an endpoint, the middleware, and more |
   | `lib/shared/`          | The code with no JSX that two or more domains use                                      |
   | `pages/`               | The Astro routes only                                                                  |
   | `layouts/`             | The Astro layouts                                                                      |
   | `routes/`              | The router of the app island, its root, and one route file for each page               |
   | `styles/`              | The global CSS                                                                         |

3. **A domain folder has the name of its package:** `auth`, `notes`, `settings`,
   `api-tokens`, or `webhooks`. A domain of the app only has its own name, for example
   `shell` or `security`.
4. **If a second domain imports a file, move the file to `shared/`.** A primitive stays in
   `packages/ui`.
5. **A file in `pages/` is thin.** A page renders components. An endpoint reads the
   request, calls a function of its domain, and returns the answer. Do not put a
   component or logic in `pages/`.
6. **One module reads the environment of a domain.** `lib/<domain>/env.ts` reads the
   bindings and the variables from `cloudflare:workers`. It validates them with the zod
   schema of the package. All other code gets a value as a parameter. Do not read
   `import.meta.env` or `process.env` for a server value.
7. **The app imports with `@/`.** `@/` is `apps/cms/src`. Do not write `../` in the app.
   A file in the same folder keeps `./`. In a package, import by relative path.
8. `apps/web` obeys the same layout. `apps/docs` obeys the layout of Vocs: its pages are
   the Markdown files in `src/pages/`.

## Documentation

- A document is part of the change. If a change makes a document false, update the
  document in the same commit.
- Write each document, commit message, and error message in Simplified Technical English
  (ASD-STE100). The `ste` skill has the rules.
- Describe what the code does now. Verify each statement against the code.
- A file of `docs/` has one topic. If a new topic does not fit a file, add a file and a
  row to the table of "Topic docs".
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
| `tailwind-design-system`: Radix UI, `asChild`, `lucide-react` | Base UI, the `render` prop, and Phosphor           |
| `tailwind-design-system`: `clsx` with `tailwind-merge`        | The package `cn`                                   |
