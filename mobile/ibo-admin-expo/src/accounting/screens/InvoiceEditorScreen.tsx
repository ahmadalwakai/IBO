import React, { useMemo, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import {
  createId,
  formatDate,
  formatMoney,
  invoiceTotals,
  lineNet,
  recurrenceLabels,
  statusOf,
  todayISO,
  totalsFor,
  vatRates,
} from "../calc";
import { previewInvoice, shareInvoicePdf, shareXRechnung } from "../invoice-documents";
import type { Nav } from "../navigation";
import { useAccounting } from "../store";
import type { Invoice, LineItem, Recurrence, VatRate } from "../types";
import {
  AmountField,
  Badge,
  Button,
  Card,
  Chips,
  colors,
  DateField,
  Divider,
  Empty,
  Field,
  Icon,
  KeyValue,
  ListRow,
  Screen,
  SearchField,
  SectionTitle,
  Segmented,
  styles,
} from "../../ui";

type Props = { nav: Nav } & ({ id: string } | { kind: Invoice["kind"]; customerId?: string });

export function InvoiceEditorScreen(props: Props) {
  const store = useAccounting();
  const { data } = store;
  const existing = "id" in props ? data.invoices.find((invoice) => invoice.id === props.id) : undefined;
  const [draft, setDraft] = useState<Invoice | null>(() =>
    existing ? (JSON.parse(JSON.stringify(existing)) as Invoice) : "kind" in props ? store.newInvoice(props.kind, props.customerId) : null,
  );
  const [pickerOpen, setPickerOpen] = useState(false);

  const current = existing && existing.status !== "draft" ? existing : draft;
  if (!current) {
    return (
      <Screen title="Rechnung" onBack={props.nav.back}>
        <Empty icon="alert-circle" title="Nicht gefunden" text="Dieses Dokument existiert nicht mehr." />
      </Screen>
    );
  }
  if (current.status !== "draft") return <InvoiceDetail invoice={current} nav={props.nav} />;

  const invoice = draft as Invoice;
  const label = invoice.kind === "offer" ? "Angebot" : invoice.correctionOf ? "Korrekturrechnung" : "Rechnung";
  const set = (patch: Partial<Invoice>) => setDraft((value) => (value ? { ...value, ...patch } : value));
  const setItem = (id: string, patch: Partial<LineItem>) =>
    set({ items: invoice.items.map((item) => (item.id === id ? { ...item, ...patch } : item)) });

  const validate = () => {
    if (!invoice.customerId) return "Bitte einen Kunden auswählen.";
    if (!invoice.items.some((item) => item.description.trim() && item.quantity)) return "Bitte mindestens eine Position mit Beschreibung erfassen.";
    if (invoice.dueDate < invoice.issueDate) return "Das Fälligkeitsdatum liegt vor dem Rechnungsdatum.";
    return null;
  };

  const saveDraft = () => {
    store.saveInvoice({ ...invoice, items: invoice.items.filter((item) => item.description.trim() || item.unitPrice) });
    props.nav.back();
  };

  const issue = () => {
    const problem = validate();
    if (problem) return Alert.alert("Noch nicht vollständig", problem);
    const clean = { ...invoice, items: invoice.items.filter((item) => item.description.trim()) };
    const finish = () => {
      const issued = store.finalizeInvoice(clean);
      props.nav.replace({ name: "invoice", id: issued.id });
    };
    if (invoice.kind === "offer") return finish();
    Alert.alert(
      "Rechnung ausstellen?",
      "Die Rechnung erhält eine fortlaufende Nummer und wird festgeschrieben. Spätere Änderungen erfolgen per Korrekturrechnung, das Original bleibt erhalten.",
      [
        { text: "Abbrechen", style: "cancel" },
        { text: "Ausstellen", onPress: finish },
      ],
    );
  };

  return (
    <Screen
      title={existing ? `${label} bearbeiten` : `Neue${invoice.kind === "offer" ? "s" : ""} ${label}`}
      subtitle="Entwurf · wird automatisch berechnet"
      onBack={props.nav.back}
    >
      <Card>
        <SectionTitle>Kunde</SectionTitle>
        <CustomerSelect customerId={invoice.customerId} onPress={() => setPickerOpen(true)} />
      </Card>

      <Card>
        <SectionTitle>Daten</SectionTitle>
        <View style={styles.row}>
          <DateField label="Datum" value={invoice.issueDate} onChange={(issueDate) => set({ issueDate })} style={styles.flex} />
          <DateField label="Leistung" value={invoice.serviceDate} onChange={(serviceDate) => set({ serviceDate })} style={styles.flex} />
        </View>
        <DateField label={invoice.kind === "offer" ? "Gültig bis" : "Fällig am"} value={invoice.dueDate} onChange={(dueDate) => set({ dueDate })} />
        {invoice.kind === "invoice" ? (
          <View style={{ gap: 6 }}>
            <Text style={styles.label}>Wiederholung</Text>
            <Chips
              options={(Object.keys(recurrenceLabels) as Recurrence[]).map((value) => ({ value, label: recurrenceLabels[value] }))}
              value={invoice.recurrence}
              onChange={(recurrence) => set({ recurrence })}
            />
          </View>
        ) : null}
      </Card>

      <SectionTitle>Positionen</SectionTitle>
      {invoice.items.map((item, index) => (
        <LineEditor
          key={item.id}
          index={index}
          item={item}
          smallBusiness={data.company.smallBusiness}
          onChange={(patch) => setItem(item.id, patch)}
          onRemove={invoice.items.length > 1 ? () => set({ items: invoice.items.filter((entry) => entry.id !== item.id) }) : undefined}
        />
      ))}
      <Button
        label="Position hinzufügen"
        icon="add"
        tone="secondary"
        onPress={() =>
          set({
            items: [
              ...invoice.items,
              { id: createId("item"), description: "", quantity: 1, unit: "Stk.", unitPrice: 0, discount: 0, vatRate: 19 },
            ],
          })
        }
      />
      <PreviousItems onPick={(item) => set({ items: [...invoice.items.filter((entry) => entry.description.trim() || entry.unitPrice), { ...item, id: createId("item") }] })} />

      <Card>
        <AmountField label="Gesamtrabatt" suffix="%" value={invoice.discount} onChange={(discount) => set({ discount: Math.min(100, Math.max(0, discount)) })} />
        <Field label="Hinweis auf dem Dokument" value={invoice.notes} onChangeText={(notes) => set({ notes })} multiline placeholder="z. B. Vielen Dank für Ihren Auftrag." />
      </Card>

      <TotalsCard invoice={invoice} smallBusiness={data.company.smallBusiness} />

      <Button label={invoice.kind === "offer" ? "Angebot erstellen" : "Rechnung ausstellen"} icon="checkmark-circle" onPress={issue} />
      <View style={styles.row}>
        <Button label="Vorschau" icon="eye" tone="ghost" onPress={() => previewInvoice(invoice, data).catch(showError)} style={styles.flex} />
        <Button label="Entwurf speichern" icon="save" tone="secondary" onPress={saveDraft} style={styles.flex} />
      </View>
      {existing ? (
        <Button
          label="Entwurf löschen"
          icon="trash"
          tone="danger"
          onPress={() =>
            Alert.alert("Entwurf löschen?", "Der Entwurf wird endgültig entfernt.", [
              { text: "Abbrechen", style: "cancel" },
              {
                text: "Löschen",
                style: "destructive",
                onPress: () => {
                  store.deleteInvoice(invoice.id);
                  props.nav.back();
                },
              },
            ])
          }
        />
      ) : null}

      <CustomerPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(customerId) => {
          set({ customerId });
          setPickerOpen(false);
        }}
        onCreate={() => {
          setPickerOpen(false);
          props.nav.push({ name: "customer", kind: "customer" });
        }}
      />
    </Screen>
  );
}

