import { File } from "expo-file-system";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import { addDays, createId, nextDocumentNumber, nextRecurrenceDate, todayISO } from "./calc";
import {
  documentFile,
  loadData,
  loadSyncState,
  normalizeData,
  removeDocumentFile,
  saveData,
  saveSyncState,
  type CompanySeed,
} from "./storage";
import {
  documentUrl,
  fetchRemote,
  hasContent,
  mergeData,
  pushRemote,
  UnauthorizedError,
  type ServerConfig,
  type SyncState,
  type SyncStatus,
} from "./sync";
import type { AccountingData, Customer, Expense, Invoice, StoredDocument } from "./types";

const maxUploadBytes = 4 * 1024 * 1024;

type Store = {
  data: AccountingData;
  syncStatus: SyncStatus;
  syncNow: () => void;
  ensureDocument: (doc: StoredDocument) => Promise<string | null>;
  update: (updater: (draft: AccountingData) => AccountingData) => void;
  saveCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  newInvoice: (kind: Invoice["kind"], customerId?: string) => Invoice;
  saveInvoice: (invoice: Invoice, note?: string) => Invoice;
  deleteInvoice: (id: string) => void;
  finalizeInvoice: (invoice: Invoice) => Invoice;
  markPaid: (invoice: Invoice, paidAt?: string) => Invoice;
  correctInvoice: (invoice: Invoice) => Invoice;
  cancelInvoice: (invoice: Invoice) => void;
  convertOffer: (offer: Invoice) => Invoice;
  createRecurring: (invoice: Invoice) => Invoice;
  saveExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  addDocument: (doc: StoredDocument) => void;
  saveDocument: (doc: StoredDocument) => void;
  deleteDocument: (id: string) => void;
};

const AccountingContext = createContext<Store | null>(null);

const historyEntry = (text: string) => ({ at: new Date().toISOString(), text });

function upsert<T extends { id: string }>(list: T[], item: T) {
  return list.some((entry) => entry.id === item.id) ? list.map((entry) => (entry.id === item.id ? item : entry)) : [item, ...list];
}

