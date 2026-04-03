// lib/db/transactionsRepo.ts
import { getDb, type TransactionRecord } from "./idb";

export async function txClearAll() {
  const db = await getDb();
  const tx = db.transaction("transactions", "readwrite");
  await tx.store.clear();
  await tx.done;
}

export async function txPutMany(items: TransactionRecord[]) {
  const db = await getDb();
  const tx = db.transaction("transactions", "readwrite");
  for (const item of items) await tx.store.put(item);
  await tx.done;
}

export async function txListAll(): Promise<TransactionRecord[]> {
  const db = await getDb();
  return db.getAll("transactions");
}

export async function txListRecent(limit = 200): Promise<TransactionRecord[]> {
  const db = await getDb();
  const all = await db.getAll("transactions");
  all.sort((a, b) => (a.postedAt < b.postedAt ? 1 : -1));
  return all.slice(0, limit);
}

export async function txListByMerchantCanonical(merchantCanonical: string): Promise<TransactionRecord[]> {
  const db = await getDb();
  const idx = db.transaction("transactions", "readonly").store.index("by-merchant");
  const rows = await idx.getAll(merchantCanonical);
  rows.sort((a, b) => (a.postedAt < b.postedAt ? 1 : -1));
  return rows;
}