function LineEditor({
  index,
  item,
  smallBusiness,
  onChange,
  onRemove,
}: {
  index: number;
  item: LineItem;
  smallBusiness: boolean;
  onChange: (patch: Partial<LineItem>) => void;
  onRemove?: () => void;
}) {
  return (
    <Card>
      <View style={local.lineHead}>
        <Text style={local.lineIndex}>{`Pos. ${index + 1}`}</Text>
        <Text style={local.lineTotal}>{formatMoney(lineNet(item))}</Text>
        {onRemove ? (
          <Pressable accessibilityLabel="Position entfernen" onPress={onRemove} hitSlop={10}>
            <Icon name="close-circle" color={colors.muted} size={22} />
          </Pressable>
        ) : null}
      </View>
      <Field label="Beschreibung" value={item.description} onChangeText={(description) => onChange({ description })} multiline placeholder="Leistung oder Produkt" />
      <View style={styles.row}>
        <AmountField label="Menge" suffix="" value={item.quantity} onChange={(quantity) => onChange({ quantity })} style={styles.flex} />
        <Field label="Einheit" value={item.unit} onChangeText={(unit) => onChange({ unit })} style={styles.flex} />
      </View>
      <View style={styles.row}>
        <AmountField label="Einzelpreis netto" value={item.unitPrice} onChange={(unitPrice) => onChange({ unitPrice })} style={styles.flex} />
        <AmountField label="Rabatt" suffix="%" value={item.discount} onChange={(discount) => onChange({ discount: Math.min(100, Math.max(0, discount)) })} style={styles.flex} />
      </View>
      {!smallBusiness ? (
        <Segmented
          options={vatRates.map((rate) => ({ value: String(rate), label: `${rate} % USt.` }))}
          value={String(item.vatRate)}
          onChange={(rate) => onChange({ vatRate: Number(rate) as VatRate })}
        />
      ) : null}
    </Card>
  );
}

