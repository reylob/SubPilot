// lib/detect/detectRecurring.ts
import type { TransactionRecord, SubscriptionRecord } from "@/lib/db/idb";

type Cadence = SubscriptionRecord["cadence"];

function daysBetween(aIso: string, bIso: string) {
  const a = new Date(aIso + "T00:00:00Z").getTime();
  const b = new Date(bIso + "T00:00:00Z").getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function median(nums: number[]) {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

function mean(nums: number[]) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function stddev(nums: number[]) {
  if (nums.length < 2) return 0;
  const m = mean(nums);
  const variance = mean(nums.map((x) => (x - m) ** 2));
  return Math.sqrt(variance);
}

function classifyCadence(deltas: number[]): { cadence: Cadence; cadenceScore: number; medianDelta: number } {
  if (deltas.length < 2) return { cadence: "unknown", cadenceScore: 0, medianDelta: 0 };

  const m = median(deltas);

  // Tolerance windows
  const inRange = (x: number, lo: number, hi: number) => x >= lo && x <= hi;

  // Score: how many deltas fall into the cadence window
  const scoreWindow = (lo: number, hi: number) => {
    const hits = deltas.filter((d) => inRange(d, lo, hi)).length;
    return Math.round((hits / deltas.length) * 50); // max 50 points
  };

  // Prefer the best cadence window
  const weeklyScore = scoreWindow(6, 8);
  const monthlyScore = scoreWindow(28, 32);
  const annualScore = scoreWindow(350, 380);

  const best = [
    { cadence: "weekly" as const, s: weeklyScore, md: m },
    { cadence: "monthly" as const, s: monthlyScore, md: m },
    { cadence: "annual" as const, s: annualScore, md: m },
  ].sort((a, b) => b.s - a.s)[0]!;

  // If confidence too low, unknown
  if (best.s < 25) return { cadence: "unknown", cadenceScore: best.s, medianDelta: m };
  return { cadence: best.cadence, cadenceScore: best.s, medianDelta: m };
}

function amountStabilityScore(amounts: number[]) {
  // amounts should be debits only (negative). Use absolute values for stability.
  const abs = amounts.map((x) => Math.abs(x));
  if (abs.length < 2) return 0;

  const m = mean(abs);
  if (m === 0) return 0;

  const sd = stddev(abs);
  const cv = sd / m; // coefficient of variation

  // cv small => stable
  if (cv < 0.03) return 25;
  if (cv < 0.08) return 20;
  if (cv < 0.15) return 12;
  return 5;
}

function countScore(n: number) {
  // max 15
  if (n >= 6) return 15;
  if (n === 5) return 13;
  if (n === 4) return 10;
  if (n === 3) return 7;
  return 0;
}

function recencyScore(lastIso: string) {
  const last = new Date(lastIso + "T00:00:00Z").getTime();
  const now = Date.now();
  const days = Math.floor((now - last) / (1000 * 60 * 60 * 24));
  // max 10
  if (days <= 7) return 10;
  if (days <= 30) return 8;
  if (days <= 60) return 6;
  if (days <= 120) return 3;
  return 0;
}

function displayNameFromCanonical(c: string) {
  // Simple title-case-ish
  const words = c
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .slice(0, 4)
    .map((w) => w[0]!.toUpperCase() + w.slice(1));
  return words.join(" ") || "Unknown";
}

export function detectRecurring(transactions: TransactionRecord[]): SubscriptionRecord[] {
  // Use debits only for subscription detection
  const debits = transactions.filter((t) => t.direction === "debit" && t.amount !== 0);

  const byMerchant = new Map<string, TransactionRecord[]>();
  for (const t of debits) {
    const key = t.merchantCanonical || "UNKNOWN";
    const arr = byMerchant.get(key) ?? [];
    arr.push(t);
    byMerchant.set(key, arr);
  }

  const out: SubscriptionRecord[] = [];

  for (const [merchantCanonical, txs] of byMerchant.entries()) {
    if (txs.length < 3) continue; // MVP: need at least 3 occurrences

    // sort oldest -> newest
    txs.sort((a, b) => (a.postedAt < b.postedAt ? -1 : 1));

    const deltas: number[] = [];
    for (let i = 1; i < txs.length; i++) {
      deltas.push(daysBetween(txs[i - 1]!.postedAt, txs[i]!.postedAt));
    }

    const amounts = txs.map((t) => t.amount);

    const { cadence, cadenceScore, medianDelta } = classifyCadence(deltas);
    const amtScore = amountStabilityScore(amounts);
    const occScore = countScore(txs.length);
    const recScore = recencyScore(txs[txs.length - 1]!.postedAt);

    let confidence = cadenceScore + amtScore + occScore + recScore; // max ~100
    confidence = Math.max(0, Math.min(100, confidence));

    const last = txs[txs.length - 1]!;
    const avgAmount = mean(amounts.map((x) => Math.abs(x)));

    const nextRenewalAt =
      cadence !== "unknown" && medianDelta > 0
        ? new Date(new Date(last.postedAt + "T00:00:00Z").getTime() + medianDelta * 86400000)
            .toISOString()
            .slice(0, 10)
        : null;

    out.push({
      id: `sub_${merchantCanonical}`,
      merchantCanonical,
      displayName: displayNameFromCanonical(merchantCanonical),
      status: confidence >= 70 ? "active" : "possible",
      cadence,
      confidence,
      avgAmount,
      lastAmount: Math.abs(last.amount),
      lastChargeAt: last.postedAt,
      nextRenewalAt,
      reminderDaysBefore: 3,
      remindViaPush: true,
      remindViaEmail: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // Highest confidence first, then highest avg amount
  out.sort((a, b) => (b.confidence - a.confidence) || (b.avgAmount - a.avgAmount));
  return out;
}