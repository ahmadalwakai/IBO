import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";
import type { Nav, Route, TabKey } from "./navigation";
import { CustomerEditorScreen, CustomersScreen } from "./screens/CustomersScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { DocumentScreen, DocumentsScreen } from "./screens/DocumentsScreen";
import { ExpenseEditorScreen } from "./screens/ExpenseEditorScreen";
import { ExpensesScreen } from "./screens/ExpensesScreen";
import { InvoiceEditorScreen } from "./screens/InvoiceEditorScreen";
import { InvoicesScreen } from "./screens/InvoicesScreen";
import { MoreScreen, SettingsScreen, SoonScreen } from "./screens/MoreScreen";
import { ScannerScreen } from "./screens/ScannerScreen";
import type { CompanySeed } from "./storage";
import { AccountingProvider } from "./store";
import type { ServerConfig } from "./sync";
import { colors, Icon, type IconName } from "./ui";

const tabs: { key: TabKey; label: string; icon: IconName; activeIcon: IconName }[] = [
  { key: "dashboard", label: "Übersicht", icon: "home-outline", activeIcon: "home" },
  { key: "invoices", label: "Rechnungen", icon: "document-text-outline", activeIcon: "document-text" },
  { key: "customers", label: "Kunden", icon: "people-outline", activeIcon: "people" },
  { key: "more", label: "Mehr", icon: "grid-outline", activeIcon: "grid" },
];

const createActions: { label: string; hint: string; icon: IconName; route: Route }[] = [
  { label: "Rechnung erstellen", hint: "Mit automatischer Berechnung", icon: "document-text", route: { name: "newInvoice", kind: "invoice" } },
  { label: "Beleg scannen", hint: "Kamera · alle Positionen erkennen", icon: "scan", route: { name: "scanner", mode: "camera" } },
  { label: "Ausgabe erfassen", hint: "Ohne Beleg oder manuell", icon: "wallet", route: { name: "expense" } },
  { label: "Kunde anlegen", hint: "Adresse und Steuerdaten", icon: "person-add", route: { name: "customer", kind: "customer" } },
  { label: "Angebot erstellen", hint: "Später in Rechnung umwandeln", icon: "pricetag", route: { name: "newInvoice", kind: "offer" } },
];

export function AccountingApp({
  onClose,
  seed,
  server,
  onUnauthorized,
}: {
  onClose: () => void;
  seed?: CompanySeed;
  server?: ServerConfig;
  onUnauthorized?: () => void;
}) {
  return (
    <AccountingProvider
      seed={seed}
      server={server}
      onUnauthorized={onUnauthorized}
      loading={
        <View style={[local.root, local.center]}>
          <ActivityIndicator color={colors.emerald} size="large" />
        </View>
      }
    >
      <AccountingShell onClose={onClose} />
    </AccountingProvider>
  );
}

