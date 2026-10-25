import type {
  AccountingData,
  CompanyProfile,
  Expense,
  ExpenseItem,
  Invoice,
  LineItem,
  Recurrence,
  VatRate,
} from "./types";

export const vatRates: VatRate[] = [19, 7, 0];

/** Commercial rounding; toPrecision removes binary noise so 81.225 rounds to 81.23. */
export function round2(value: number) {
  const cents = Number((Math.abs(value) * 100).toPrecision(15));
  return (Math.sign(value) * Math.round(cents)) / 100;
}

export function createId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function todayISO(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, days: number) {
  const date = parseISO(iso);
  date.setDate(date.getDate() + days);
  return todayISO(date);
}

export function addMonths(iso: string, months: number) {
  const date = parseISO(iso);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return todayISO(date);
}

export function parseISO(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
}

export function nextRecurrenceDate(iso: string, recurrence: Recurrence) {
  switch (recurrence) {
    case "monthly":
      return addMonths(iso, 1);
    case "quarterly":
      return addMonths(iso, 3);
    case "yearly":
      return addMonths(iso, 12);
    case "none":
      return undefined;
  }
}

export function formatDate(iso: string | undefined) {
  if (!iso) return "–";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return d && m && y ? `${d}.${m}.${y}` : iso;
}