export function AccountingProvider({
  seed,
  server,
  onUnauthorized,
  children,
  loading,
}: {
  seed?: CompanySeed;
  server?: ServerConfig;
  onUnauthorized?: () => void;
  children: React.ReactNode;
  loading: React.ReactNode;
}) {
  const [data, setData] = useState<AccountingData | null>(null);
  const dataRef = useRef<AccountingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(server ? { kind: "syncing" } : { kind: "disabled" });
  const syncMeta = useRef<{ state: SyncState; base: AccountingData } | null>(null);
  const syncing = useRef(false);
  const rerun = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runSyncRef = useRef<() => Promise<void>>(async () => {});

  const applyLocal = useCallback((next: AccountingData) => {
    dataRef.current = next;
    setData(next);
    saveData(next);
  }, []);

  const scheduleSync = useCallback((delay: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void runSyncRef.current(), delay);
  }, []);

  const update = useCallback(
    (updater: (draft: AccountingData) => AccountingData) => {
      const current = dataRef.current;
      if (!current) return;
      applyLocal(updater(current));
      const meta = syncMeta.current;
      if (meta && !meta.state.dirty) {
        meta.state = { ...meta.state, dirty: true };
        saveSyncState(meta.state);
      }
      scheduleSync(1500);
    },
    [applyLocal, scheduleSync],
  );

  const commitSync = useCallback((revision: number, base: AccountingData) => {
    const state: SyncState = { revision, dirty: dataRef.current !== base, lastSyncedAt: new Date().toISOString() };
    syncMeta.current = { state, base };
    saveSyncState(state, base);
  }, []);

  /** Uploads archived files the server does not have yet, then flags them in one change. */
  const uploadDocuments = useCallback(async () => {
    if (!server || !dataRef.current) return;
    const uploaded: string[] = [];
    for (const doc of dataRef.current.documents.filter((item) => !item.remote && item.size <= maxUploadBytes)) {
      const file = documentFile(doc);
      if (!file.exists) continue;
      const result = await file.upload(documentUrl(server, doc.fileName), {
        httpMethod: "PUT",
        headers: { Authorization: `Bearer ${server.token}` },
        mimeType: doc.mimeType,
      });
      if (result.status === 401) throw new UnauthorizedError("Anmeldung abgelaufen");
      if (result.status >= 200 && result.status < 300) uploaded.push(doc.id);
    }
    if (uploaded.length) {
      update((draft) => ({
        ...draft,
        documents: draft.documents.map((doc) => (uploaded.includes(doc.id) ? { ...doc, remote: true } : doc)),
      }));
    }
  }, [server, update]);

  const runSync = useCallback(async () => {
    if (!server || !syncMeta.current || !dataRef.current) return;
    if (syncing.current) {
      rerun.current = true;
      return;
    }
    syncing.current = true;
    setSyncStatus({ kind: "syncing" });
    let failed = false;
    try {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const meta = syncMeta.current as { state: SyncState; base: AccountingData };
        const local = dataRef.current as AccountingData;
        const remote = await fetchRemote(server);
        // Local edits during the request make this round stale; start over with fresh data.
        if (dataRef.current !== local) continue;

        const remoteData = remote.data ? normalizeData(remote.data, seed) : null;
        let target = local;
        let push = meta.state.dirty;
        if (!remoteData) {
          push = push || hasContent(local);
        } else if (remote.revision !== meta.state.revision) {
          if (meta.state.dirty) {
            target = mergeData(meta.base, local, remoteData);
          } else {
            target = remoteData;
            push = false;
          }
        }

        if (target !== local) applyLocal(target);
        if (!push) {
          commitSync(remote.revision, target);
          break;
        }
        const revision = await pushRemote(server, remote.revision, target);
        if (revision === null) continue;
        commitSync(revision, target);
        break;
      }
      await uploadDocuments();
      setSyncStatus({ kind: "synced", at: new Date().toISOString() });
    } catch (reason) {
      failed = true;
      if (reason instanceof UnauthorizedError) {
        setSyncStatus({ kind: "unauthorized" });
        onUnauthorized?.();
      } else {
        setSyncStatus({ kind: "offline", message: reason instanceof Error ? reason.message : String(reason) });
      }
    } finally {
      syncing.current = false;
      // Offline retries happen on the periodic timer instead of in a tight loop.
      if (!failed && (rerun.current || syncMeta.current?.state.dirty)) {
        rerun.current = false;
        scheduleSync(1500);
      }
    }
  }, [applyLocal, commitSync, onUnauthorized, scheduleSync, seed, server, uploadDocuments]);

  useEffect(() => {
    runSyncRef.current = runSync;
  }, [runSync]);

  useEffect(() => {
    loadData(seed)
      .then(async (loaded) => {
        syncMeta.current = await loadSyncState(loaded);
        dataRef.current = loaded;
        setData(loaded);
        void runSyncRef.current();
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : String(reason)));
    // The seed only fills an empty profile on first launch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!server) return;
    const interval = setInterval(() => void runSyncRef.current(), 60_000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void runSyncRef.current();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [server]);

  const ensureDocument = useCallback(
    async (doc: StoredDocument) => {
      const file = documentFile(doc);
      if (file.exists) return file.uri;
      if (!server || !doc.remote) return null;
      const downloaded = await File.downloadFileAsync(documentUrl(server, doc.fileName), file, {
        headers: { Authorization: `Bearer ${server.token}` },
        idempotent: true,
      });
      return downloaded.uri;
    },
    [server],
  );

  const store = useMemo<Store | null>(() => {
    if (!data) return null;
    const read = () => dataRef.current as AccountingData;

    const saveInvoice = (invoice: Invoice, note?: string) => {
      const saved = note ? { ...invoice, history: [...invoice.history, historyEntry(note)] } : invoice;
      update((draft) => ({ ...draft, invoices: upsert(draft.invoices, saved) }));
      return saved;
    };

    /** Drafts get their final number when they are issued, so numbers stay gap-free. */
    const assignNumber = (invoice: Invoice) => {
      if (!invoice.number.startsWith("ENTWURF")) return invoice;
      const { number, counters } = nextDocumentNumber(read(), invoice.kind, invoice.issueDate);
      update((draft) => ({ ...draft, counters }));
      return { ...invoice, number };
    };

    const blankInvoice = (kind: Invoice["kind"], customerId = ""): Invoice => {
      const issueDate = todayISO();
      return {
        id: createId(kind === "invoice" ? "inv" : "off"),
        kind,
        number: `ENTWURF-${Date.now().toString(36).toUpperCase()}`,
        customerId,
        issueDate,
        serviceDate: issueDate,
        dueDate: addDays(issueDate, kind === "invoice" ? read().company.paymentTermDays : 30),
        status: "draft",
        items: [{ id: createId("item"), description: "", quantity: 1, unit: "Stk.", unitPrice: 0, discount: 0, vatRate: 19 }],
        discount: 0,
        notes: "",
        recurrence: "none",
        history: [historyEntry(kind === "invoice" ? "Rechnung angelegt" : "Angebot angelegt")],
        createdAt: new Date().toISOString(),
      };
    };

    return {
      data,
      syncStatus,
      syncNow: () => void runSyncRef.current(),
      ensureDocument,
      update,
      saveCustomer: (customer) => update((draft) => ({ ...draft, customers: upsert(draft.customers, customer) })),
      deleteCustomer: (id) => update((draft) => ({ ...draft, customers: draft.customers.filter((customer) => customer.id !== id) })),
      newInvoice: blankInvoice,
      saveInvoice,
      deleteInvoice: (id) => update((draft) => ({ ...draft, invoices: draft.invoices.filter((invoice) => invoice.id !== id) })),
      finalizeInvoice: (invoice) => {
        const numbered = assignNumber(invoice);
        const nextRecurrence =
          numbered.recurrence !== "none" ? nextRecurrenceDate(numbered.issueDate, numbered.recurrence) : undefined;
        return saveInvoice(
          { ...numbered, status: "sent", nextRecurrence },
          numbered.kind === "invoice" ? `Rechnung ${numbered.number} ausgestellt` : `Angebot ${numbered.number} erstellt`,
        );
      },
      markPaid: (invoice, paidAt = todayISO()) =>
        saveInvoice({ ...invoice, status: "paid", paidAt }, `Zahlungseingang am ${paidAt.split("-").reverse().join(".")} erfasst`),
      correctInvoice: (invoice) => {
        const correction: Invoice = {
          ...blankInvoice(invoice.kind, invoice.customerId),
          items: invoice.items.map((item) => ({ ...item, id: createId("item") })),
          discount: invoice.discount,
          notes: invoice.notes,
          serviceDate: invoice.serviceDate,
          correctionOf: invoice.id,
          history: [historyEntry(`Korrektur zu ${invoice.number} angelegt`)],
        };
        saveInvoice(
          { ...invoice, status: "cancelled", correctedBy: correction.id },
          "Durch Korrekturrechnung ersetzt. Das Original bleibt unverändert archiviert.",
        );
        return saveInvoice(correction);
      },
      cancelInvoice: (invoice) => {
        saveInvoice({ ...invoice, status: "cancelled" }, "Storniert");
      },
      convertOffer: (offer) => {
        const invoice: Invoice = {
          ...blankInvoice("invoice", offer.customerId),
          items: offer.items.map((item) => ({ ...item, id: createId("item") })),
          discount: offer.discount,
          notes: offer.notes,
          convertedFrom: offer.id,
          history: [historyEntry(`Aus Angebot ${offer.number} übernommen`)],
        };
        saveInvoice({ ...offer, status: "paid", paidAt: todayISO() }, "Angebot angenommen und in Rechnung umgewandelt");
        return saveInvoice(invoice);
      },
      createRecurring: (invoice) => {
        const issueDate = invoice.nextRecurrence ?? todayISO();
        const copy: Invoice = {
          ...blankInvoice("invoice", invoice.customerId),
          issueDate,
          serviceDate: issueDate,
          dueDate: addDays(issueDate, read().company.paymentTermDays),
          items: invoice.items.map((item) => ({ ...item, id: createId("item") })),
          discount: invoice.discount,
          notes: invoice.notes,
          history: [historyEntry(`Serienrechnung aus ${invoice.number}`)],
        };
        saveInvoice({ ...invoice, nextRecurrence: nextRecurrenceDate(issueDate, invoice.recurrence) });
        return saveInvoice(copy);
      },
      saveExpense: (expense) => update((draft) => ({ ...draft, expenses: upsert(draft.expenses, expense) })),
      deleteExpense: (id) =>
        update((draft) => ({
          ...draft,
          expenses: draft.expenses.filter((expense) => expense.id !== id),
          documents: draft.documents.map((doc) => (doc.expenseId === id ? { ...doc, expenseId: undefined } : doc)),
        })),
      addDocument: (doc) => update((draft) => ({ ...draft, documents: [doc, ...draft.documents] })),
      saveDocument: (doc) => update((draft) => ({ ...draft, documents: upsert(draft.documents, doc) })),
      deleteDocument: (id) => {
        const doc = read().documents.find((item) => item.id === id);
        if (doc) removeDocumentFile(doc);
        update((draft) => ({
          ...draft,
          documents: draft.documents.filter((item) => item.id !== id),
          expenses: draft.expenses.map((expense) => (expense.documentId === id ? { ...expense, documentId: undefined } : expense)),
        }));
      },
    };
  }, [data, ensureDocument, syncStatus, update]);

  if (error) throw new Error(`Buchhaltungsdaten konnten nicht geladen werden: ${error}`);
  if (!store) return <>{loading}</>;
  return <AccountingContext.Provider value={store}>{children}</AccountingContext.Provider>;
}

/** Local file URI for a document, downloading it first when it only exists on the server. */
export function useDocumentUri(doc?: StoredDocument) {
  const { ensureDocument } = useAccounting();
  const [uri, setUri] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    setUri(null);
    setFailed(false);
    if (doc) {
      ensureDocument(doc)
        .then((value) => alive && setUri(value))
        .catch(() => alive && setFailed(true));
    }
    return () => {
      alive = false;
    };
    // Re-run only when the document identity or its server copy changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc?.id, doc?.remote]);
  return { uri, failed };
}

export function useAccounting() {
  const store = useContext(AccountingContext);
  if (!store) throw new Error("useAccounting must be used inside AccountingProvider");
  return store;
}
