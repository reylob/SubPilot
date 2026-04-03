// lib/db/subscriptionsRepo.ts
import { getDb, type SubscriptionRecord } from "./idb";

export async function subClearAll() {
  const db = await getDb();
  const tx = db.transaction("subscriptions", "readwrite");
  await tx.store.clear();
  await tx.done;
}

export async function subPutMany(items: SubscriptionRecord[]) {
  const db = await getDb();
  const tx = db.transaction("subscriptions", "readwrite");
  for (const item of items) await tx.store.put(item);
  await tx.done;
}

export async function subListAll(): Promise<SubscriptionRecord[]> {
  const db = await getDb();
  return db.getAll("subscriptions");
}

export async function subGet(id: string): Promise<SubscriptionRecord | undefined> {
  const db = await getDb();
  return db.get("subscriptions", id);
}

export async function subPutOne(item: SubscriptionRecord) {
  const db = await getDb();
  const tx = db.transaction("subscriptions", "readwrite");
  await tx.store.put(item);
  await tx.done;
}

export async function subUpdateStatus(id: string, status: SubscriptionRecord["status"]) {
  const db = await getDb();
  const existing = await db.get("subscriptions", id);
  if (!existing) return;

  const next: SubscriptionRecord = { ...existing, status, updatedAt: new Date().toISOString() };
  const tx = db.transaction("subscriptions", "readwrite");
  await tx.store.put(next);
  await tx.done;
}