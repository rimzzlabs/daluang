# Settings and onboarding

This page tells how the CMS keeps its settings, and how the first sign-in asks for them.
The logic is in `packages/settings`. The settings pages and the onboarding are in
`apps/cms/src/components/settings/`, and their calls of the endpoint are in
`apps/cms/src/lib/settings/client.ts`.

## Store

- **The settings are in the D1 table `setting`** (`apps/cms/migrations/0002_settings.sql`):
  one row for each key of `SETTING_KEYS` (`site`, `languages`, `fields`), with a JSON
  value. Each read validates the value with the schema of its key. A value that the schema
  refuses reads as `null`, and the log names the key.
- The settings are complete when the site and the languages have a valid value.
  `settingsState` gives `complete` or `needed`. The fields are optional: no value is no
  extra field.
- `GET /api/settings` gives the stored settings. `PATCH /api/settings` writes one setting
  or more, each with its full value, in one D1 batch. A refused value answers 422 with the
  message of each field.

## Onboarding

- **The middleware of the settings reads them for each page**, after the sign-in guard,
  and puts them in `Astro.locals.settings`. The value is `null` for `/sign-in` and for an
  endpoint.
- **With no complete settings, each page opens `/welcome`.** With complete settings,
  `/welcome` opens `/`. `decideOnboarding` of `packages/settings/src/onboarding.ts` has
  the rule. The app page `[...path].astro` gets complete settings.
- `/welcome` (`apps/cms/src/pages/welcome.astro`) is the onboarding: the site, the
  languages, and a summary. The island `Onboarding` saves the answers in one request, then
  opens `/` with a full page load. The first languages come from `Accept-Language`.

## Settings pages

- The settings pages `/settings/site` and `/settings/languages` change the answers of the
  onboarding. `SiteSettings` and `LanguagesSettings` of `apps/cms/src/components/settings/` are their
  components.
- **`/settings/fields` defines the extra fields of the site**: a label, a frontmatter
  name, a type (`FIELD_TYPES`), and if a note needs a value. `fieldDefinitionsSchema` of
  `packages/notes/src/field-definitions.ts` refuses a core name and a second field with
  the same name. The name follows the label (`fieldNameFromLabel`) until the writer types
  one. `FIELD_SUGGESTIONS` adds a common field with one click.

## Add a setting

1. Add its key to `SETTING_KEYS`.
2. Add its schema to `SETTING_SCHEMAS`, `storedSettingsSchema`, and `settingsPatchSchema`.
3. If a writer needs it before the first note, add a step to the onboarding.
