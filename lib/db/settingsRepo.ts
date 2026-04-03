// lib/db/settingsRepo.ts
import { getDb, type SettingsRecord } from "./idb";

export async function settingsGet<K extends SettingsRecord["key"]>(
  key: K
): Promise<Extract<SettingsRecord, { key: K }> | undefined> {
  const db = await getDb();
return (await db.get("settings", key)) as Extract<SettingsRecord, { key: K }> | undefined;
}

export async function settingsSet(record: SettingsRecord) {
  const db = await getDb();
  const tx = db.transaction("settings", "readwrite");
  await tx.store.put(record);
  await tx.done;
}

export async function settingsInitDefaults() {
  const existingCurrency = await settingsGet("currency");
  if (!existingCurrency) await settingsSet({ key: "currency", value: "PHP" });

  const existingDays = await settingsGet("reminderDaysBefore");
  if (!existingDays) await settingsSet({ key: "reminderDaysBefore", value: 3 });

  const push = await settingsGet("remindViaPush");
  if (!push) await settingsSet({ key: "remindViaPush", value: true });

  const email = await settingsGet("remindViaEmail");
  if (!email) await settingsSet({ key: "remindViaEmail", value: false });

const sc = await settingsGet("showCanceled");
  if (!sc) await settingsSet({ key: "showCanceled", value: false });
}
