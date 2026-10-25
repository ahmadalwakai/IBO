import React, { useMemo, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import {
  createId,
  expenseCategoryLabels,
  expenseItemsTotal,
  expenseVatFromItems,
  formatDate,
  formatMoney,
  lineNet,
  paymentMethodLabels,
  round2,
  todayISO,
  vatRates,
} from "../calc";
import type { Nav, ScanSource } from "../navigation";
import type { ReceiptDraft } from "../receipt-parser";
import { documentFile, importDocument } from "../storage";
import { useAccounting } from "../store";
import type { Expense, ExpenseCategory, ExpenseItem, PaymentMethod, VatRate } from "../types";
import {
  AmountField,
  Button,
  Card,
  Chips,
  colors,
  DateField,
  Field,
  Icon,
  KeyValue,
  ListRow,
  Screen,
  SectionTitle,
  Segmented,
  styles,
} from "../ui";

function fromDraft(draft?: ReceiptDraft): Expense {
  return {
    id: createId("exp"),
    vendor: draft?.vendor ?? "",
    vendorAddress: draft?.vendorAddress ?? "",
    date: draft?.date || todayISO(),
    receiptNumber: draft?.receiptNumber ?? "",
    category: draft?.category ?? "other",
    paymentMethod: draft?.paymentMethod ?? "card",
    items: draft?.items ?? [],
    total: draft?.total ?? 0,
    vat: draft?.vat ?? [],
    notes: "",
    createdAt: new Date().toISOString(),
  };
}

export function ExpenseEditorScreen({
  nav,
  id,
  draft: receipt,
  source,
}: {
  nav: Nav;
  id?: string;
  draft?: ReceiptDraft;
  source?: ScanSource;
}) {
  const store = useAccounting();
  const { data } = store;
  const existing = id ? data.expenses.find((expense) => expense.id === id) : undefined;
  const [expense, setExpense] = useState<Expense>(() => existing ?? fromDraft(receipt));
  const [manualVatRate, setManualVatRate] = useState<VatRate>(expense.vat[0]?.rate ?? 19);
  const [showText, setShowText] = useState(false);
  const [saveSupplier, setSaveSupplier] = useState(!existing);
  const doc = expense.documentId ? data.documents.find((item) => item.id === expense.documentId) : undefined;
  const previewUri = source?.mimeType.startsWith("image/") ? source.uri : doc?.mimeType.startsWith("image/") ? documentFile(doc).uri : undefined;

  const set = (patch: Partial<Expense>) => setExpense((value) => ({ ...value, ...patch }));
  const setItems = (items: ExpenseItem[]) => {
    const total = expenseItemsTotal(items);
    setExpense((value) => ({ ...value, items, total, vat: expenseVatFromItems(items) }));
  };
  const setItem = (itemId: string, patch: Partial<ExpenseItem>) =>
    setItems(expense.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)));

  const itemsTotal = expenseItemsTotal(expense.items);
  const mismatch = expense.items.length > 0 && Math.abs(itemsTotal - expense.total) > 0.05;
  const vat = useMemo(() => {
    if (data.company.smallBusiness) return [];
    if (expense.items.length && !mismatch) return expense.vat.length ? expense.vat : expenseVatFromItems(expense.items);
    const net = round2(expense.total / (1 + manualVatRate / 100));
    return [{ rate: manualVatRate, net, tax: round2(expense.total - net) }];
  }, [data.company.smallBusiness, expense.items, expense.total, expense.vat, manualVatRate, mismatch]);

  const duplicates = data.expenses.filter(
    (other) =>
      other.id !== expense.id &&
      other.date === expense.date &&
      Math.abs(other.total - expense.total) < 0.01 &&
      (other.vendor.toLowerCase() === expense.vendor.toLowerCase() || (expense.receiptNumber && other.receiptNumber === expense.receiptNumber)),
  );

  const persist = () => {
    let next: Expense = { ...expense, vendor: expense.vendor.trim(), vat };
    if (saveSupplier && next.vendor && !next.supplierId) {
      const match = data.customers.find((customer) => customer.kind === "supplier" && customer.name.toLowerCase() === next.vendor.toLowerCase());
      if (match) {
        next.supplierId = match.id;
      } else {
        const supplierId = createId("sup");
        const [street = "", zipCity = ""] = next.vendorAddress.split(",").map((part) => part.trim());
        const [, zip = "", city = ""] = zipCity.match(/^(\d{5})\s+(.*)$/) ?? [];
        store.saveCustomer({
          id: supplierId,
          kind: "supplier",
          name: next.vendor,
          contactPerson: "",
          email: "",
          phone: "",
          address: { street, zip, city, country: "DE" },
          vatId: "",
          buyerReference: "",
          notes: "",
          createdAt: new Date().toISOString(),
        });
        next.supplierId = supplierId;
      }
    }
    if (source && !next.documentId) {
      const archived = importDocument({
        uri: source.uri,
        mimeType: source.mimeType,
        kind: "receipt",
        title: `${next.vendor || "Beleg"} ${formatDate(next.date)}`,
        text: source.text,
      });
      const twin = data.documents.find((item) => item.fingerprint === archived.fingerprint);
      store.addDocument({
        ...archived,
        expenseId: next.id,
        history: twin ? [...archived.history, { at: archived.createdAt, text: `Identische Datei wie „${twin.title}“` }] : archived.history,
      });
      next = { ...next, documentId: archived.id };
    }
    store.saveExpense(next);
    nav.back();
  };

  const save = () => {
    if (!expense.total) return Alert.alert("Betrag fehlt", "Bitte den Gesamtbetrag des Belegs eingeben.");
    if (duplicates.length) {
      return Alert.alert(
        "Möglicherweise doppelt",
        `Es gibt bereits eine Ausgabe von ${duplicates[0].vendor} am ${formatDate(duplicates[0].date)} über ${formatMoney(duplicates[0].total)}.`,
        [
          { text: "Abbrechen", style: "cancel" },
          { text: "Trotzdem speichern", onPress: persist },
        ],
      );
    }
    persist();
  };

  return (
    <Screen
      title={existing ? expense.vendor || "Ausgabe" : receipt ? "Beleg prüfen" : "Neue Ausgabe"}
      subtitle={receipt ? "Erkannte Daten · bitte prüfen und speichern" : "Ausgabe erfassen"}
      onBack={nav.back}
    >
      {receipt?.warnings.length ? (
        <Card style={local.warning}>
          {receipt.warnings.map((warning) => (
            <View key={warning} style={local.warningRow}>
              <Icon name="alert-circle" color={colors.warning} size={18} />
              <Text style={local.warningText}>{warning}</Text>
            </View>
          ))}
        </Card>
      ) : null}

      {previewUri ? (
        <Pressable onPress={() => doc && nav.push({ name: "document", id: doc.id })}>
          <Image source={{ uri: previewUri }} style={local.preview} resizeMode="cover" />
        </Pressable>
      ) : source || doc ? (
        <ListRow icon="document-attach" iconTone="dark" title={doc?.title ?? "PDF-Beleg"} subtitle="Wird im Dokumentenarchiv gespeichert" onPress={doc ? () => nav.push({ name: "document", id: doc.id }) : undefined} />
      ) : null}

      <Card>
        <SectionTitle>Händler</SectionTitle>
        <Field label="Name" value={expense.vendor} onChangeText={(vendor) => set({ vendor })} />
        <Field label="Adresse" value={expense.vendorAddress} onChangeText={(vendorAddress) => set({ vendorAddress })} />
        <View style={styles.row}>
          <DateField label="Kaufdatum" value={expense.date} onChange={(date) => set({ date })} style={styles.flex} />
          <Field label="Beleg-Nr." value={expense.receiptNumber} onChangeText={(receiptNumber) => set({ receiptNumber })} style={styles.flex} />
        </View>
        {!existing ? (
          <Pressable style={local.check} onPress={() => setSaveSupplier((value) => !value)}>
            <Icon name={saveSupplier ? "checkbox" : "square-outline"} color={saveSupplier ? "#00A57B" : colors.muted} />
            <Text style={styles.kvLabel}>Händler als Lieferant speichern</Text>
          </Pressable>
        ) : null}
      </Card>

      <Card>
        <SectionTitle>Einordnung</SectionTitle>
        <Text style={styles.label}>Kategorie</Text>
        <Chips
          options={(Object.keys(expenseCategoryLabels) as ExpenseCategory[]).map((value) => ({ value, label: expenseCategoryLabels[value] }))}
          value={expense.category}
          onChange={(category) => set({ category })}
        />
        <Text style={styles.label}>Zahlungsart</Text>
        <Chips
          options={(Object.keys(paymentMethodLabels) as PaymentMethod[]).map((value) => ({ value, label: paymentMethodLabels[value] }))}
          value={expense.paymentMethod}
          onChange={(paymentMethod) => set({ paymentMethod })}
        />
      </Card>

      <SectionTitle>{`Positionen (${expense.items.length})`}</SectionTitle>
      {expense.items.map((item) => (
        <Card key={item.id}>
          <View style={local.itemHead}>
            <Field label="Artikel" value={item.description} onChangeText={(description) => setItem(item.id, { description })} style={styles.flex} />
            <Pressable accessibilityLabel="Position entfernen" onPress={() => setItems(expense.items.filter((entry) => entry.id !== item.id))} hitSlop={10} style={local.remove}>
              <Icon name="close-circle" color={colors.muted} size={22} />
            </Pressable>
          </View>
          <View style={styles.row}>
            <AmountField label="Menge" suffix="" value={item.quantity} onChange={(quantity) => setItem(item.id, { quantity })} style={styles.flex} />
            <AmountField label="Preis brutto" value={item.unitPrice} onChange={(unitPrice) => setItem(item.id, { unitPrice })} style={styles.flex} />
            <AmountField label="Rabatt" suffix="%" value={item.discount} onChange={(discount) => setItem(item.id, { discount })} style={styles.flex} />
          </View>
          <View style={local.itemFoot}>
            {!data.company.smallBusiness ? (
              <View style={styles.flex}>
                <Segmented
                  options={vatRates.map((rate) => ({ value: String(rate), label: `${rate} %` }))}
                  value={String(item.vatRate)}
                  onChange={(rate) => setItem(item.id, { vatRate: Number(rate) as VatRate })}
                />
              </View>
            ) : null}
            <Text style={local.itemTotal}>{formatMoney(lineNet(item))}</Text>
          </View>
        </Card>
      ))}
      <Button
        label="Position hinzufügen"
        icon="add"
        tone="secondary"
        onPress={() => setItems([...expense.items, { id: createId("item"), description: "", quantity: 1, unitPrice: 0, discount: 0, vatRate: 19 }])}
      />

      <Card>
        <SectionTitle>Beträge</SectionTitle>
        <AmountField label="Gesamtbetrag laut Beleg (brutto)" value={expense.total} onChange={(total) => set({ total })} />
        {mismatch ? (
          <Text style={local.mismatch}>{`Positionen ergeben ${formatMoney(itemsTotal)}. Steuer wird aus dem Gesamtbetrag berechnet.`}</Text>
        ) : null}
        {!data.company.smallBusiness && (mismatch || !expense.items.length) ? (
          <Segmented
            options={vatRates.map((rate) => ({ value: String(rate), label: `${rate} % USt.` }))}
            value={String(manualVatRate)}
            onChange={(rate) => setManualVatRate(Number(rate) as VatRate)}
          />
        ) : null}
        {vat.map((group) => (
          <KeyValue key={group.rate} label={`Vorsteuer ${group.rate} % (netto ${formatMoney(group.net)})`} value={formatMoney(group.tax)} />
        ))}
        <KeyValue label="Gesamt" value={formatMoney(expense.total)} strong />
        <Field label="Notiz" value={expense.notes} onChangeText={(notes) => set({ notes })} multiline placeholder="z. B. Projekt, Anlass der Bewirtung" />
      </Card>

      <Button label={existing ? "Änderungen speichern" : "Ausgabe speichern"} icon="checkmark-circle" onPress={save} />

      {source?.text ? (
        <Card>
          <Pressable onPress={() => setShowText((value) => !value)} style={local.check}>
            <Icon name={showText ? "chevron-down" : "chevron-forward"} color={colors.muted} />
            <Text style={styles.kvLabel}>Erkannter Text</Text>
          </Pressable>
          {showText ? <Text style={local.raw}>{source.text}</Text> : null}
        </Card>
      ) : null}

      {existing ? (
        <Button
          label="Ausgabe löschen"
          icon="trash"
          tone="danger"
          onPress={() =>
            Alert.alert("Ausgabe löschen?", "Der Beleg bleibt im Dokumentenarchiv erhalten.", [
              { text: "Abbrechen", style: "cancel" },
              {
                text: "Löschen",
                style: "destructive",
                onPress: () => {
                  store.deleteExpense(expense.id);
                  nav.back();
                },
              },
            ])
          }
        />
      ) : null}
    </Screen>
  );
}

const local = StyleSheet.create({
  warning: { backgroundColor: "#FDF3DC", gap: 8 },
  warningRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  warningText: { color: "#6B4A12", flex: 1, lineHeight: 19 },
  preview: { width: "100%", height: 220, borderRadius: 20, backgroundColor: colors.night },
  check: { flexDirection: "row", gap: 8, alignItems: "center" },
  itemHead: { flexDirection: "row", gap: 8, alignItems: "flex-end" },
  remove: { paddingBottom: 12 },
  itemFoot: { flexDirection: "row", alignItems: "center", gap: 12 },
  itemTotal: { color: colors.text, fontWeight: "900", fontSize: 16, minWidth: 80, textAlign: "right" },
  mismatch: { color: colors.warning, fontSize: 13 },
  raw: { color: colors.muted, fontFamily: "Menlo", fontSize: 12, lineHeight: 17 },
});
