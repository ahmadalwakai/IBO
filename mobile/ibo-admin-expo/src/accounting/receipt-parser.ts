import { createId, expenseItemsTotal, expenseVatFromItems, parseAmount, round2 } from "./calc";
import type { ExpenseCategory, ExpenseItem, PaymentMethod, VatRate } from "./types";

export type OcrBox = { text: string; x: number; y: number; width: number; height: number };

export type ReceiptDraft = {
  vendor: string;
  vendorAddress: string;
  date: string;
  receiptNumber: string;
  paymentMethod: PaymentMethod;
  category: ExpenseCategory;
  items: ExpenseItem[];
  total: number;
  vat: { rate: VatRate; net: number; tax: number }[];
  rawText: string;
  warnings: string[];
};

const amountPattern = /(-?\d{1,5}(?:[.,]\d{3})*[.,]\d{2})-?\s*(?:€|EUR|EURO)?\s*(?:\*?\s*([A-H12])\b)?\s*\*?$/i;
const datePattern = /\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b|\b(20\d{2})-(\d{2})-(\d{2})\b/;
const quantityPattern = /^\s*(\d+(?:[.,]\d+)?)\s*(?:stk\.?|st\.?|x|×|\*)\s*(?:x\s*)?(\d{1,5}[.,]\d{2})/i;
const weightPattern = /(\d+[.,]\d{1,3})\s*kg\s*(?:x|×|\*)\s*(\d{1,4}[.,]\d{2})\s*(?:€|EUR)?\s*\/\s*kg/i;

const totalKeywords: [RegExp, number][] = [
  [/\b(zu zahlen|zahlbetrag|endbetrag|gesamtbetrag)\b/i, 4],
  [/\b(summe|gesamt|total)\b/i, 3],
  [/\bbetrag\b/i, 2],
];

const ignoreRow =
  /(zwischensumme|summe|gesamt|total|zu zahlen|mwst|ust\b|steuer|netto|brutto|r[uü]ckgeld|gegeben|wechselgeld|bar\b|bargeld|kartenzahlung|ec[- ]?karte|girocard|visa|mastercard|maestro|kontaktlos|terminal|trace|beleg|bon[- ]?nr|kasse|bediener|uhrzeit|datum|tse|signatur|seriennummer|transaktion|steuer[- ]?nr|ust[- ]?id|vielen dank|danke|wiedersehen|www\.|tel\.|telefon|fax|zahlung|payback|punkte|treue|genehmigung|autorisierung|betrag eur)/i;

const discountRow = /(rabatt|nachlass|coupon|gutschein|aktion|preisvorteil|sofortrabatt|-\s*\d+\s*%)/i;

function normalise(text: string) {
  return text.replace(/\s+/g, " ").replace(/€\s+(?=\d)/g, "€").trim();
}

/** Vision returns item names and prices as separate boxes; merge boxes that share a baseline into rows. */
export function groupRows(boxes: OcrBox[]) {
  const sorted = [...boxes].filter((box) => box.text.trim()).sort((a, b) => a.y + a.height / 2 - (b.y + b.height / 2));
  const rows: OcrBox[][] = [];
  for (const box of sorted) {
    const center = box.y + box.height / 2;
    const row = rows[rows.length - 1];
    if (row) {
      const rowCenter = row.reduce((sum, item) => sum + item.y + item.height / 2, 0) / row.length;
      const rowHeight = Math.max(...row.map((item) => item.height), box.height);
      if (Math.abs(center - rowCenter) < rowHeight * 0.55) {
        row.push(box);
        continue;
      }
    }
    rows.push([box]);
  }
  return rows.map((row) => normalise(row.sort((a, b) => a.x - b.x).map((box) => box.text).join("  ")));
}

function parseDate(rows: string[]) {
  for (const row of rows) {
    const match = row.match(datePattern);
    if (!match) continue;
    if (match[4]) return `${match[4]}-${match[5]}-${match[6]}`;
    const day = Number(match[1]);
    const month = Number(match[2]);
    let year = Number(match[3]);
    if (year < 100) year += 2000;
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2000 || year > 2100) continue;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return "";
}

function parsePayment(text: string): PaymentMethod {
  if (/paypal/i.test(text)) return "paypal";
  if (/(girocard|ec[- ]?(karte|cash)|kartenzahlung|visa|mastercard|maestro|kontaktlos|amex|apple pay|google pay|debit)/i.test(text)) return "card";
  if (/([uü]berweisung|sepa)/i.test(text)) return "transfer";
  if (/\b(bar|bargeld|gegeben|r[uü]ckgeld)\b/i.test(text)) return "cash";
  return "other";
}