export function formatMoney(value: number) {
  const negative = value < 0;
  const [whole, cents] = Math.abs(round2(value)).toFixed(2).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${negative ? "−" : ""}${grouped},${cents} €`;
}

/** Accepts German ("1.234,56") and English ("1234.56") notation. */
export function parseAmount(input: string) {
  const cleaned = input.replace(/[^\d,.-]/g, "");
  if (!cleaned) return 0;
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalized = cleaned;
  if (lastComma > lastDot) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma && lastComma !== -1) {
    normalized = cleaned.replace(/,/g, "");
  }
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}

export function amountInput(value: number) {
  return round2(value).toFixed(2).replace(".", ",");
}

type PricedLine = Pick<LineItem, "quantity" | "unitPrice" | "discount" | "vatRate">;

export function lineNet(item: PricedLine) {
  return round2(item.quantity * item.unitPrice * (1 - item.discount / 100));
}

export type VatGroup = { rate: VatRate; net: number; tax: number };

export type DocumentTotals = {
  subtotal: number;
  discountAmount: number;
  net: number;
  vat: VatGroup[];
  tax: number;
  gross: number;
};

/**
 * Invoice prices are net. The document discount is spread across VAT groups
 * proportionally so the VAT breakdown stays correct.
 */
export function invoiceTotals(items: LineItem[], discount: number, smallBusiness: boolean): DocumentTotals {
  const subtotal = round2(items.reduce((sum, item) => sum + lineNet(item), 0));
  const factor = 1 - Math.min(Math.max(discount, 0), 100) / 100;
  const groups = new Map<VatRate, number>();

  for (const item of items) {
    const rate: VatRate = smallBusiness ? 0 : item.vatRate;
    groups.set(rate, (groups.get(rate) ?? 0) + lineNet(item) * factor);
  }

  const vat = [...groups.entries()]
    .map(([rate, net]) => ({ rate, net: round2(net), tax: round2((net * rate) / 100) }))
    .sort((a, b) => b.rate - a.rate);
  const net = round2(vat.reduce((sum, group) => sum + group.net, 0));
  const tax = round2(vat.reduce((sum, group) => sum + group.tax, 0));

  return { subtotal, discountAmount: round2(subtotal - net), net, vat, tax, gross: round2(net + tax) };
}

export function totalsFor(invoice: Invoice, company: CompanyProfile) {
  return invoiceTotals(invoice.items, invoice.discount, company.smallBusiness);
}

/** Receipt prices are gross, so VAT is extracted from the gross amount. */
export function expenseVatFromItems(items: ExpenseItem[]): VatGroup[] {
  const groups = new Map<VatRate, number>();
  for (const item of items) {
    groups.set(item.vatRate, (groups.get(item.vatRate) ?? 0) + lineNet(item));
  }
  return [...groups.entries()]
    .map(([rate, gross]) => {
      const net = round2(gross / (1 + rate / 100));
      return { rate, net, tax: round2(gross - net) };
    })
    .sort((a, b) => b.rate - a.rate);
}

export function expenseItemsTotal(items: ExpenseItem[]) {
  return round2(items.reduce((sum, item) => sum + lineNet(item), 0));
}

export function expenseNet(expense: Expense) {
  if (expense.vat.length) return round2(expense.vat.reduce((sum, group) => sum + group.net, 0));
  return expense.total;
}

export function expenseTax(expense: Expense) {
  return round2(expense.vat.reduce((sum, group) => sum + group.tax, 0));
}

export function nextDocumentNumber(data: AccountingData, kind: Invoice["kind"], issueDate: string) {
  const year = issueDate.slice(0, 4);
  const key = `${kind}-${year}`;
  const prefix = kind === "invoice" ? data.company.invoicePrefix : data.company.offerPrefix;
  const used = new Set(data.invoices.filter((invoice) => invoice.kind === kind).map((invoice) => invoice.number));
  let sequence = (data.counters[key] ?? 0) + 1;
  let number = `${prefix}-${year}-${String(sequence).padStart(4, "0")}`;
  while (used.has(number)) {
    sequence += 1;
    number = `${prefix}-${year}-${String(sequence).padStart(4, "0")}`;
  }
  return { number, counters: { ...data.counters, [key]: sequence } };
}

export function isOverdue(invoice: Invoice, today = todayISO()) {
  return invoice.kind === "invoice" && invoice.status === "sent" && invoice.dueDate < today;
}

export type VatPeriod = { label: string; start: string; end: string; deadline: string };

export function currentVatPeriod(company: CompanyProfile, today = todayISO()): VatPeriod {
  const date = parseISO(today);
  const year = date.getFullYear();
  if (company.vatPeriod === "quarterly") {
    const quarter = Math.floor(date.getMonth() / 3);
    const start = todayISO(new Date(year, quarter * 3, 1));
    const end = todayISO(new Date(year, quarter * 3 + 3, 0));
    return { label: `Q${quarter + 1} ${year}`, start, end, deadline: todayISO(new Date(year, quarter * 3 + 3, 10)) };
  }
  const month = date.getMonth();
  const start = todayISO(new Date(year, month, 1));
  const end = todayISO(new Date(year, month + 1, 0));
  const label = `${String(month + 1).padStart(2, "0")}/${year}`;
  return { label, start, end, deadline: todayISO(new Date(year, month + 1, 10)) };
}

const inRange = (iso: string | undefined, start: string, end: string) => Boolean(iso && iso >= start && iso <= end);

/** Issued invoices count for VAT in the period they were issued (Soll-Versteuerung). */
export function activeInvoices(data: AccountingData) {
  return data.invoices.filter((invoice) => invoice.kind === "invoice" && invoice.status !== "draft" && invoice.status !== "cancelled");
}

export function vatForPeriod(data: AccountingData, start: string, end: string) {
  const output = round2(
    activeInvoices(data)
      .filter((invoice) => inRange(invoice.issueDate, start, end))
      .reduce((sum, invoice) => sum + totalsFor(invoice, data.company).tax, 0),
  );
  const input = data.company.smallBusiness
    ? 0
    : round2(data.expenses.filter((expense) => inRange(expense.date, start, end)).reduce((sum, expense) => sum + expenseTax(expense), 0));
  return { output, input, due: round2(output - input) };
}

export type Activity = {
  id: string;
  type: "income" | "expense";
  title: string;
  subtitle: string;
  date: string;
  amount: number;
};

export type Alert = { id: string; tone: "danger" | "warning" | "info"; text: string; target?: string };

export function dashboard(data: AccountingData, today = todayISO()) {
  const year = today.slice(0, 4);
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  const invoices = activeInvoices(data);

  const paidThisYear = invoices.filter((invoice) => invoice.status === "paid" && inRange(invoice.paidAt, yearStart, yearEnd));
  const revenueNet = round2(paidThisYear.reduce((sum, invoice) => sum + totalsFor(invoice, data.company).net, 0));
  const revenueGross = round2(paidThisYear.reduce((sum, invoice) => sum + totalsFor(invoice, data.company).gross, 0));
  const expensesThisYear = data.expenses.filter((expense) => inRange(expense.date, yearStart, yearEnd));
  const expensesNet = round2(
    expensesThisYear.reduce((sum, expense) => sum + (data.company.smallBusiness ? expense.total : expenseNet(expense)), 0),
  );
  const expensesGross = round2(expensesThisYear.reduce((sum, expense) => sum + expense.total, 0));

  const open = invoices.filter((invoice) => invoice.status === "sent");
  const overdue = open.filter((invoice) => isOverdue(invoice, today));
  const openAmount = round2(open.reduce((sum, invoice) => sum + totalsFor(invoice, data.company).gross, 0));

  const paidAll = round2(
    invoices.filter((invoice) => invoice.status === "paid").reduce((sum, invoice) => sum + totalsFor(invoice, data.company).gross, 0),
  );
  const spentAll = round2(data.expenses.reduce((sum, expense) => sum + expense.total, 0));

  const period = currentVatPeriod(data.company, today);
  const vat = data.company.smallBusiness ? { output: 0, input: 0, due: 0 } : vatForPeriod(data, period.start, period.end);

  const customerName = (id: string) => data.customers.find((customer) => customer.id === id)?.name ?? "Unbekannter Kunde";
  const activity: Activity[] = [
    ...invoices
      .filter((invoice) => invoice.status === "paid")
      .map((invoice) => ({
        id: invoice.id,
        type: "income" as const,
        title: customerName(invoice.customerId),
        subtitle: `Zahlung ${invoice.number}`,
        date: invoice.paidAt ?? invoice.issueDate,
        amount: totalsFor(invoice, data.company).gross,
      })),
    ...data.expenses.map((expense) => ({
      id: expense.id,
      type: "expense" as const,
      title: expense.vendor || "Ausgabe",
      subtitle: expenseCategoryLabels[expense.category],
      date: expense.date,
      amount: -expense.total,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  const alerts: Alert[] = [];
  for (const invoice of overdue) {
    alerts.push({
      id: `overdue-${invoice.id}`,
      tone: "danger",
      text: `${invoice.number} ist seit ${formatDate(invoice.dueDate)} überfällig (${formatMoney(totalsFor(invoice, data.company).gross)}).`,
      target: invoice.id,
    });
  }
  for (const invoice of data.invoices.filter((item) => item.recurrence !== "none" && item.nextRecurrence && item.nextRecurrence <= today)) {
    alerts.push({ id: `recurring-${invoice.id}`, tone: "info", text: `Serienrechnung aus ${invoice.number} ist fällig.`, target: invoice.id });
  }
  if (!data.company.smallBusiness) {
    const daysLeft = Math.round((parseISO(period.deadline).getTime() - parseISO(today).getTime()) / 86_400_000);
    if (daysLeft <= 10) {
      alerts.push({
        id: "ustva",
        tone: "warning",
        text: `UStVA ${period.label} ist am ${formatDate(period.deadline)} fällig (noch ${daysLeft} Tage).`,
      });
    }
  }
  const missingReceipts = data.expenses.filter((expense) => !expense.documentId).length;
  if (missingReceipts) {
    alerts.push({ id: "missing-receipts", tone: "warning", text: `${missingReceipts} Ausgabe(n) ohne Beleg im Archiv.` });
  }
  if (!data.company.taxNumber && !data.company.vatId) {
    alerts.push({ id: "company", tone: "info", text: "Steuernummer oder USt-IdNr. fehlt. Bitte in den Firmendaten ergänzen." });
  }

  return {
    year,
    revenueNet,
    revenueGross,
    expensesNet,
    expensesGross,
    profit: round2(revenueNet - expensesNet),
    balance: round2(paidAll - spentAll),
    open: { count: open.length, amount: openAmount, overdue: overdue.length },
    period,
    vat,
    activity,
    alerts,
  };
}

export const expenseCategoryLabels: Record<Expense["category"], string> = {
  goods: "Wareneinkauf",
  material: "Material",
  office: "Bürobedarf",
  vehicle: "Fahrzeug",
  travel: "Reisekosten",
  meals: "Bewirtung",
  rent: "Miete",
  telecom: "Telefon & Internet",
  marketing: "Werbung",
  insurance: "Versicherung",
  fees: "Gebühren",
  other: "Sonstiges",
};

export const paymentMethodLabels: Record<Expense["paymentMethod"], string> = {
  cash: "Bar",
  card: "Karte",
  transfer: "Überweisung",
  paypal: "PayPal",
  other: "Sonstige",
};

export const invoiceStatusLabels: Record<Invoice["status"], string> = {
  draft: "Entwurf",
  sent: "Offen",
  paid: "Bezahlt",
  cancelled: "Storniert",
};

const offerStatusLabels: Record<Invoice["status"], string> = {
  draft: "Entwurf",
  sent: "Versendet",
  paid: "Angenommen",
  cancelled: "Abgelehnt",
};

export function statusOf(invoice: Invoice, today = todayISO()) {
  if (invoice.kind === "offer") {
    const tone = invoice.status === "paid" ? "success" : invoice.status === "sent" ? "gold" : "neutral";
    return { label: offerStatusLabels[invoice.status], tone } as const;
  }
  if (isOverdue(invoice, today)) return { label: "Überfällig", tone: "danger" } as const;
  if (invoice.correctedBy) return { label: "Korrigiert", tone: "neutral" } as const;
  const tone = { draft: "neutral", sent: "warning", paid: "success", cancelled: "neutral" } as const;
  return { label: invoiceStatusLabels[invoice.status], tone: tone[invoice.status] };
}

export const recurrenceLabels: Record<Recurrence, string> = {
  none: "Keine",
  monthly: "Monatlich",
  quarterly: "Vierteljährlich",
  yearly: "Jährlich",
};