function AccountingShell({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [stack, setStack] = useState<{ key: number; route: Route }[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  const nav = useMemo<Nav>(() => {
    let counter = Date.now();
    return {
      push: (route) => setStack((current) => [...current, { key: counter++, route }]),
      replace: (route) => setStack((current) => [...current.slice(0, -1), { key: counter++, route }]),
      back: () => setStack((current) => current.slice(0, -1)),
      setTab: (next) => {
        setStack([]);
        setTab(next);
      },
    };
  }, []);

  const top = stack[stack.length - 1];

  const renderRoute = useCallback(
    (route: Route) => {
      switch (route.name) {
        case "invoice":
          return <InvoiceEditorScreen nav={nav} id={route.id} />;
        case "newInvoice":
          return <InvoiceEditorScreen nav={nav} kind={route.kind} customerId={route.customerId} />;
        case "customer":
          return <CustomerEditorScreen nav={nav} id={route.id} kind={route.kind} />;
        case "scanner":
          return <ScannerScreen nav={nav} mode={route.mode} />;
        case "expense":
          return <ExpenseEditorScreen nav={nav} id={route.id} draft={route.draft} source={route.source} />;
        case "expenses":
          return <ExpensesScreen nav={nav} />;
        case "documents":
          return <DocumentsScreen nav={nav} />;
        case "document":
          return <DocumentScreen nav={nav} id={route.id} />;
        case "settings":
          return <SettingsScreen nav={nav} />;
        case "soon":
          return <SoonScreen nav={nav} keyName={route.key} />;
      }
    },
    [nav],
  );

  return (
    <SafeAreaView style={local.root}>
      <StatusBar barStyle="light-content" />
      <View style={local.content}>
        <View style={[local.content, top && local.hidden]}>
          {tab === "dashboard" && <DashboardScreen nav={nav} onClose={onClose} />}
          {tab === "invoices" && <InvoicesScreen nav={nav} />}
          {tab === "customers" && <CustomersScreen nav={nav} />}
          {tab === "more" && <MoreScreen nav={nav} />}
        </View>
        {/* Lower screens stay mounted so an unsaved draft survives a detour (e.g. creating a customer). */}
        {stack.map((entry) => (
          <View key={entry.key} style={[local.content, entry !== top && local.hidden]}>
            {renderRoute(entry.route)}
          </View>
        ))}
      </View>

      {!top ? (
        <View style={local.tabBar}>
          {tabs.slice(0, 2).map((item) => (
            <TabButton key={item.key} item={item} active={tab === item.key} onPress={() => nav.setTab(item.key)} />
          ))}
          <Pressable accessibilityRole="button" accessibilityLabel="Neu erstellen" onPress={() => setSheetOpen(true)} style={local.fab}>
            <Icon name="add" size={32} color={colors.night} />
          </Pressable>
          {tabs.slice(2).map((item) => (
            <TabButton key={item.key} item={item} active={tab === item.key} onPress={() => nav.setTab(item.key)} />
          ))}
        </View>
      ) : null}

      <Modal visible={sheetOpen} transparent animationType="fade" onRequestClose={() => setSheetOpen(false)}>
        <Pressable style={local.backdrop} onPress={() => setSheetOpen(false)}>
          <Pressable style={local.sheet} onPress={(event) => event.stopPropagation()}>
            <View style={local.grabber} />
            <Text style={local.sheetTitle}>Was möchten Sie erstellen?</Text>
            {createActions.map((action) => (
              <Pressable
                key={action.label}
                style={({ pressed }) => [local.sheetRow, pressed && { opacity: 0.7 }]}
                onPress={() => {
                  setSheetOpen(false);
                  nav.push(action.route);
                }}
              >
                <View style={local.sheetIcon}>
                  <Icon name={action.icon} color={colors.night} size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={local.sheetLabel}>{action.label}</Text>
                  <Text style={local.sheetHint}>{action.hint}</Text>
                </View>
                <Icon name="chevron-forward" color={colors.onDarkMuted} />
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function TabButton({ item, active, onPress }: { item: (typeof tabs)[number]; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={local.tab}>
      <Icon name={active ? item.activeIcon : item.icon} size={22} color={active ? colors.emerald : colors.onDarkMuted} />
      <Text style={[local.tabLabel, active && local.tabLabelActive]}>{item.label}</Text>
    </Pressable>
  );
}

const local = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.night },
  center: { alignItems: "center", justifyContent: "center" },
  content: { flex: 1, backgroundColor: colors.soft },
  hidden: { display: "none" },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.night,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 6,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  tab: { flex: 1, alignItems: "center", gap: 3, paddingVertical: 4 },
  tabLabel: { color: colors.onDarkMuted, fontSize: 11, fontWeight: "700" },
  tabLabelActive: { color: colors.emerald },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 22,
    backgroundColor: colors.emerald,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -30,
    marginHorizontal: 6,
    borderWidth: 4,
    borderColor: colors.night,
    shadowColor: colors.emerald,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  backdrop: { flex: 1, backgroundColor: "rgba(6,30,27,0.55)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.charcoal,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 18,
    paddingBottom: 40,
    gap: 6,
    borderTopWidth: 1,
    borderColor: "rgba(216,181,106,0.4)",
  },
  grabber: { alignSelf: "center", width: 44, height: 5, borderRadius: 3, backgroundColor: "rgba(248,250,249,0.25)", marginBottom: 8 },
  sheetTitle: { color: colors.gold, fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 },
  sheetRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 11 },
  sheetIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.emerald, alignItems: "center", justifyContent: "center" },
  sheetLabel: { color: colors.onDark, fontSize: 16, fontWeight: "700" },
  sheetHint: { color: colors.onDarkMuted, fontSize: 13, marginTop: 1 },
});