function guessCategory(vendor: string, text: string): ExpenseCategory {
  const haystack = `${vendor} ${text}`.toLowerCase();
  if (/(aral|shell|esso|jet|total|tankstelle|diesel|super e10|benzin|parkhaus|parken|kfz|werkstatt)/.test(haystack)) return "vehicle";
  if (/(obi|bauhaus|hornbach|toom|hagebau|baumarkt|farbe|lack|tapete|schrauben|holz|fliesen|gips)/.test(haystack)) return "material";
  if (/(restaurant|gastst|pizzeria|café|cafe|bistro|imbiss|bewirtung|trinkgeld)/.test(haystack)) return "meals";
  if (/(deutsche bahn|db fernverkehr|hotel|flug|taxi|uber|übernachtung)/.test(haystack)) return "travel";
  if (/(telekom|vodafone|o2|1&1|internet|mobilfunk)/.test(haystack)) return "telecom";
  if (/(staples|mcpaper|büro|papier|toner|druckerpatrone|ordner)/.test(haystack)) return "office";
  if (/(rewe|edeka|aldi|lidl|netto|penny|kaufland|metro|selgros)/.test(haystack)) return "goods";
  return "other";
}

function isAddressRow(row: string) {
  return /(stra(ß|ss)e|str\.|weg\b|platz|allee|gasse|ring\b|damm\b|\b\d{5}\s+\p{L})/iu.test(row);
}

/** Reads the VAT table ("A 19,0 % 10,00 1,90 11,90") and maps the letter codes printed next to items. */
function parseVatTable(rows: string[]) {
  const letters = new Map<string, VatRate>();
  const groups: { rate: VatRate; net: number; tax: number }[] = [];
  for (const row of rows) {
    const rateMatch = row.match(/\b([A-H12])?\s*[=:]?\s*(19|7|0)(?:[.,]0{1,2})?\s*%/i);
    if (!rateMatch) continue;
    const rate = Number(rateMatch[2]) as VatRate;
    if (rateMatch[1]) letters.set(rateMatch[1].toUpperCase(), rate);
    const amounts = [...row.slice((rateMatch.index ?? 0) + rateMatch[0].length).matchAll(/-?\d{1,5}(?:\.\d{3})*,\d{2}|-?\d{1,5}\.\d{2}/g)].map(
      (match) => parseAmount(match[0]),
    );
    if (amounts.length >= 2 && /(mwst|ust|steuer|netto|brutto|%)/i.test(row)) {
      // Typical layouts: [net, tax, gross] or [tax, net, gross] or [tax].
      const [first, second] = amounts;
      const expectedTax = (value: number) => round2((value * rate) / 100);
      if (Math.abs(expectedTax(first) - second) <= 0.02) groups.push({ rate, net: first, tax: second });
      else if (Math.abs(expectedTax(second) - first) <= 0.02) groups.push({ rate, net: second, tax: first });
    }
  }
  if (!letters.size) {
    letters.set("A", 19);
    letters.set("1", 19);
    letters.set("B", 7);
    letters.set("2", 7);
  }
  const unique = new Map<VatRate, { rate: VatRate; net: number; tax: number }>();
  for (const group of groups) unique.set(group.rate, group);
  return { letters, groups: [...unique.values()] };
}

