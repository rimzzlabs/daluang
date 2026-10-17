import { fieldDefinitionsSchema } from "@daluang/notes/field-definitions";
import { languagesSettingSchema } from "@daluang/notes/languages-setting";
import { A, O, pipe } from "@mobily/ts-belt";
import { z } from "zod";
import {
	SETTING_KEYS,
	type SettingKey,
	type StoredSettings,
	type settingsPatchSchema,
} from "./settings";
import { siteSettingSchema } from "./site";

const rowSchema = z.object({ key: z.string(), value: z.string() });

type SettingRow = z.infer<typeof rowSchema>;

interface SettingRead<T> {
	rows: readonly SettingRow[];
	key: SettingKey;
	schema: z.ZodType<T>;
}

/**
 * Side effect: writes to the log when the schema refuses a stored value. The owner can
 * then find the key.
 *
 * The value of one setting, or `null` when it has no row. A value that its schema refuses
 * is `null` also, so the CMS asks the writer for it again. The log tells the owner why.
 */
function readSetting<T>(read: SettingRead<T>): T | null {
	const row = A.find(read.rows, (item) => item.key === read.key);
	if (O.isNone(row)) return null;
	const parsed = read.schema.safeParse(
		O.fromExecution((): unknown => JSON.parse(row.value)),
	);
	if (parsed.success) return parsed.data;
	console.error(
		`The setting "${read.key}" in D1 is not valid. The CMS asks for it again.`,
	);
	return null;
}

/**
 * Side effect: reads the table `setting` of D1, because D1 keeps the settings.
 *
 * Reads each setting from the `setting` table of D1.
 */
export async function readSettings(db: D1Database): Promise<StoredSettings> {
	const result = await db.prepare('select "key", "value" from "setting"').all();
	const rows = A.filterMap(result.results, (row) =>
		O.fromNullable(rowSchema.safeParse(row).data),
	);
	return {
		site: readSetting({ rows, key: "site", schema: siteSettingSchema }),
		languages: readSetting({
			rows,
			key: "languages",
			schema: languagesSettingSchema,
		}),
		fields: readSetting({
			rows,
			key: "fields",
			schema: fieldDefinitionsSchema,
		}),
	};
}

const UPSERT = `insert into "setting" ("key", "value", "updatedAt") values (?1, ?2, ?3)
on conflict ("key") do update set "value" = excluded."value", "updatedAt" = excluded."updatedAt"`;

export interface SettingsWrite {
	db: D1Database;
	/** A patch that `settingsPatchSchema` accepted. */
	patch: z.output<typeof settingsPatchSchema>;
	now: Date;
}

/**
 * Side effect: writes the table `setting` of D1 in one batch, so that the settings stay
 * after this request.
 *
 * Writes each setting of the patch. D1 runs the batch as one transaction.
 */
export async function writeSettings(write: SettingsWrite): Promise<void> {
	const updatedAt = write.now.toISOString();
	const statements = pipe(
		SETTING_KEYS,
		A.filterMap((key) =>
			O.map(O.fromNullable(write.patch[key]), (value) =>
				write.db.prepare(UPSERT).bind(key, JSON.stringify(value), updatedAt),
			),
		),
	);
	if (A.isEmpty(statements)) return;
	await write.db.batch([...statements]);
}
