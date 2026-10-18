# App shell

This page tells how the pages behind the sign-in work: the app island, the menus of the
sidebar, and the preferences of the interface.

## The app island

The pages of the CMS behind the sign-in are one React island with TanStack Router, as in
planout-ai. The sidebar and the navbar stay, and a menu click changes only the page.

- `apps/cms/src/pages/[...path].astro` opens the island for each path that is not the
  sign-in page and not an endpoint. A path with no page gets the status 404.
- `apps/cms/src/pages/api/[...path].ts` answers 404 as JSON for a path below `/api/` that
  no endpoint has. A `fetch` then reads a failure, not the HTML of a page.
- The island is `client:only`, because the router reads the browser history when it
  starts. `routes/app.tsx` is its root, and `routes/router.ts` has the route tree.
- The root route renders `AppShell` around an `<Outlet />`.
- **The first commit of the router is empty.** So the server renders the frame and the
  page as HTML in `[data-static-shell]`, beside the island and not in its fallback slot.
  The root route deletes that HTML in a layout effect, before the first paint of the
  island. The two give the same HTML, so the person sees no change.
- A menu link is `<Link>` of the router in the island, and `<a>` in the HTML of the server
  (`navLinkElement`).
- `routes/` holds the router, the root of the island, and a component for each page.
- **Each page gets `AppPageProps`**: `settings`, a `SettingsStore`, `changes`, a
  `ChangesStore`, and `linkKind`.
  `PageContent` of the server gives `anchor`, and `routePage` of the router gives
  `router`. A route component is `routePage(path)`. A link in a page is `NavLink`.
- The island makes one `SettingsStore` from the settings of the server, and puts it in the
  router context. A settings page writes the saved settings to it, and `useSettings`
  renders each reader again. The sidebar shows the new site name at once.
- The island also puts a `ChangesStore` in the router context, with the number of
  changes from the server. The Publish changes button of the navbar reads it and writes
  it, and the posts page writes it (`docs/notes.md`).

## Menus

- `NAV_GROUPS` in `apps/cms/src/components/shell/app-sidebar.tsx` holds the menus of the
  sidebar: Write (Posts, Media), Publish (API tokens, Webhooks), and Settings (Site,
  Languages, Fields).
- Each item has a page in `APP_PAGES` (`apps/cms/src/lib/shell/app-pages.ts`), a component in
  `PAGE_COMPONENTS` (`routes/page-content.tsx`), and a route in `routes/router.ts`. Add
  the three together. Do not add an item with no page.
- A page with no feature yet uses `LaterPage`, which says what the page will do.
- An item is active on its page and on each page below its path. `/` is active only on
  `/`.
- An item can have a `section`: each page below that path also makes the item active.
  Posts has the section `/posts`, so it is active in the editor.

## Pages with a parameter

- A path of `APP_PAGES` can have a parameter, as in TanStack Router: `/posts/$id`.
  `matchesPage` matches a parameter with one segment that is not empty.
- `findAppPage` takes the first match. A page with no parameter comes first, so
  `/posts/new` is not a post with the ID `new`.
- `/posts/new` and `/posts/$id` are the pages of the editor. `/posts/$id` uses
  `LaterPage` until the page of a post comes.
- A page that navigates after an action, for example after Save, reads the router with
  `useRouter({ warn: false })`. The server renders the page with no router, and only an
  action in the island navigates.

## Preferences

- The preferences of the interface are in localStorage: the theme
  (`daluang:theme`), and the open state and the width of the sidebar
  (`daluang:sidebar-state`, `daluang:sidebar-width`). Each key starts with `daluang:`,
  because each dev server on `localhost` shares one storage.
- `PREFERENCES_SCRIPT` of `@daluang/ui/lib/preferences-script` applies them before the
  first paint. Each app puts it first in the `<head>`:
  `<script is:inline set:html={PREFERENCES_SCRIPT} />`. Do not write a second script for
  a preference. A new preference goes in this script.
- The server cannot read localStorage, so it renders the default sidebar. The script
  watches the parser and gives the sidebar of `[data-static-shell]` its saved state and
  width before the first paint.
- The theme has no server value, so `ThemeToggle` shows one icon for the two themes. The
  server HTML and the browser then show the same icon.
- In the browser, `readSidebarPreferences` of `@daluang/ui/lib/sidebar-preferences`
  reads the sidebar keys, and `SidebarProvider` writes them.
