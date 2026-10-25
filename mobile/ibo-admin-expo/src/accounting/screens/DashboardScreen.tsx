import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { dashboard, formatDate, formatMoney } from "../calc";
import type { Nav } from "../navigation";
import { useAccounting } from "../store";
import { Card, colors, Empty, Icon, ListRow, Money, Screen, SectionTitle, type IconName } from "../ui";

export function DashboardScreen({ nav, onClose }: { nav: Nav; onClose: () => void }) {
  const { data } = useAccounting();
  const stats = useMemo(() => dashboard(data), [data]);

  return (
    <Screen
      title="Übersicht"
      subtitle={data.company.name || "Buchhaltung"}
      onBack={onClose}
      right={
        <Pressable accessibilityLabel="Firmendaten" onPress={() => nav.push({ name: "settings" })} hitSlop={10}>
          <Icon name="settings-outline" color={colors.emerald} size={22} />
        </Pressable>
      }
    >
      <Card dark style={local.hero}>
        <Text style={local.heroLabel}>Saldo (Zahlungseingänge − Ausgaben)</Text>
        <Text style={local.heroValue}>{formatMoney(stats.balance)}</Text>
        <View style={local.heroRow}>
          <HeroStat label={`Gewinn ${stats.year}`} value={formatMoney(stats.profit)} />
          <View style={local.heroDivider} />
          <HeroStat label="Offene Rechnungen" value={formatMoney(stats.open.amount)} />
        </View>
      </Card>

      <View style={local.quickRow}>
        <Quick icon="scan" label="Beleg scannen" onPress={() => nav.push({ name: "scanner", mode: "camera" })} />
        <Quick icon="document-text" label="Rechnung" onPress={() => nav.push({ name: "newInvoice", kind: "invoice" })} />
        <Quick icon="wallet" label="Ausgabe" onPress={() => nav.push({ name: "expense" })} />
      </View>

      <View style={local.grid}>
        <Kpi icon="trending-up" label={`Einnahmen ${stats.year}`} value={stats.revenueNet} hint="netto, bezahlt" />
        <Kpi icon="trending-down" label={`Ausgaben ${stats.year}`} value={stats.expensesNet} hint="netto" />
        <Kpi
          icon="receipt"
          label={data.company.smallBusiness ? "Umsatzsteuer" : `USt ${stats.period.label}`}
          value={stats.vat.due}
          hint={data.company.smallBusiness ? "§ 19 UStG" : `fällig ${formatDate(stats.period.deadline)}`}
          gold
        />
        <Kpi
          icon="alert-circle"
          label="Unbezahlt"
          value={stats.open.amount}
          hint={`${stats.open.count} offen · ${stats.open.overdue} überfällig`}
          onPress={() => nav.setTab("invoices")}
        />
      </View>

      {stats.alerts.length ? (
        <Card>
          <SectionTitle>Wichtige Hinweise</SectionTitle>
          {stats.alerts.map((alert) => (
            <ListRow
              key={alert.id}
              icon={alert.tone === "danger" ? "alert-circle" : alert.tone === "warning" ? "time" : "information-circle"}
              iconTone={alert.tone === "danger" ? "danger" : alert.tone === "warning" ? "gold" : "mint"}
              title={alert.text}
              onPress={
                alert.target
                  ? () => nav.push({ name: "invoice", id: alert.target as string })
                  : alert.id === "company"
                    ? () => nav.push({ name: "settings" })
                    : alert.id === "missing-receipts"
                      ? () => nav.push({ name: "expenses" })
                      : undefined
              }
            />
          ))}
        </Card>
      ) : null}

      {!data.company.smallBusiness ? (
        <Card>
          <SectionTitle>{`Umsatzsteuer ${stats.period.label}`}</SectionTitle>
          <ListRow icon="arrow-up" title="Umsatzsteuer aus Rechnungen" right={formatMoney(stats.vat.output)} />
          <ListRow icon="arrow-down" title="Vorsteuer aus Belegen" right={formatMoney(-stats.vat.input)} />
          <ListRow
            icon="calendar"
            iconTone="gold"
            title={stats.vat.due >= 0 ? "Voraussichtliche Zahllast" : "Voraussichtliche Erstattung"}
            subtitle={`UStVA bis ${formatDate(stats.period.deadline)}`}
            right={formatMoney(Math.abs(stats.vat.due))}
          />
        </Card>
      ) : null}

      <Card>
        <SectionTitle action={{ label: "Alle Ausgaben", onPress: () => nav.push({ name: "expenses" }) }}>Letzte Buchungen</SectionTitle>
        {stats.activity.length ? (
          stats.activity.map((item) => (
            <ListRow
              key={item.id}
              icon={item.type === "income" ? "arrow-down-circle" : "arrow-up-circle"}
              iconTone={item.type === "income" ? "dark" : "mint"}
              title={item.title}
              subtitle={`${item.subtitle} · ${formatDate(item.date)}`}
              right={<Money value={item.amount} signed />}
              onPress={() => nav.push(item.type === "income" ? { name: "invoice", id: item.id } : { name: "expense", id: item.id })}
            />
          ))
        ) : (
          <Empty icon="sparkles" title="Noch keine Buchungen" text="Scannen Sie Ihren ersten Beleg oder schreiben Sie eine Rechnung." />
        )}
      </Card>
    </Screen>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={local.heroStat}>
      <Text style={local.heroStatLabel}>{label}</Text>
      <Text style={local.heroStatValue}>{value}</Text>
    </View>
  );
}

function Quick({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [local.quick, pressed && { opacity: 0.75 }]}>
      <View style={local.quickIcon}>
        <Icon name={icon} color={colors.night} size={22} />
      </View>
      <Text style={local.quickLabel}>{label}</Text>
    </Pressable>
  );
}

function Kpi({
  icon,
  label,
  value,
  hint,
  gold,
  onPress,
}: {
  icon: IconName;
  label: string;
  value: number;
  hint: string;
  gold?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={local.kpi}>
      <Icon name={icon} size={18} color={gold ? colors.gold : "#00A57B"} />
      <Text style={local.kpiLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={local.kpiValue} numberOfLines={1} adjustsFontSizeToFit>
        {formatMoney(value)}
      </Text>
      <Text style={local.kpiHint} numberOfLines={1}>
        {hint}
      </Text>
    </Pressable>
  );
}

const local = StyleSheet.create({
  hero: { gap: 6, paddingVertical: 20 },
  heroLabel: { color: colors.onDarkMuted, fontSize: 13 },
  heroValue: { color: colors.onDark, fontSize: 34, fontWeight: "900" },
  heroRow: { flexDirection: "row", marginTop: 12, alignItems: "center" },
  heroDivider: { width: 1, alignSelf: "stretch", backgroundColor: "rgba(216,181,106,0.35)", marginHorizontal: 14 },
  heroStat: { flex: 1, gap: 2 },
  heroStatLabel: { color: colors.gold, fontSize: 12, fontWeight: "700" },
  heroStatValue: { color: colors.onDark, fontSize: 17, fontWeight: "800" },
  quickRow: { flexDirection: "row", gap: 10 },
  quick: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.emerald, alignItems: "center", justifyContent: "center" },
  quickLabel: { color: colors.text, fontWeight: "700", fontSize: 13 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpi: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: colors.mint,
    borderRadius: 18,
    padding: 14,
    gap: 4,
  },
  kpiLabel: { color: colors.muted, fontSize: 12, fontWeight: "700", marginTop: 4 },
  kpiValue: { color: colors.text, fontSize: 20, fontWeight: "900" },
  kpiHint: { color: colors.muted, fontSize: 11 },
});
