export type VatRate = 0 | 7 | 19;

export type Address = {
  street: string;
  zip: string;
  city: string;
  country: string;
};

export type CompanyProfile = {
  name: string;
  owner: string;
  address: Address;
  email: string;
  phone: string;
  website: string;
  taxNumber: string;
  vatId: string;
  iban: string;
  bic: string;
  bankName: string;
  /** Kleinunternehmerregelung nach § 19 UStG: no VAT on invoices. */
  smallBusiness: boolean;
  vatPeriod: "monthly" | "quarterly";
  paymentTermDays: number;
  invoicePrefix: string;
  offerPrefix: string;
};

export type Customer = {
  id: string;
  kind: "customer" | "supplier";
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: Address;
  vatId: string;
  /** Leitweg-ID for public-sector XRechnung recipients. */
  buyerReference: string;
  notes: string;
  createdAt: string;
};

export type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  /** Percent, 0..100. */
  discount: number;
  vatRate: VatRate;
};

export type InvoiceStatus = "draft" | "sent" | "paid" | "cancelled";
export type Recurrence = "none" | "monthly" | "quarterly" | "yearly";

export type HistoryEntry = {
  at: string;
  text: string;
};

export type Invoice = {
  id: string;
  kind: "invoice" | "offer";
  number: string;
  customerId: string;
  issueDate: string;
  serviceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  items: LineItem[];
  /** Percent discount on the whole document, applied after line discounts. */
  discount: number;
  notes: string;
  paidAt?: string;
  recurrence: Recurrence;
  nextRecurrence?: string;
  /** Set on a correction invoice: the original it replaces. */
  correctionOf?: string;
  /** Set on an original invoice that was corrected or cancelled. */
  correctedBy?: string;
  convertedFrom?: string;
  history: HistoryEntry[];
  createdAt: string;
};

export type ExpenseCategory =
  | "goods"
  | "material"
  | "office"
  | "vehicle"
  | "travel"
  | "meals"
  | "rent"
  | "telecom"
  | "marketing"
  | "insurance"
  | "fees"
  | "other";

export type PaymentMethod = "cash" | "card" | "transfer" | "paypal" | "other";

export type ExpenseItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  vatRate: VatRate;
};

export type Expense = {
  id: string;
  vendor: string;
  vendorAddress: string;
  date: string;
  receiptNumber: string;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  items: ExpenseItem[];
  /** Gross total printed on the receipt; kept even when items do not add up exactly. */
  total: number;
  vat: { rate: VatRate; net: number; tax: number }[];
  documentId?: string;
  supplierId?: string;
  notes: string;
  createdAt: string;
};

export type DocumentKind = "receipt" | "invoice" | "contract" | "other";

export type StoredDocument = {
  id: string;
  kind: DocumentKind;
  title: string;
  fileName: string;
  mimeType: string;
  size: number;
  /** Recognised text, used for full-text search. */
  text: string;
  fingerprint: string;
  expenseId?: string;
  invoiceId?: string;
  /** True once the file is stored on the server. */
  remote?: boolean;
  history: HistoryEntry[];
  createdAt: string;
};

export type AccountingData = {
  version: 1;
  company: CompanyProfile;
  customers: Customer[];
  invoices: Invoice[];
  expenses: Expense[];
  documents: StoredDocument[];
  counters: Record<string, number>;
};
