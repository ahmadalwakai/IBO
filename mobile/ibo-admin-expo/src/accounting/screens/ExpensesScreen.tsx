import React, { useMemo, useState } from "react";
import { expenseCategoryLabels, formatDate, formatMoney, round2 } from "../calc";
import type { Nav } from "../navigation";
import { useAccounting } from "../store";
import { Badge, Card, Empty, HeaderButton, ListRow, Screen, SearchField, SectionTitle } from "../ui";

const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

export function ExpensesScreen({ nav }: { nav: Nav }) {
  const { data } = useAccounting();
  const [query, setQuery] = useState("");

  const months = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const groups = new Map<string, typeof data.expenses>();
    for (const expense of [...data.expenses].sort((a, b) => b.date.localeCompare(a.date))) {
      const haystack = `${expense.vendor} ${expense.notes} ${expenseCategoryLabels[expense.category]} ${expense.items.map((item) => item.description).join(" ")}`;
      if (needle && !haystack.toLowerCase().includes(needle)) continue;
      const key = expense.date.slice(0, 7);
      groups.set(key, [...(groups.get(key) ?? []), expense]);
    }
    return [...groups.entries()];
  }, [data, query]);

  const total = round2(months.reduce((sum, [, list]) => sum + list.reduce((inner, expense) => inner + expense.total, 0), 0));

  return (
    <Screen
      title="Ausgaben"
      subtitle={`Gesamt ${formatMoney(total)}`}
      onBack={nav.back}
      right={<HeaderButton icon="scan" label="Beleg scannen" onPress={() => nav.push({ name: "scanner", mode: "camera" })} />}
    >
      <SearchField value={query} onChangeText={setQuery} placeholder="Händler, Artikel oder Kategorie" />
      {months.length ? (
        months.map(([month, list]) => {
          const [year, monthIndex] = month.split("-");
          return (
            <Card key={month}>
              <SectionTitle>{`${monthNames[Number(monthIndex) - 1]} ${year} · ${formatMoney(list.reduce((sum, expense) => sum + expense.total, 0))}`}</SectionTitle>
              {list.map((expense) => (
                <ListRow
                  key={expense.id}
                  icon="receipt"
                  iconTone={expense.documentId ? "dark" : "gold"}
                  title={expense.vendor || "Ausgabe"}
                  subtitle={`${expenseCategoryLabels[expense.category]} · ${formatDate(expense.date)}${expense.items.length ? ` · ${expense.items.length} Pos.` : ""}`}
                  right={formatMoney(expense.total)}
                  rightSub={expense.documentId ? undefined : <Badge label="ohne Beleg" tone="warning" />}
                  onPress={() => nav.push({ name: "expense", id: expense.id })}
                />
              ))}
            </Card>
          );
        })
      ) : (
        <Card>
          <Empty icon="wallet-outline" title="Keine Ausgaben" text="Fotografieren Sie einen Kassenbon. Alle Positionen werden automatisch erkannt." />
        </Card>
      )}
    </Screen>
  );
}
