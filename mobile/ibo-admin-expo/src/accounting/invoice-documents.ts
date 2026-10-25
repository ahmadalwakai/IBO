import * as Print from "expo-print";
import { File, Paths } from "expo-file-system";
import { formatDate, formatMoney, lineNet, round2, totalsFor } from "./calc";
import { shareFile } from "./storage";
import type { AccountingData, Customer, Invoice } from "./types";

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const multiline = (value: string) => escapeHtml(value).replace(/\n/g, "<br/>");

function title(invoice: Invoice, _data?: AccountingData) {
  if (invoice.kind === "offer") return "Angebot";
  return invoice.correctionOf ? "Korrekturrechnung" : "Rechnung";
}

export function invoiceHtml(invoice: Invoice, data: AccountingData) {
  const { company } = data;
  const customer = data.customers.find((item) => item.id === invoice.customerId);
  const totals = totalsFor(invoice, company);
  const original = invoice.correctionOf ? data.invoices.find((item) => item.id === invoice.correctionOf) : undefined;
  const isDraft = invoice.status === "draft";

  const rows = invoice.items
    .map(
      (item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${multiline(item.description)}</td>
        <td class="num">${String(item.quantity).replace(".", ",")} ${escapeHtml(item.unit)}</td>
        <td class="num">${formatMoney(item.unitPrice)}</td>
        <td class="num">${item.discount ? `${String(item.discount).replace(".", ",")} %` : ""}</td>
        ${company.smallBusiness ? "" : `<td class="num">${item.vatRate} %</td>`}
        <td class="num">${formatMoney(lineNet(item))}</td>
      </tr>`,
    )
    .join("");

  const vatRows = company.smallBusiness
    ? ""
    : totals.vat.map((group) => `<tr><td>zzgl. ${group.rate} % USt. auf ${formatMoney(group.net)}</td><td class="num">${formatMoney(group.tax)}</td></tr>`).join("");

  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"/>
<style>
  @page { margin: 18mm 16mm; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #142E2A; font-size: 10.5pt; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #00D6A0; padding-bottom: 12px; }
  .brand { font-size: 20pt; font-weight: 800; color: #061E1B; }
  .muted { color: #5c6f6b; font-size: 9pt; }
  .sender { font-size: 7.5pt; color: #5c6f6b; text-decoration: underline; margin: 28px 0 4px; }
  .grid { display: flex; justify-content: space-between; margin-top: 4px; }
  .meta td { padding: 1px 0 1px 14px; }
  h1 { font-size: 17pt; margin: 30px 0 4px; color: #061E1B; }
  table.items { width: 100%; border-collapse: collapse; margin-top: 18px; }
  .items th { background: #061E1B; color: #F8FAF9; text-align: left; padding: 7px 6px; font-size: 9pt; }
  .items td { border-bottom: 1px solid #E8F4EF; padding: 7px 6px; vertical-align: top; }
  .num { text-align: right; white-space: nowrap; }
  table.totals { margin-left: auto; margin-top: 12px; min-width: 300px; border-collapse: collapse; }
  .totals td { padding: 4px 6px; }
  .grand td { border-top: 2px solid #061E1B; font-weight: 800; font-size: 12pt; }
  .note { margin-top: 22px; padding: 10px 12px; background: #E8F4EF; border-left: 3px solid #D8B56A; }
  .draft { position: fixed; top: 40%; left: 10%; font-size: 70pt; color: rgba(216,181,106,0.18); transform: rotate(-28deg); font-weight: 900; }
  footer { margin-top: 36px; border-top: 1px solid #E8F4EF; padding-top: 10px; display: flex; justify-content: space-between; font-size: 8pt; color: #5c6f6b; }
</style></head>
<body>
  ${isDraft ? '<div class="draft">ENTWURF</div>' : ""}
  <div class="head">
    <div><div class="brand">${escapeHtml(company.name || "Ihr Unternehmen")}</div>
      <div class="muted">${escapeHtml(company.address.street)}<br/>${escapeHtml(`${company.address.zip} ${company.address.city}`)}</div></div>
    <div class="muted" style="text-align:right">${escapeHtml(company.phone)}<br/>${escapeHtml(company.email)}<br/>${escapeHtml(company.website)}</div>
  </div>

  <div class="sender">${escapeHtml(`${company.name} · ${company.address.street} · ${company.address.zip} ${company.address.city}`)}</div>
  <div class="grid">
    <div>${customer ? customerBlock(customer) : "<em>Kein Kunde ausgewählt</em>"}</div>
    <table class="meta">
      <tr><td>${invoice.kind === "offer" ? "Angebotsnr." : "Rechnungsnr."}</td><td><b>${escapeHtml(isDraft ? "Entwurf" : invoice.number)}</b></td></tr>
      <tr><td>Datum</td><td>${formatDate(invoice.issueDate)}</td></tr>
      <tr><td>Leistungsdatum</td><td>${formatDate(invoice.serviceDate)}</td></tr>
      <tr><td>${invoice.kind === "offer" ? "Gültig bis" : "Fällig am"}</td><td>${formatDate(invoice.dueDate)}</td></tr>
      ${customer?.vatId ? `<tr><td>USt-IdNr. Kunde</td><td>${escapeHtml(customer.vatId)}</td></tr>` : ""}
    </table>
  </div>

  <h1>${title(invoice, data)}${isDraft ? "" : ` ${escapeHtml(invoice.number)}`}</h1>
  ${original ? `<div class="muted">Diese Rechnung ersetzt die Rechnung ${escapeHtml(original.number)} vom ${formatDate(original.issueDate)}.</div>` : ""}

  <table class="items">
    <thead><tr><th>Pos.</th><th>Beschreibung</th><th class="num">Menge</th><th class="num">Einzelpreis</th><th class="num">Rabatt</th>${company.smallBusiness ? "" : '<th class="num">USt.</th>'}<th class="num">Gesamt</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <table class="totals">
    <tr><td>Zwischensumme (netto)</td><td class="num">${formatMoney(totals.subtotal)}</td></tr>
    ${totals.discountAmount ? `<tr><td>Rabatt ${String(invoice.discount).replace(".", ",")} %</td><td class="num">${formatMoney(-totals.discountAmount)}</td></tr>` : ""}
    ${totals.discountAmount ? `<tr><td>Nettobetrag</td><td class="num">${formatMoney(totals.net)}</td></tr>` : ""}
    ${vatRows}
    <tr class="grand"><td>${company.smallBusiness ? "Gesamtbetrag" : "Gesamtbetrag (brutto)"}</td><td class="num">${formatMoney(totals.gross)}</td></tr>
  </table>

  ${company.smallBusiness ? '<div class="note">Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.</div>' : ""}
  ${
    invoice.kind === "invoice"
      ? `<div class="note">Bitte überweisen Sie den Betrag bis zum <b>${formatDate(invoice.dueDate)}</b> unter Angabe der Rechnungsnummer${
          company.iban ? ` auf das Konto <b>${escapeHtml(company.iban)}</b>${company.bic ? ` (BIC ${escapeHtml(company.bic)})` : ""}${company.bankName ? `, ${escapeHtml(company.bankName)}` : ""}` : ""
        }.</div>`
      : '<div class="note">Wir freuen uns auf Ihren Auftrag. Bei Fragen sind wir jederzeit für Sie da.</div>'
  }
  ${invoice.notes ? `<p>${multiline(invoice.notes)}</p>` : ""}

  <footer>
    <div>${escapeHtml(company.name)}${company.owner ? `<br/>Inhaber: ${escapeHtml(company.owner)}` : ""}</div>
    <div>${company.taxNumber ? `Steuernummer: ${escapeHtml(company.taxNumber)}<br/>` : ""}${company.vatId ? `USt-IdNr.: ${escapeHtml(company.vatId)}` : ""}</div>
    <div>${company.bankName ? `${escapeHtml(company.bankName)}<br/>` : ""}${company.iban ? `IBAN ${escapeHtml(company.iban)}` : ""}</div>
  </footer>
</body></html>`;
}

function customerBlock(customer: Customer) {
  return [customer.name, customer.contactPerson, customer.address.street, `${customer.address.zip} ${customer.address.city}`.trim()]
    .filter(Boolean)
    .map(escapeHtml)
    .join("<br/>");
}

export async function previewInvoice(invoice: Invoice, data: AccountingData) {
  await Print.printAsync({ html: invoiceHtml(invoice, data) });
}

export async function shareInvoicePdf(invoice: Invoice, data: AccountingData) {
  const { uri } = await Print.printToFileAsync({ html: invoiceHtml(invoice, data) });
  const named = new File(Paths.cache, `${invoice.status === "draft" ? "Entwurf" : invoice.number}.pdf`);
  if (named.exists) named.delete();
  new File(uri).moveSync(named);
  await shareFile(named.uri, "application/pdf", `${title(invoice, data)} teilen`);
}

const unitCodes: Record<string, string> = {
  "stk.": "C62",
  stk: "C62",
  "std.": "HUR",
  std: "HUR",
  h: "HUR",
  "m²": "MTK",
  qm: "MTK",
  m: "MTR",
  kg: "KGM",
  l: "LTR",
  "pausch.": "LS",
  pauschal: "LS",
  tag: "DAY",
  tage: "DAY",
};

const xml = (value: string) => escapeHtml(value).replace(/'/g, "&apos;");
const amount = (value: number) => round2(value).toFixed(2);
const cleanDate = (iso: string) => iso.replace(/-/g, "");

/**
 * XRechnung 3.0 in UN/CEFACT CII syntax. Line discounts are line allowances and the
 * document discount is one allowance per VAT category, so all EN 16931 sums reconcile.
 */
export function xrechnungXml(invoice: Invoice, data: AccountingData) {
  const { company } = data;
  const customer = data.customers.find((item) => item.id === invoice.customerId);
  if (!customer) throw new Error("Für die XRechnung wird ein Kunde benötigt.");
  if (!company.vatId && !company.taxNumber) throw new Error("Bitte Steuernummer oder USt-IdNr. in den Firmendaten hinterlegen.");
  if (!company.email) throw new Error("Bitte eine E-Mail-Adresse in den Firmendaten hinterlegen.");

  const totals = totalsFor(invoice, company);
  const category = (rate: number) => (company.smallBusiness ? "E" : rate === 0 ? "Z" : "S");
  const exemption = company.smallBusiness ? "<ram:ExemptionReason>Kleinunternehmer gemäß § 19 UStG</ram:ExemptionReason>" : "";
  const original = invoice.correctionOf ? data.invoices.find((item) => item.id === invoice.correctionOf) : undefined;

  const lines = invoice.items
    .map((item, index) => {
      const rate = company.smallBusiness ? 0 : item.vatRate;
      const gross = round2(item.quantity * item.unitPrice);
      const net = lineNet(item);
      const allowance = round2(gross - net);
      return `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument><ram:LineID>${index + 1}</ram:LineID></ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct><ram:Name>${xml(item.description || `Position ${index + 1}`)}</ram:Name></ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice><ram:ChargeAmount>${amount(item.unitPrice)}</ram:ChargeAmount></ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="${unitCodes[item.unit.trim().toLowerCase()] ?? "C62"}">${item.quantity}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${category(rate)}</ram:CategoryCode>
          <ram:RateApplicablePercent>${rate}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>${
          allowance
            ? `
        <ram:SpecifiedTradeAllowanceCharge>
          <ram:ChargeIndicator><udt:Indicator>false</udt:Indicator></ram:ChargeIndicator>
          <ram:CalculationPercent>${item.discount}</ram:CalculationPercent>
          <ram:BasisAmount>${amount(gross)}</ram:BasisAmount>
          <ram:ActualAmount>${amount(allowance)}</ram:ActualAmount>
          <ram:Reason>Rabatt</ram:Reason>
        </ram:SpecifiedTradeAllowanceCharge>`
            : ""
        }
        <ram:SpecifiedTradeSettlementLineMonetarySummation><ram:LineTotalAmount>${amount(net)}</ram:LineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
    })
    .join("");

  const groupSubtotals = new Map<number, number>();
  for (const item of invoice.items) {
    const rate = company.smallBusiness ? 0 : item.vatRate;
    groupSubtotals.set(rate, round2((groupSubtotals.get(rate) ?? 0) + lineNet(item)));
  }

  const documentAllowances = totals.vat
    .map((group) => {
      const allowance = round2((groupSubtotals.get(group.rate) ?? 0) - group.net);
      if (!allowance) return "";
      return `
      <ram:SpecifiedTradeAllowanceCharge>
        <ram:ChargeIndicator><udt:Indicator>false</udt:Indicator></ram:ChargeIndicator>
        <ram:ActualAmount>${amount(allowance)}</ram:ActualAmount>
        <ram:Reason>Rabatt ${invoice.discount} %</ram:Reason>
        <ram:CategoryTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${category(group.rate)}</ram:CategoryCode>
          <ram:RateApplicablePercent>${group.rate}</ram:RateApplicablePercent>
        </ram:CategoryTradeTax>
      </ram:SpecifiedTradeAllowanceCharge>`;
    })
    .join("");
  const allowanceTotal = round2(totals.vat.reduce((sum, group) => sum + ((groupSubtotals.get(group.rate) ?? 0) - group.net), 0));

  const taxes = totals.vat
    .map(
      (group) => `
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${amount(group.tax)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>${exemption}
        <ram:BasisAmount>${amount(group.net)}</ram:BasisAmount>
        <ram:CategoryCode>${category(group.rate)}</ram:CategoryCode>
        <ram:RateApplicablePercent>${group.rate}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>`,
    )
    .join("");

  const address = (value: { street: string; zip: string; city: string; country: string }) => `
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${xml(value.zip)}</ram:PostcodeCode>
          <ram:LineOne>${xml(value.street)}</ram:LineOne>
          <ram:CityName>${xml(value.city)}</ram:CityName>
          <ram:CountryID>${xml(value.country || "DE")}</ram:CountryID>
        </ram:PostalTradeAddress>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:BusinessProcessSpecifiedDocumentContextParameter><ram:ID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</ram:ID></ram:BusinessProcessSpecifiedDocumentContextParameter>
    <ram:GuidelineSpecifiedDocumentContextParameter><ram:ID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0</ram:ID></ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${xml(invoice.number)}</ram:ID>
    <ram:TypeCode>${invoice.correctionOf ? "384" : "380"}</ram:TypeCode>
    <ram:IssueDateTime><udt:DateTimeString format="102">${cleanDate(invoice.issueDate)}</udt:DateTimeString></ram:IssueDateTime>${
      invoice.notes ? `\n    <ram:IncludedNote><ram:Content>${xml(invoice.notes)}</ram:Content></ram:IncludedNote>` : ""
    }
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>${lines}
    <ram:ApplicableHeaderTradeAgreement>
      <ram:BuyerReference>${xml(customer.buyerReference || invoice.number)}</ram:BuyerReference>
      <ram:SellerTradeParty>
        <ram:Name>${xml(company.name)}</ram:Name>
        <ram:DefinedTradeContact>
          <ram:PersonName>${xml(company.owner || company.name)}</ram:PersonName>
          <ram:TelephoneUniversalCommunication><ram:CompleteNumber>${xml(company.phone || "-")}</ram:CompleteNumber></ram:TelephoneUniversalCommunication>
          <ram:EmailURIUniversalCommunication><ram:URIID>${xml(company.email)}</ram:URIID></ram:EmailURIUniversalCommunication>
        </ram:DefinedTradeContact>${address(company.address)}
        <ram:URIUniversalCommunication><ram:URIID schemeID="EM">${xml(company.email)}</ram:URIID></ram:URIUniversalCommunication>${
          company.vatId ? `\n        <ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${xml(company.vatId)}</ram:ID></ram:SpecifiedTaxRegistration>` : ""
        }${company.taxNumber ? `\n        <ram:SpecifiedTaxRegistration><ram:ID schemeID="FC">${xml(company.taxNumber)}</ram:ID></ram:SpecifiedTaxRegistration>` : ""}
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${xml(customer.name)}</ram:Name>${address(customer.address)}
        <ram:URIUniversalCommunication><ram:URIID schemeID="EM">${xml(customer.email || company.email)}</ram:URIID></ram:URIUniversalCommunication>${
          customer.vatId ? `\n        <ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${xml(customer.vatId)}</ram:ID></ram:SpecifiedTaxRegistration>` : ""
        }
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery>
      <ram:ActualDeliverySupplyChainEvent><ram:OccurrenceDateTime><udt:DateTimeString format="102">${cleanDate(invoice.serviceDate)}</udt:DateTimeString></ram:OccurrenceDateTime></ram:ActualDeliverySupplyChainEvent>
    </ram:ApplicableHeaderTradeDelivery>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:PaymentReference>${xml(invoice.number)}</ram:PaymentReference>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>${
        company.iban
          ? `
      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>58</ram:TypeCode>
        <ram:PayeePartyCreditorFinancialAccount><ram:IBANID>${xml(company.iban.replace(/\s/g, ""))}</ram:IBANID></ram:PayeePartyCreditorFinancialAccount>
      </ram:SpecifiedTradeSettlementPaymentMeans>`
          : ""
      }${taxes}${documentAllowances}
      <ram:SpecifiedTradePaymentTerms>
        <ram:Description>Zahlbar bis ${formatDate(invoice.dueDate)} ohne Abzug.</ram:Description>
        <ram:DueDateDateTime><udt:DateTimeString format="102">${cleanDate(invoice.dueDate)}</udt:DateTimeString></ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${amount(totals.subtotal)}</ram:LineTotalAmount>
        <ram:AllowanceTotalAmount>${amount(allowanceTotal)}</ram:AllowanceTotalAmount>
        <ram:TaxBasisTotalAmount>${amount(totals.net)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">${amount(totals.tax)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${amount(totals.gross)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${amount(totals.gross)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>${
        original
          ? `
      <ram:InvoiceReferencedDocument>
        <ram:IssuerAssignedID>${xml(original.number)}</ram:IssuerAssignedID>
        <ram:FormattedIssueDateTime><qdt:DateTimeString xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100" format="102">${cleanDate(original.issueDate)}</qdt:DateTimeString></ram:FormattedIssueDateTime>
      </ram:InvoiceReferencedDocument>`
          : ""
      }
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>
`;
}

export async function shareXRechnung(invoice: Invoice, data: AccountingData) {
  const file = new File(Paths.cache, `${invoice.number}-XRechnung.xml`);
  if (file.exists) file.delete();
  file.create();
  file.write(xrechnungXml(invoice, data));
  await shareFile(file.uri, "application/xml", "XRechnung teilen");
}
