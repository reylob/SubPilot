// lib/db/idb.ts
import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export type TxDirection = "debit" | "credit";

export type TransactionRecord = {
  id: string;
  postedAt: string; // ISO date string (YYYY-MM-DD)
  descriptionRaw: string;
  merchantRaw: string;
  merchantCanonical: string;
  amount: number; // negative for debits, positive for credits
  currency: string; // e.g. "PHP"
  direction: TxDirection;
  createdAt: string; // ISO datetime
};

export type SubscriptionRecord = {
  id: string;
  merchantCanonical: string;
  displayName: string;
  status: "possible" | "active" | "canceled";
  cadence: "weekly" | "monthly" | "annual" | "unknown";
  confidence: number; // 0..100
  avgAmount: number;
  lastAmount: number;
  lastChargeAt: string; // ISO date
  nextRenewalAt: string | null; // ISO date
  reminderDaysBefore: number;
  remindViaPush: boolean;
  remindViaEmail: boolean;
  updatedAt: string;
  createdAt: string;
};

export type SettingsRecord =
  | { key: "currency"; value: string }
  | { key: "reminderDaysBefore"; value: number }
  | { key: "remindViaPush"; value: boolean }
  | { key: "remindViaEmail"; value: boolean }
  | { key: "showCanceled"; value: boolean };

interface SubPilotDB extends DBSchema {
  transactions: {
    key: string;
    value: TransactionRecord;
    indexes: { "by-postedAt": string; "by-merchant": string };
  };
  subscriptions: {
    key: string;
    value: SubscriptionRecord;
    indexes: { "by-merchant": string; "by-status": string };
  };
  settings: {
    key: SettingsRecord["key"];
    value: SettingsRecord;
  };
}

const DB_NAME = "subpilot-db";
const DB_VERSION = 1;

let _db: Promise<IDBPDatabase<SubPilotDB>> | null = null;

export function getDb() {
  if (!_db) {
    _db = openDB<SubPilotDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Transactions
        const tx = db.createObjectStore("transactions", { keyPath: "id" });
        tx.createIndex("by-postedAt", "postedAt");
        tx.createIndex("by-merchant", "merchantCanonical");

        // Subscriptions
        const subs = db.createObjectStore("subscriptions", { keyPath: "id" });
        subs.createIndex("by-merchant", "merchantCanonical");
        subs.createIndex("by-status", "status");

        // Settings
        db.createObjectStore("settings", { keyPath: "key" });
      },
    });
  }
  return _db;
}