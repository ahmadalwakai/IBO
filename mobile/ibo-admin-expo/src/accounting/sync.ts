import type { AccountingData } from "./types";

type Entity = { id: string };

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Three-way merge per record against the last synced state: a record changed on
 * only one side keeps that change, a record changed on both sides keeps the local
 * version, and a deletion wins unless the other side edited the record.
 */
export function mergeList<T extends Entity>(base: T[], local: T[], remote: T[]): T[] {
  const baseById = new Map(base.map((item) => [item.id, item]));
  const localById = new Map(local.map((item) => [item.id, item]));
  const remoteById = new Map(remote.map((item) => [item.id, item]));
  const order = [...local.map((item) => item.id), ...remote.map((item) => item.id).filter((id) => !localById.has(id))];
  const ids = new Set([...order, ...baseById.keys()]);

  const result: T[] = [];
  for (const id of ids) {
    const original = baseById.get(id);
    const mine = localById.get(id);
    const theirs = remoteById.get(id);
    const localChanged = !same(original, mine);
    const remoteChanged = !same(original, theirs);
    const pick = localChanged && remoteChanged ? (mine ?? theirs) : localChanged ? mine : theirs;
    if (pick) result.push(pick);
  }
  return result.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
}

export function mergeData(base: AccountingData, local: AccountingData, remote: AccountingData): AccountingData {
  const counters = { ...remote.counters };
  for (const [key, value] of Object.entries(local.counters)) counters[key] = Math.max(value, counters[key] ?? 0);
  return {
    ...local,
    company: same(base.company, local.company) ? remote.company : local.company,
    customers: mergeList(base.customers, local.customers, remote.customers),
    invoices: mergeList(base.invoices, local.invoices, remote.invoices),
    expenses: mergeList(base.expenses, local.expenses, remote.expenses),
    documents: mergeList(base.documents, local.documents, remote.documents),
    counters,
  };
}

export function hasContent(data: AccountingData) {
  return data.customers.length + data.invoices.length + data.expenses.length + data.documents.length > 0;
}

export type SyncState = {
  revision: number;
  dirty: boolean;
  lastSyncedAt: string | null;
};

export type SyncStatus =
  | { kind: "disabled" }
  | { kind: "syncing" }
  | { kind: "synced"; at: string }
  | { kind: "offline"; message: string }
  | { kind: "unauthorized" };

export type ServerConfig = { baseURL: string; token: string };

export function syncLabel(status: SyncStatus) {
  switch (status.kind) {
    case "disabled":
      return "Nur auf diesem Gerät gespeichert";
    case "syncing":
      return "Synchronisiere…";
    case "synced":
      return `Synchronisiert ${new Date(status.at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`;
    case "offline":
      return "Offline · lokal gespeichert";
    case "unauthorized":
      return "Bitte erneut anmelden";
  }
}

type RemoteSnapshot = { revision: number; data: AccountingData | null };

export class UnauthorizedError extends Error {}

async function call<T>(server: ServerConfig, init: RequestInit = {}): Promise<{ status: number; body: T }> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${server.token}`);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  const response = await fetch(`${server.baseURL}/api/admin/accounting`, { ...init, headers });
  if (response.status === 401) throw new UnauthorizedError("Anmeldung abgelaufen");
  const body = (await response.json().catch(() => ({}))) as T;
  if (!response.ok && response.status !== 409) {
    throw new Error((body as { error?: string }).error ?? `Serverfehler ${response.status}`);
  }
  return { status: response.status, body };
}

export const fetchRemote = (server: ServerConfig) => call<RemoteSnapshot>(server).then((result) => result.body);

export async function pushRemote(server: ServerConfig, baseRevision: number, data: AccountingData) {
  const result = await call<{ revision: number }>(server, { method: "PUT", body: JSON.stringify({ baseRevision, data }) });
  return result.status === 409 ? null : result.body.revision;
}

export const documentUrl = (server: ServerConfig, fileName: string) =>
  `${server.baseURL}/api/admin/accounting/documents/${encodeURIComponent(fileName)}`;
