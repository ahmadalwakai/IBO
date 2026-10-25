import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { addDays, createId, nextDocumentNumber, nextRecurrenceDate, todayISO } from "./calc";
import { loadData, removeDocumentFile, saveData, type CompanySeed } from "./storage";
import type { AccountingData, Customer, Expense, Invoice, StoredDocument } from "./types";

type Store = {
  data: AccountingData;
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
  children,
  loading,
}: {
  seed?: CompanySeed;
  children: React.ReactNode;
  loading: React.ReactNode;
}) {
  const [data, setData] = useState<AccountingData | null>(null);
  const dataRef = useRef<AccountingData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData(seed)
      .then((loaded) => {
        dataRef.current = loaded;
        setData(loaded);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : String(reason)));
    // The seed only fills an empty profile on first launch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = useCallback((updater: (draft: AccountingData) => AccountingData) => {
    const current = dataRef.current;
    if (!current) return;
    const next = updater(current);
    dataRef.current = next;
    setData(next);
    saveData(next);
  }, []);

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
  }, [data, update]);

  if (error) throw new Error(`Buchhaltungsdaten konnten nicht geladen werden: ${error}`);
  if (!store) return <>{loading}</>;
  return <AccountingContext.Provider value={store}>{children}</AccountingContext.Provider>;
}

export function useAccounting() {
  const store = useContext(AccountingContext);
  if (!store) throw new Error("useAccounting must be used inside AccountingProvider");
  return store;
}
