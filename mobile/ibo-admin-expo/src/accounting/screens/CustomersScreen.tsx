import React, { useMemo, useState } from "react";
import { Alert, Linking, Text, View } from "react-native";
import { createId, formatDate, formatMoney, statusOf, totalsFor } from "../calc";
import type { Nav } from "../navigation";
import { useAccounting } from "../store";
import type { Customer } from "../types";
import { Badge, Button, Card, colors, Empty, Field, HeaderButton, ListRow, Screen, SearchField, SectionTitle, Segmented, styles } from "../ui";

export function CustomersScreen({ nav }: { nav: Nav }) {
  const { data } = useAccounting();
  const [kind, setKind] = useState<Customer["kind"]>("customer");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return data.customers
      .filter((customer) => customer.kind === kind)
      .filter((customer) => !needle || `${customer.name} ${customer.email} ${customer.address.city}`.toLowerCase().includes(needle))
      .map((customer) => {
        const open = data.invoices
          .filter((invoice) => invoice.customerId === customer.id && invoice.kind === "invoice" && invoice.status === "sent")
          .reduce((sum, invoice) => sum + totalsFor(invoice, data.company).gross, 0);
        const spent = data.expenses.filter((expense) => expense.supplierId === customer.id).reduce((sum, expense) => sum + expense.total, 0);
        return { customer, open, spent };
      })
      .sort((a, b) => a.customer.name.localeCompare(b.customer.name, "de"));
  }, [data, kind, query]);

  return (
    <Screen
      title={kind === "customer" ? "Kunden" : "Lieferanten"}
      subtitle={`${rows.length} Einträge`}
      right={<HeaderButton icon="person-add" label="Neu anlegen" onPress={() => nav.push({ name: "customer", kind })} />}
    >
      <Segmented
        options={[
          { value: "customer", label: "Kunden" },
          { value: "supplier", label: "Lieferanten" },
        ]}
        value={kind}
        onChange={setKind}
      />
      <SearchField value={query} onChangeText={setQuery} placeholder="Name, E-Mail oder Ort" />
      <Card>
        {rows.length ? (
          rows.map(({ customer, open, spent }) => (
            <ListRow
              key={customer.id}
              icon={kind === "customer" ? "person" : "storefront"}
              iconTone="dark"
              title={customer.name}
              subtitle={[customer.address.city, customer.email].filter(Boolean).join(" · ") || "Keine Kontaktdaten"}
              right={kind === "customer" ? (open ? formatMoney(open) : undefined) : spent ? formatMoney(spent) : undefined}
              rightSub={kind === "customer" && open ? <Badge label="offen" tone="warning" /> : undefined}
              onPress={() => nav.push({ name: "customer", id: customer.id })}
            />
          ))
        ) : (
          <Empty
            icon="people-outline"
            title={kind === "customer" ? "Noch keine Kunden" : "Noch keine Lieferanten"}
            text="Adressen und Steuerdaten werden automatisch in Rechnungen übernommen."
            action={<Button label="Jetzt anlegen" icon="add" onPress={() => nav.push({ name: "customer", kind })} />}
          />
        )}
      </Card>
    </Screen>
  );
}

function blankCustomer(kind: Customer["kind"]): Customer {
  return {
    id: createId(kind === "customer" ? "cus" : "sup"),
    kind,
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: { street: "", zip: "", city: "", country: "DE" },
    vatId: "",
    buyerReference: "",
    notes: "",
    createdAt: new Date().toISOString(),
  };
}

