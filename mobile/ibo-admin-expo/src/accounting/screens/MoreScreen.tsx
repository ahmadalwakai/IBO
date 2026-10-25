import React, { useState } from "react";
import { Alert, Pressable, Switch, Text, View } from "react-native";
import { formatMoney } from "../calc";
import type { Nav, SoonKey } from "../navigation";
import { shareBackup } from "../storage";
import { useAccounting } from "../store";
import type { CompanyProfile } from "../types";
import { AmountField, Badge, Button, Card, colors, Field, Icon, ListRow, Screen, SectionTitle, Segmented, styles, type IconName } from "../ui";

const upcoming: { key: SoonKey; icon: IconName; title: string; phase: 2 | 3; text: string; features: string[] }[] = [
  {
    key: "bookkeeping",
    icon: "calculator",
    title: "Buchhaltung",
    phase: 2,
    text: "Belege und Rechnungen werden zu Buchungsvorschlägen, die Sie nur noch bestätigen.",
    features: ["Kontierung nach SKR03/SKR04", "Buchungssätze und Journal", "Gewinn- und Verlustrechnung", "Anlagen und Abschreibung (AfA)", "Abstimmungen"],
  },
  {
    key: "banking",
    icon: "card",
    title: "Banking",
    phase: 2,
    text: "Deutsche Bankkonten verbinden und Zahlungen automatisch zuordnen.",
    features: ["Kontoanbindung über PSD2/FinTS", "Umsätze importieren", "Zahlungen mit Rechnungen und Belegen abgleichen", "Überweisungen", "Verspätete Zahlungen erkennen"],
  },
  {
    key: "taxes",
    icon: "shield-checkmark",
    title: "Steuern",
    phase: 2,
    text: "Umsatzsteuer-Voranmeldung und EÜR direkt aus Ihren Daten.",
    features: ["UStVA vorbereiten", "Übermittlung via ELSTER (ERiC)", "EÜR (Anlage EÜR)", "Jahresberichte", "Fristen-Erinnerungen"],
  },
  {
    key: "reports",
    icon: "bar-chart",
    title: "Berichte",
    phase: 2,
    text: "Umsatz, Kosten, Steuern und Liquidität auf einen Blick, mit Export.",
    features: ["Umsatz- und Kostenberichte", "Cashflow", "Kunden- und Produktanalyse", "PDF- und Excel-Export", "DATEV-Export"],
  },
  {
    key: "stock",
    icon: "cube",
    title: "Waren & Lager",
    phase: 3,
    text: "Produkte, Preise und Bestände, verknüpft mit Ihren Rechnungen.",
    features: ["Produkte und Dienstleistungen", "Einkaufs- und Verkaufspreise", "Bestandswarnungen", "Bestellungen"],
  },
  {
    key: "payroll",
    icon: "people",
    title: "Lohn & Gehalt",
    phase: 3,
    text: "Mitarbeiter, Arbeitszeiten und Lohnabrechnungen.",
    features: ["Personalakten", "Arbeitszeiten und Urlaub", "Lohnabrechnungen", "Sozialversicherung und Abzüge"],
  },
  {
    key: "assistant",
    icon: "sparkles",
    title: "KI-Assistent",
    phase: 3,
    text: "Fragen zu Ihren Finanzen in normaler Sprache stellen.",
    features: ["Fragen zu Zahlen beantworten", "Ausgaben analysieren", "Kategorien vorschlagen", "Fehler erkennen", "Liquidität vorhersagen"],
  },
  {
    key: "advisor",
    icon: "briefcase",
    title: "Steuerberater-Zugang",
    phase: 3,
    text: "Ihrem Steuerberater gezielt Zugriff geben.",
    features: ["Eingeschränkte Zugänge", "Belege teilen", "Korrekturen anfordern", "DATEV-kompatibler Export"],
  },
];

