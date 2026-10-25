import type { ReceiptDraft } from "./receipt-parser";
import type { Invoice } from "./types";

export type TabKey = "dashboard" | "invoices" | "customers" | "more";

export type ScanSource = { uri: string; mimeType: string; text: string };

export type Route =
  | { name: "invoice"; id: string }
  | { name: "newInvoice"; kind: Invoice["kind"]; customerId?: string }
  | { name: "customer"; id?: string; kind?: "customer" | "supplier" }
  | { name: "scanner"; mode: "camera" | "library" | "pdf" }
  | { name: "expense"; id?: string; draft?: ReceiptDraft; source?: ScanSource }
  | { name: "expenses" }
  | { name: "documents" }
  | { name: "document"; id: string }
  | { name: "settings" }
  | { name: "soon"; key: SoonKey };

export type SoonKey =
  | "bookkeeping"
  | "banking"
  | "taxes"
  | "reports"
  | "stock"
  | "payroll"
  | "assistant"
  | "advisor";

export type Nav = {
  push: (route: Route) => void;
  replace: (route: Route) => void;
  back: () => void;
  setTab: (tab: TabKey) => void;
};