export function CustomerEditorScreen({ nav, id, kind = "customer" }: { nav: Nav; id?: string; kind?: Customer["kind"] }) {
  const store = useAccounting();
  const { data } = store;
  const existing = id ? data.customers.find((customer) => customer.id === id) : undefined;
  const [draft, setDraft] = useState<Customer>(() => existing ?? blankCustomer(kind));
  const set = (patch: Partial<Customer>) => setDraft((value) => ({ ...value, ...patch }));
  const setAddress = (patch: Partial<Customer["address"]>) => setDraft((value) => ({ ...value, address: { ...value.address, ...patch } }));

  const invoices = data.invoices
    .filter((invoice) => invoice.customerId === draft.id)
    .sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  const expenses = data.expenses.filter((expense) => expense.supplierId === draft.id);
  const open = invoices.filter((invoice) => invoice.kind === "invoice" && invoice.status === "sent");
  const revenue = invoices
    .filter((invoice) => invoice.kind === "invoice" && invoice.status === "paid")
    .reduce((sum, invoice) => sum + totalsFor(invoice, data.company).gross, 0);
  const isCustomer = draft.kind === "customer";

  const save = () => {
    if (!draft.name.trim()) return Alert.alert("Name fehlt", "Bitte einen Namen oder Firmennamen eingeben.");
    store.saveCustomer({ ...draft, name: draft.name.trim() });
    nav.back();
  };

  return (
    <Screen
      title={existing ? draft.name || "Kontakt" : isCustomer ? "Neuer Kunde" : "Neuer Lieferant"}
      subtitle={isCustomer ? "Kundenprofil" : "Lieferantenprofil"}
      onBack={nav.back}
    >
      {existing && isCustomer ? (
        <Card dark>
          <KeyValueRow label="Umsatz bezahlt" value={formatMoney(revenue)} />
          <KeyValueRow label="Offene Beträge" value={formatMoney(open.reduce((sum, invoice) => sum + totalsFor(invoice, data.company).gross, 0))} />
          <View style={styles.row}>
            <Button label="Rechnung" icon="document-text" onPress={() => nav.push({ name: "newInvoice", kind: "invoice", customerId: draft.id })} style={styles.flex} />
            <Button label="Angebot" icon="pricetag" tone="gold" onPress={() => nav.push({ name: "newInvoice", kind: "offer", customerId: draft.id })} style={styles.flex} />
          </View>
        </Card>
      ) : null}

      <Card>
        <SectionTitle>Stammdaten</SectionTitle>
        <Field label="Name / Firma" value={draft.name} onChangeText={(name) => set({ name })} />
        <Field label="Ansprechpartner" value={draft.contactPerson} onChangeText={(contactPerson) => set({ contactPerson })} />
        <View style={styles.row}>
          <Field label="E-Mail" value={draft.email} onChangeText={(email) => set({ email })} keyboardType="email-address" autoCapitalize="none" style={styles.flex} />
          <Field label="Telefon" value={draft.phone} onChangeText={(phone) => set({ phone })} keyboardType="phone-pad" style={styles.flex} />
        </View>
        {existing && (draft.email || draft.phone) ? (
          <View style={styles.row}>
            {draft.email ? <Button label="E-Mail" icon="mail" tone="secondary" onPress={() => Linking.openURL(`mailto:${draft.email}`)} style={styles.flex} /> : null}
            {draft.phone ? <Button label="Anrufen" icon="call" tone="secondary" onPress={() => Linking.openURL(`tel:${draft.phone.replace(/\s/g, "")}`)} style={styles.flex} /> : null}
          </View>
        ) : null}
      </Card>

      <Card>
        <SectionTitle>Adresse</SectionTitle>
        <Field label="Straße und Hausnummer" value={draft.address.street} onChangeText={(street) => setAddress({ street })} />
        <View style={styles.row}>
          <Field label="PLZ" value={draft.address.zip} onChangeText={(zip) => setAddress({ zip })} keyboardType="number-pad" style={{ width: 96 }} />
          <Field label="Ort" value={draft.address.city} onChangeText={(city) => setAddress({ city })} style={styles.flex} />
        </View>
        <Field label="Land (ISO)" value={draft.address.country} onChangeText={(country) => setAddress({ country: country.toUpperCase().slice(0, 2) })} autoCapitalize="characters" />
      </Card>

      <Card>
        <SectionTitle>Steuer & E-Rechnung</SectionTitle>
        <Field label="USt-IdNr." value={draft.vatId} onChangeText={(vatId) => set({ vatId: vatId.toUpperCase() })} autoCapitalize="characters" placeholder="DE123456789" />
        {isCustomer ? (
          <Field label="Leitweg-ID (öffentliche Auftraggeber)" value={draft.buyerReference} onChangeText={(buyerReference) => set({ buyerReference })} autoCapitalize="none" />
        ) : null}
        <Field label="Notizen, Verträge, Absprachen" value={draft.notes} onChangeText={(notes) => set({ notes })} multiline />
      </Card>

      <Button label="Speichern" icon="checkmark" onPress={save} />

      {existing && invoices.length ? (
        <Card>
          <SectionTitle>Rechnungen & Angebote</SectionTitle>
          {invoices.map((invoice) => {
            const status = statusOf(invoice);
            return (
              <ListRow
                key={invoice.id}
                icon={invoice.kind === "offer" ? "pricetag" : "document-text"}
                title={invoice.status === "draft" ? "Entwurf" : invoice.number}
                subtitle={formatDate(invoice.issueDate)}
                right={formatMoney(totalsFor(invoice, data.company).gross)}
                rightSub={<Badge label={status.label} tone={status.tone} />}
                onPress={() => nav.push({ name: "invoice", id: invoice.id })}
              />
            );
          })}
        </Card>
      ) : null}

      {existing && expenses.length ? (
        <Card>
          <SectionTitle>Belege</SectionTitle>
          {expenses.map((expense) => (
            <ListRow key={expense.id} icon="receipt" title={expense.vendor} subtitle={formatDate(expense.date)} right={formatMoney(expense.total)} onPress={() => nav.push({ name: "expense", id: expense.id })} />
          ))}
        </Card>
      ) : null}

      {existing ? (
        <Button
          label="Kontakt löschen"
          icon="trash"
          tone="danger"
          onPress={() => {
            if (invoices.some((invoice) => invoice.status !== "draft")) {
              return Alert.alert("Nicht möglich", "Für diesen Kontakt existieren ausgestellte Rechnungen. Diese müssen aufbewahrt werden.");
            }
            Alert.alert("Kontakt löschen?", draft.name, [
              { text: "Abbrechen", style: "cancel" },
              {
                text: "Löschen",
                style: "destructive",
                onPress: () => {
                  store.deleteCustomer(draft.id);
                  nav.back();
                },
              },
            ]);
          }}
        />
      ) : null}
    </Screen>
  );
}

function KeyValueRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.keyValue}>
      <Text style={{ color: colors.onDarkMuted, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: colors.onDark, fontSize: 16, fontWeight: "800" }}>{value}</Text>
    </View>
  );
}