export function MoreScreen({ nav }: { nav: Nav }) {
  const { data } = useAccounting();
  const expensesTotal = data.expenses.reduce((sum, expense) => sum + expense.total, 0);

  return (
    <Screen title="Mehr" subtitle="Alle Bereiche">
      <Card>
        <SectionTitle>Verfügbar</SectionTitle>
        <ListRow icon="wallet" iconTone="dark" title="Ausgaben" subtitle={`${data.expenses.length} Belege · ${formatMoney(expensesTotal)}`} onPress={() => nav.push({ name: "expenses" })} right={<Chevron />} />
        <ListRow icon="scan" iconTone="dark" title="Beleg aus Fotos" subtitle="Foto aus der Mediathek auslesen" onPress={() => nav.push({ name: "scanner", mode: "library" })} right={<Chevron />} />
        <ListRow icon="document-attach" iconTone="dark" title="Beleg aus PDF" subtitle="PDF-Rechnung eines Lieferanten auslesen" onPress={() => nav.push({ name: "scanner", mode: "pdf" })} right={<Chevron />} />
        <ListRow icon="folder-open" iconTone="dark" title="Dokumente" subtitle={`${data.documents.length} im Archiv`} onPress={() => nav.push({ name: "documents" })} right={<Chevron />} />
        <ListRow icon="business" iconTone="dark" title="Firmendaten & Steuern" subtitle="Für Rechnungen und UStVA" onPress={() => nav.push({ name: "settings" })} right={<Chevron />} />
        <ListRow
          icon="cloud-download"
          iconTone="gold"
          title="Datensicherung exportieren"
          subtitle="Alle Daten als Datei sichern"
          onPress={() => shareBackup(data).catch((error: unknown) => Alert.alert("Fehler", String(error)))}
          right={<Chevron />}
        />
      </Card>

      <Card>
        <SectionTitle>Demnächst</SectionTitle>
        {upcoming.map((item) => (
          <ListRow
            key={item.key}
            icon={item.icon}
            title={item.title}
            subtitle={item.text}
            rightSub={<Badge label={`Phase ${item.phase}`} tone="gold" />}
            onPress={() => nav.push({ name: "soon", key: item.key })}
          />
        ))}
      </Card>
    </Screen>
  );
}

function Chevron() {
  return <Icon name="chevron-forward" color={colors.muted} />;
}

export function SoonScreen({ nav, keyName }: { nav: Nav; keyName: SoonKey }) {
  const item = upcoming.find((entry) => entry.key === keyName) ?? upcoming[0];
  return (
    <Screen title={item.title} subtitle={`In Vorbereitung · Phase ${item.phase}`} onBack={nav.back}>
      <Card dark>
        <Icon name={item.icon} size={36} color={colors.gold} />
        <Text style={{ color: colors.onDark, fontSize: 18, fontWeight: "800" }}>{item.text}</Text>
      </Card>
      <Card>
        <SectionTitle>Geplante Funktionen</SectionTitle>
        {item.features.map((feature) => (
          <ListRow key={feature} icon="checkmark-circle-outline" title={feature} />
        ))}
      </Card>
    </Screen>
  );
}

