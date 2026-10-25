import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { formatDate, formatMoney, isOverdue, statusOf, totalsFor } from "../calc";
import type { Nav } from "../navigation";
import { useAccounting } from "../store";
import { Badge, Button, Card, Chips, Empty, HeaderButton, ListRow, Screen, SearchField, styles } from "../ui";

type Filter = "all" | "draft" | "open" | "overdue" | "paid" | "offers";

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "Alle" },
  { value: "open", label: "Offen" },
  { value: "overdue", label: "Überfällig" },
  { value: "draft", label: "Entwürfe" },
  { value: "paid", label: "Bezahlt" },
  { value: "offers", label: "Angebote" },
];

export function InvoicesScreen({ nav }: { nav: Nav }) {
  const { data } = useAccounting();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const customerName = (id: string) => data.customers.find((customer) => customer.id === id)?.name ?? "";
    return data.invoices
      .filter((invoice) => {
        switch (filter) {
          case "all":
            return invoice.kind === "invoice";
          case "draft":
            return invoice.kind === "invoice" && invoice.status === "draft";
          case "open":
            return invoice.kind === "invoice" && invoice.status === "sent";
          case "overdue":
            return isOverdue(invoice);
          case "paid":
            return invoice.kind === "invoice" && invoice.status === "paid";
          case "offers":
            return invoice.kind === "offer";
        }
      })
      .filter((invoice) => !needle || `${invoice.number} ${customerName(invoice.customerId)}`.toLowerCase().includes(needle))
      .sort((a, b) => b.issueDate.localeCompare(a.issueDate) || b.createdAt.localeCompare(a.createdAt));
  }, [data.customers, data.invoices, filter, query]);

  const sum = list.reduce((total, invoice) => total + totalsFor(invoice, data.company).gross, 0);

  return (
    <Screen
      title="Rechnungen"
      subtitle={`${list.length} Dokumente · ${formatMoney(sum)}`}
      right={<HeaderButton icon="add-circle" label="Neue Rechnung" onPress={() => nav.push({ name: "newInvoice", kind: filter === "offers" ? "offer" : "invoice" })} />}
    >
      <SearchField value={query} onChangeText={setQuery} placeholder="Nummer oder Kunde suchen" />
      <Chips options={filters} value={filter} onChange={setFilter} />
      <Card>
        {list.length ? (
          list.map((invoice) => {
            const status = statusOf(invoice);
            const customer = data.customers.find((item) => item.id === invoice.customerId);
            return (
              <ListRow
                key={invoice.id}
                icon={invoice.kind === "offer" ? "pricetag" : invoice.correctionOf ? "git-compare" : "document-text"}
                iconTone={status.tone === "danger" ? "danger" : "mint"}
                title={customer?.name ?? "Ohne Kunde"}
                subtitle={`${invoice.status === "draft" ? "Entwurf" : invoice.number} · ${formatDate(invoice.issueDate)}${
                  invoice.recurrence !== "none" ? " · Serie" : ""
                }`}
                right={formatMoney(totalsFor(invoice, data.company).gross)}
                rightSub={<Badge label={status.label} tone={status.tone} />}
                onPress={() => nav.push({ name: "invoice", id: invoice.id })}
              />
            );
          })
        ) : (
          <Empty
            icon="document-text-outline"
            title={filter === "offers" ? "Keine Angebote" : "Keine Rechnungen"}
            text="Erstellen Sie eine Rechnung in weniger als einer Minute. Beträge und Steuern werden automatisch berechnet."
            action={
              <View style={styles.row}>
                <Button
                  label={filter === "offers" ? "Angebot erstellen" : "Rechnung erstellen"}
                  icon="add"
                  onPress={() => nav.push({ name: "newInvoice", kind: filter === "offers" ? "offer" : "invoice" })}
                />
              </View>
            }
          />
        )}
      </Card>
    </Screen>
  );
}