function PreviousItems({ onPick }: { onPick: (item: LineItem) => void }) {
  const { data } = useAccounting();
  const items = useMemo(() => {
    const seen = new Map<string, LineItem>();
    for (const invoice of [...data.invoices].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
      for (const item of invoice.items) {
        const key = item.description.trim().toLowerCase();
        if (key && !seen.has(key)) seen.set(key, item);
      }
    }
    return [...seen.values()].slice(0, 10);
  }, [data.invoices]);
  if (!items.length) return null;
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>Schnell hinzufügen</Text>
      <Chips
        options={items.map((item) => ({ value: item.id, label: `${item.description.split("\n")[0].slice(0, 26)} · ${formatMoney(item.unitPrice)}` }))}
        value=""
        onChange={(id) => {
          const item = items.find((entry) => entry.id === id);
          if (item) onPick(item);
        }}
      />
    </View>
  );
}

function TotalsCard({ invoice, smallBusiness }: { invoice: Invoice; smallBusiness: boolean }) {
  const totals = invoiceTotals(invoice.items, invoice.discount, smallBusiness);
  return (
    <Card dark>
      <KeyValueDark label="Zwischensumme netto" value={formatMoney(totals.subtotal)} />
      {totals.discountAmount ? <KeyValueDark label={`Rabatt ${invoice.discount} %`} value={formatMoney(-totals.discountAmount)} /> : null}
      {smallBusiness ? (
        <KeyValueDark label="Keine USt. (§ 19 UStG)" value={formatMoney(0)} />
      ) : (
        totals.vat.map((group) => <KeyValueDark key={group.rate} label={`USt. ${group.rate} % auf ${formatMoney(group.net)}`} value={formatMoney(group.tax)} />)
      )}
      <View style={local.darkDivider} />
      <KeyValueDark label="Gesamtbetrag" value={formatMoney(totals.gross)} strong />
    </Card>
  );
}

function KeyValueDark({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.keyValue}>
      <Text style={[local.darkLabel, strong && local.darkStrong]}>{label}</Text>
      <Text style={[local.darkValue, strong && local.darkStrongValue]}>{value}</Text>
    </View>
  );
}

function CustomerSelect({ customerId, onPress }: { customerId: string; onPress: () => void }) {
  const { data } = useAccounting();
  const customer = data.customers.find((item) => item.id === customerId);
  return (
    <ListRow
      icon={customer ? "person" : "person-add"}
      iconTone={customer ? "dark" : "gold"}
      title={customer?.name ?? "Kunden auswählen"}
      subtitle={customer ? [customer.address.street, `${customer.address.zip} ${customer.address.city}`.trim()].filter(Boolean).join(", ") : "Pflichtangabe für Rechnungen"}
      right={<Icon name="chevron-forward" color={colors.muted} />}
      onPress={onPress}
    />
  );
}