export function parseReceipt(rows: string[]): ReceiptDraft {
  const text = rows.join("\n");
  const warnings: string[] = [];
  const { letters, groups } = parseVatTable(rows);

  const headerEnd = Math.max(3, Math.ceil(rows.length * 0.25));
  const vendorIndex = rows.findIndex(
    (row, index) =>
      index < headerEnd &&
      /\p{L}{3,}/u.test(row) &&
      !datePattern.test(row) &&
      !amountPattern.test(row) &&
      !/(kassenbon|kassenbeleg|willkommen|rechnung|quittung|beleg)/i.test(row),
  );
  const vendor = vendorIndex >= 0 ? rows[vendorIndex].replace(/\s{2,}/g, " ") : "";
  const vendorAddress = rows
    .slice(vendorIndex + 1, vendorIndex + 5)
    .filter(isAddressRow)
    .slice(0, 2)
    .join(", ");

  const receiptNumber =
    text.match(/(?:beleg|bon|rechnungs?|quittung|transaktions?|re)[\s.-]*(?:nr|nummer|no)\.?\s*:?\s*([A-Z0-9][A-Z0-9/-]{2,})/i)?.[1] ?? "";

  let total = 0;
  let totalIndex = -1;
  let bestScore = 0;
  rows.forEach((row, index) => {
    const amount = row.match(amountPattern);
    if (!amount || /zwischensumme|netto|mwst|steuer/i.test(row)) return;
    for (const [pattern, score] of totalKeywords) {
      if (pattern.test(row) && (score > bestScore || (score === bestScore && totalIndex === -1))) {
        bestScore = score;
        total = parseAmount(amount[1]);
        totalIndex = index;
      }
    }
  });

  const items: ExpenseItem[] = [];
  // Articles end at the first total line; the VAT table below may repeat "Gesamtbetrag".
  const firstTotalRow = rows.findIndex((row) => amountPattern.test(row) && totalKeywords.some(([pattern]) => pattern.test(row)));
  const itemEnd = firstTotalRow >= 0 ? firstTotalRow : rows.length;
  const rateFor = (letter?: string): VatRate => (letter ? letters.get(letter.toUpperCase()) : undefined) ?? groups[0]?.rate ?? 19;
  // Quantity printed before its article line ("2 x 0,89" then "MILCH 1,78").
  let pendingQuantity: { quantity: number; unitPrice: number } | null = null;
  // Article name printed on its own line before a weight/quantity line (Lidl, Aldi).
  let pendingName = "";

  for (let index = Math.max(vendorIndex + 1, 0); index < itemEnd; index += 1) {
    const row = rows[index];
    const weight = row.match(weightPattern);
    const quantity = weight ? null : row.match(quantityPattern);
    const amount = row.match(amountPattern);

    if (quantity || weight) {
      const parsed = weight
        ? { quantity: parseAmount(weight[1]), unitPrice: parseAmount(weight[2]) }
        : { quantity: parseAmount(quantity![1]), unitPrice: parseAmount(quantity![2]) };
      const rest = row.replace(weight ? weightPattern : quantityPattern, "").trim();
      const restAmount = rest.match(amountPattern);
      const restName = rest.replace(amountPattern, "").replace(/(€|eur)\s*\/\s*kg/i, "").trim();
      const lineTotal = restAmount ? parseAmount(restAmount[1]) : round2(parsed.quantity * parsed.unitPrice);
      const last = items[items.length - 1];

      if (restName.length >= 3 || (pendingName && restAmount)) {
        items.push({
          id: createId("item"),
          description: restName.length >= 3 ? restName : pendingName,
          quantity: parsed.quantity,
          unitPrice: parsed.unitPrice,
          discount: 0,
          vatRate: rateFor(restAmount?.[2]),
        });
      } else if (last && last.quantity === 1 && Math.abs(last.unitPrice - lineTotal) <= 0.02) {
        last.quantity = parsed.quantity;
        last.unitPrice = parsed.unitPrice;
      } else {
        pendingQuantity = parsed;
      }
      pendingName = "";
      continue;
    }

    if (!amount) {
      if (!ignoreRow.test(row) && !isAddressRow(row) && !datePattern.test(row) && /\p{L}{3,}/u.test(row)) pendingName = row;
      continue;
    }

    const value = parseAmount(amount[1]);
    const description = row.replace(amountPattern, "").replace(/\s{2,}/g, " ").trim();

    if (value < 0 || discountRow.test(row)) {
      const last = items[items.length - 1];
      const lineTotal = last ? last.quantity * last.unitPrice : 0;
      if (last && lineTotal > 0) {
        last.discount = round2(Math.min(100, last.discount + (Math.abs(value) / lineTotal) * 100));
      } else {
        items.push({ id: createId("item"), description: description || "Rabatt", quantity: 1, unitPrice: -Math.abs(value), discount: 0, vatRate: rateFor(amount[2]) });
      }
      continue;
    }

    if (ignoreRow.test(row) || isAddressRow(row) || datePattern.test(description) || description.length < 2) continue;

    const qty = pendingQuantity && Math.abs(pendingQuantity.quantity * pendingQuantity.unitPrice - value) <= 0.02 ? pendingQuantity : null;
    pendingQuantity = null;
    pendingName = "";
    items.push({
      id: createId("item"),
      description,
      quantity: qty ? qty.quantity : 1,
      unitPrice: qty ? qty.unitPrice : value,
      discount: 0,
      vatRate: rateFor(amount[2]),
    });
  }

  const itemsTotal = expenseItemsTotal(items);
  if (!total) {
    total = itemsTotal;
    if (items.length) warnings.push("Gesamtbetrag nicht gefunden, Summe der Positionen übernommen.");
  } else if (items.length && Math.abs(itemsTotal - total) > 0.05) {
    warnings.push(`Positionen ergeben ${itemsTotal.toFixed(2).replace(".", ",")} €, Beleg nennt ${total.toFixed(2).replace(".", ",")} €. Bitte prüfen.`);
  }
  if (!items.length) warnings.push("Keine einzelnen Positionen erkannt. Bitte manuell ergänzen.");

  const date = parseDate(rows);
  if (!date) warnings.push("Kaufdatum nicht erkannt.");
  if (!vendor) warnings.push("Händlername nicht erkannt.");

  const groupSum = round2(groups.reduce((sum, group) => sum + group.net + group.tax, 0));
  const vat = groups.length && Math.abs(groupSum - total) <= 0.05 ? groups : expenseVatFromItems(items);

  return {
    vendor,
    vendorAddress,
    date,
    receiptNumber,
    paymentMethod: parsePayment(text),
    category: guessCategory(vendor, text),
    items,
    total: round2(total),
    vat,
    rawText: text,
    warnings,
  };
}