export function SettingsScreen({ nav }: { nav: Nav }) {
  const { data, update } = useAccounting();
  const [company, setCompany] = useState<CompanyProfile>(data.company);
  const set = (patch: Partial<CompanyProfile>) => setCompany((value) => ({ ...value, ...patch }));
  const setAddress = (patch: Partial<CompanyProfile["address"]>) => setCompany((value) => ({ ...value, address: { ...value.address, ...patch } }));

  const save = () => {
    update((draft) => ({ ...draft, company: { ...company, iban: company.iban.replace(/\s+/g, " ").trim().toUpperCase() } }));
    nav.back();
  };

  return (
    <Screen title="Firmendaten" subtitle="Erscheinen auf Rechnungen und in der XRechnung" onBack={nav.back}>
      <Card>
        <SectionTitle>Unternehmen</SectionTitle>
        <Field label="Firmenname" value={company.name} onChangeText={(name) => set({ name })} />
        <Field label="Inhaber / Geschäftsführer" value={company.owner} onChangeText={(owner) => set({ owner })} />
        <Field label="Straße und Hausnummer" value={company.address.street} onChangeText={(street) => setAddress({ street })} />
        <View style={styles.row}>
          <Field label="PLZ" value={company.address.zip} onChangeText={(zip) => setAddress({ zip })} keyboardType="number-pad" style={{ width: 96 }} />
          <Field label="Ort" value={company.address.city} onChangeText={(city) => setAddress({ city })} style={styles.flex} />
        </View>
        <View style={styles.row}>
          <Field label="Telefon" value={company.phone} onChangeText={(phone) => set({ phone })} keyboardType="phone-pad" style={styles.flex} />
          <Field label="E-Mail" value={company.email} onChangeText={(email) => set({ email })} keyboardType="email-address" autoCapitalize="none" style={styles.flex} />
        </View>
        <Field label="Website" value={company.website} onChangeText={(website) => set({ website })} autoCapitalize="none" />
      </Card>

      <Card>
        <SectionTitle>Steuern</SectionTitle>
        <View style={styles.row}>
          <Field label="Steuernummer" value={company.taxNumber} onChangeText={(taxNumber) => set({ taxNumber })} style={styles.flex} />
          <Field label="USt-IdNr." value={company.vatId} onChangeText={(vatId) => set({ vatId: vatId.toUpperCase() })} autoCapitalize="characters" style={styles.flex} />
        </View>
        <Pressable style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }} onPress={() => set({ smallBusiness: !company.smallBusiness })}>
          <View style={styles.flex}>
            <Text style={{ color: colors.text, fontWeight: "700" }}>Kleinunternehmer (§ 19 UStG)</Text>
            <Text style={styles.kvLabel}>Rechnungen ohne Umsatzsteuer, kein Vorsteuerabzug</Text>
          </View>
          <Switch value={company.smallBusiness} onValueChange={(smallBusiness) => set({ smallBusiness })} trackColor={{ true: colors.emerald }} />
        </Pressable>
        {!company.smallBusiness ? (
          <View style={{ gap: 6 }}>
            <Text style={styles.label}>Voranmeldungszeitraum</Text>
            <Segmented
              options={[
                { value: "monthly", label: "Monatlich" },
                { value: "quarterly", label: "Vierteljährlich" },
              ]}
              value={company.vatPeriod}
              onChange={(vatPeriod) => set({ vatPeriod })}
            />
          </View>
        ) : null}
      </Card>

      <Card>
        <SectionTitle>Bankverbindung & Rechnungen</SectionTitle>
        <Field label="IBAN" value={company.iban} onChangeText={(iban) => set({ iban })} autoCapitalize="characters" />
        <View style={styles.row}>
          <Field label="BIC" value={company.bic} onChangeText={(bic) => set({ bic: bic.toUpperCase() })} autoCapitalize="characters" style={styles.flex} />
          <Field label="Bank" value={company.bankName} onChangeText={(bankName) => set({ bankName })} style={styles.flex} />
        </View>
        <AmountField label="Zahlungsziel" suffix="Tage" value={company.paymentTermDays} onChange={(days) => set({ paymentTermDays: Math.max(0, Math.round(days)) })} />
        <View style={styles.row}>
          <Field label="Präfix Rechnungen" value={company.invoicePrefix} onChangeText={(invoicePrefix) => set({ invoicePrefix: invoicePrefix.toUpperCase() })} autoCapitalize="characters" style={styles.flex} />
          <Field label="Präfix Angebote" value={company.offerPrefix} onChangeText={(offerPrefix) => set({ offerPrefix: offerPrefix.toUpperCase() })} autoCapitalize="characters" style={styles.flex} />
        </View>
      </Card>

      <Button label="Speichern" icon="checkmark" onPress={save} />
    </Screen>
  );
}