function CustomerPicker({
  open,
  onClose,
  onPick,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (id: string) => void;
  onCreate: () => void;
}) {
  const { data } = useAccounting();
  const [query, setQuery] = useState("");
  const customers = data.customers
    .filter((customer) => customer.kind === "customer")
    .filter((customer) => customer.name.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <Screen title="Kunde auswählen" right={<Button label="Fertig" tone="gold" onPress={onClose} style={local.sheetClose} />}>
        <SearchField value={query} onChangeText={setQuery} placeholder="Kunden suchen" />
        <Button label="Neuen Kunden anlegen" icon="person-add" tone="secondary" onPress={onCreate} />
        <Card>
          {customers.length ? (
            customers.map((customer) => (
              <ListRow
                key={customer.id}
                icon="person"
                title={customer.name}
                subtitle={customer.address.city || customer.email}
                onPress={() => onPick(customer.id)}
              />
            ))
          ) : (
            <Empty icon="people-outline" title="Keine Kunden" text="Legen Sie Ihren ersten Kunden an." />
          )}
        </Card>
      </Screen>
    </Modal>
  );
}

function InvoiceDetail({ invoice, nav }: { invoice: Invoice; nav: Nav }) {
  const store = useAccounting();
  const { data } = store;
  const customer = data.customers.find((item) => item.id === invoice.customerId);
  const totals = totalsFor(invoice, data.company);
  const status = statusOf(invoice);
  const original = invoice.correctionOf ? data.invoices.find((item) => item.id === invoice.correctionOf) : undefined;
  const replacement = invoice.correctedBy ? data.invoices.find((item) => item.id === invoice.correctedBy) : undefined;
  const isInvoice = invoice.kind === "invoice";
  const locked = invoice.status === "cancelled";

  const confirm = (title: string, message: string, action: () => void, destructive = false) =>
    Alert.alert(title, message, [
      { text: "Abbrechen", style: "cancel" },
      { text: "Bestätigen", style: destructive ? "destructive" : "default", onPress: action },
    ]);

  return (
    <Screen
      title={invoice.number}
      subtitle={`${isInvoice ? (invoice.correctionOf ? "Korrekturrechnung" : "Rechnung") : "Angebot"} · ${formatDate(invoice.issueDate)}`}
      onBack={nav.back}
    >
      <Card dark>
        <View style={styles.keyValue}>
          <Text style={local.darkLabel}>{customer?.name ?? "Ohne Kunde"}</Text>
          <Badge label={status.label} tone={status.tone} />
        </View>
        <Text style={local.heroAmount}>{formatMoney(totals.gross)}</Text>
        <Text style={local.darkLabel}>
          {isInvoice
            ? invoice.status === "paid"
              ? `Bezahlt am ${formatDate(invoice.paidAt)}`
              : `Fällig am ${formatDate(invoice.dueDate)}`
            : `Gültig bis ${formatDate(invoice.dueDate)}`}
        </Text>
      </Card>

      {original ? (
        <ListRow icon="git-compare" iconTone="gold" title={`Ersetzt ${original.number}`} subtitle="Original bleibt unverändert archiviert" onPress={() => nav.push({ name: "invoice", id: original.id })} />
      ) : null}
      {replacement ? (
        <ListRow icon="git-compare" iconTone="gold" title={`Ersetzt durch ${replacement.status === "draft" ? "Korrektur-Entwurf" : replacement.number}`} onPress={() => nav.push({ name: "invoice", id: replacement.id })} />
      ) : null}

      <View style={styles.row}>
        <Button label="Ansehen" icon="eye" tone="ghost" onPress={() => previewInvoice(invoice, data).catch(showError)} style={styles.flex} />
        <Button label="Senden" icon="share-outline" onPress={() => shareInvoicePdf(invoice, data).catch(showError)} style={styles.flex} />
      </View>

      {!locked ? (
        <Card>
          <SectionTitle>Aktionen</SectionTitle>
          {isInvoice && invoice.status === "sent" ? (
            <Button
              label="Zahlungseingang erfassen"
              icon="checkmark-done"
              onPress={() => confirm("Als bezahlt markieren?", `Zahlungseingang heute (${formatDate(todayISO())}) über ${formatMoney(totals.gross)}.`, () => store.markPaid(invoice))}
            />
          ) : null}
          {!isInvoice && invoice.status === "sent" ? (
            <Button
              label="In Rechnung umwandeln"
              icon="swap-horizontal"
              onPress={() => {
                const created = store.convertOffer(invoice);
                nav.replace({ name: "invoice", id: created.id });
              }}
            />
          ) : null}
          {isInvoice && invoice.recurrence !== "none" && invoice.nextRecurrence ? (
            <Button
              label={`Serienrechnung zum ${formatDate(invoice.nextRecurrence)} erstellen`}
              icon="repeat"
              tone="secondary"
              onPress={() => {
                const created = store.createRecurring(invoice);
                nav.push({ name: "invoice", id: created.id });
              }}
            />
          ) : null}
          {isInvoice ? (
            <Button label="XRechnung exportieren (XML)" icon="code-download-outline" tone="ghost" onPress={() => shareXRechnung(invoice, data).catch(showError)} />
          ) : null}
          {isInvoice ? (
            <Button
              label="Rechnung korrigieren"
              icon="create-outline"
              tone="ghost"
              onPress={() =>
                confirm(
                  "Korrekturrechnung erstellen?",
                  `${invoice.number} wird als ersetzt markiert und bleibt unverändert erhalten. Sie bearbeiten anschließend eine neue Korrekturrechnung.`,
                  () => {
                    const correction = store.correctInvoice(invoice);
                    nav.replace({ name: "invoice", id: correction.id });
                  },
                )
              }
            />
          ) : null}
          <Button
            label={isInvoice ? "Stornieren" : "Als abgelehnt markieren"}
            icon="close-circle-outline"
            tone="danger"
            onPress={() =>
              confirm(
                isInvoice ? "Rechnung stornieren?" : "Angebot ablehnen?",
                isInvoice ? "Die Rechnung bleibt archiviert, zählt aber nicht mehr zu Umsatz und Umsatzsteuer." : "Das Angebot wird als abgelehnt markiert.",
                () => store.cancelInvoice(invoice),
                true,
              )
            }
          />
        </Card>
      ) : null}

      <Card>
        <SectionTitle>Positionen</SectionTitle>
        {invoice.items.map((item, index) => (
          <View key={item.id} style={local.detailLine}>
            <Text style={local.detailTitle}>{`${index + 1}. ${item.description}`}</Text>
            <View style={styles.keyValue}>
              <Text style={styles.kvLabel}>
                {`${String(item.quantity).replace(".", ",")} ${item.unit} × ${formatMoney(item.unitPrice)}${item.discount ? ` − ${item.discount} %` : ""}${
                  data.company.smallBusiness ? "" : ` · ${item.vatRate} %`
                }`}
              </Text>
              <Text style={styles.kvValue}>{formatMoney(lineNet(item))}</Text>
            </View>
          </View>
        ))}
        <Divider />
        <KeyValue label="Netto" value={formatMoney(totals.net)} />
        {totals.vat.map((group) => (
          <KeyValue key={group.rate} label={`USt. ${group.rate} %`} value={formatMoney(group.tax)} />
        ))}
        <KeyValue label="Gesamt" value={formatMoney(totals.gross)} strong />
      </Card>

      <Card>
        <SectionTitle>Verlauf</SectionTitle>
        {[...invoice.history].reverse().map((entry, index) => (
          <ListRow key={`${entry.at}-${index}`} icon="time-outline" title={entry.text} subtitle={new Date(entry.at).toLocaleString("de-DE")} />
        ))}
      </Card>
    </Screen>
  );
}

function showError(error: unknown) {
  Alert.alert("Aktion nicht möglich", error instanceof Error ? error.message : String(error));
}

const local = StyleSheet.create({
  lineHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  lineIndex: { color: colors.muted, fontWeight: "800", flex: 1 },
  lineTotal: { color: colors.text, fontWeight: "800", fontSize: 16 },
  darkLabel: { color: colors.onDarkMuted, fontSize: 14 },
  darkValue: { color: colors.onDark, fontSize: 14, fontWeight: "700" },
  darkStrong: { color: colors.onDark, fontSize: 16, fontWeight: "700" },
  darkStrongValue: { color: colors.emerald, fontSize: 24, fontWeight: "800" },
  darkDivider: { height: 1, backgroundColor: "rgba(199,206,218,0.18)" },
  heroAmount: { color: colors.onDark, fontSize: 34, fontWeight: "800" },
  detailLine: { gap: 4 },
  detailTitle: { color: colors.text, fontWeight: "700" },
  sheetClose: { minHeight: 36, borderColor: colors.gold },
});
