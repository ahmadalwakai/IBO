import * as DocumentPicker from "expo-document-picker";
import React, { useMemo, useState } from "react";
import { Alert, Image, StyleSheet, Text } from "react-native";
import { isOcrAvailable, recognizeText } from "../../../modules/receipt-ocr";
import { formatDate, formatMoney } from "../calc";
import type { Nav } from "../navigation";
import { groupRows } from "../receipt-parser";
import { documentFile, importDocument, shareFile } from "../storage";
import { useAccounting } from "../store";
import type { DocumentKind, StoredDocument } from "../types";
import { Badge, Button, Card, Chips, colors, Empty, Field, HeaderButton, ListRow, Screen, SearchField, SectionTitle, styles, type IconName } from "../ui";

const kindLabels: Record<DocumentKind, string> = {
  receipt: "Beleg",
  invoice: "Rechnung",
  contract: "Vertrag",
  other: "Sonstiges",
};

const kindIcons: Record<DocumentKind, IconName> = {
  receipt: "receipt",
  invoice: "document-text",
  contract: "briefcase",
  other: "folder",
};

function formatSize(bytes: number) {
  if (bytes > 1_000_000) return `${(bytes / 1_000_000).toFixed(1).replace(".", ",")} MB`;
  return `${Math.max(1, Math.round(bytes / 1000))} KB`;
}

export function DocumentsScreen({ nav }: { nav: Nav }) {
  const { data, addDocument } = useAccounting();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<DocumentKind | "all">("all");
  const [busy, setBusy] = useState(false);

  const duplicates = useMemo(() => {
    const counts = new Map<string, number>();
    for (const doc of data.documents) counts.set(doc.fingerprint, (counts.get(doc.fingerprint) ?? 0) + 1);
    return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([fingerprint]) => fingerprint));
  }, [data.documents]);

  const list = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return data.documents
      .filter((doc) => kind === "all" || doc.kind === kind)
      .filter((doc) => {
        const haystack = `${doc.title} ${doc.text} ${kindLabels[doc.kind]}`.toLowerCase();
        return terms.every((term) => haystack.includes(term));
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [data.documents, kind, query]);

  const upload = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"], copyToCacheDirectory: true });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? (asset.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg");
    setBusy(true);
    try {
      const text = isOcrAvailable() ? groupRows(await recognizeText(asset.uri)).join("\n") : "";
      const doc = importDocument({ uri: asset.uri, mimeType, kind: /vertrag|contract/i.test(asset.name) ? "contract" : "other", title: asset.name.replace(/\.[^.]+$/, ""), text });
      const twin = data.documents.find((item) => item.fingerprint === doc.fingerprint);
      addDocument(doc);
      if (twin) Alert.alert("Doppeltes Dokument", `Diese Datei ist bereits als „${twin.title}“ archiviert.`);
      nav.push({ name: "document", id: doc.id });
    } catch (error) {
      Alert.alert("Import fehlgeschlagen", error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      title="Dokumente"
      subtitle={`${data.documents.length} archiviert · Volltextsuche`}
      onBack={nav.back}
      right={<HeaderButton icon="cloud-upload" label="Dokument hochladen" onPress={upload} />}
    >
      <SearchField value={query} onChangeText={setQuery} placeholder="Suche im Inhalt, z. B. „Farbe 19 %“" />
      <Chips
        options={[{ value: "all" as const, label: "Alle" }, ...(Object.keys(kindLabels) as DocumentKind[]).map((value) => ({ value, label: kindLabels[value] }))]}
        value={kind}
        onChange={setKind}
      />
      <Card>
        {list.length ? (
          list.map((doc) => (
            <ListRow
              key={doc.id}
              icon={kindIcons[doc.kind]}
              iconTone={duplicates.has(doc.fingerprint) ? "gold" : "dark"}
              title={doc.title}
              subtitle={`${kindLabels[doc.kind]} · ${formatDate(doc.createdAt.slice(0, 10))} · ${formatSize(doc.size)}`}
              rightSub={duplicates.has(doc.fingerprint) ? <Badge label="Duplikat" tone="gold" /> : undefined}
              onPress={() => nav.push({ name: "document", id: doc.id })}
            />
          ))
        ) : (
          <Empty
            icon="folder-open-outline"
            title={query ? "Nichts gefunden" : "Archiv ist leer"}
            text={query ? "Die Suche durchsucht Titel und den erkannten Text aller Dokumente." : "Belege landen nach dem Scannen automatisch hier. Verträge und PDFs können Sie hochladen."}
          />
        )}
      </Card>
      <Button label={busy ? "Wird importiert…" : "Dokument hochladen"} icon="cloud-upload" tone="secondary" onPress={upload} disabled={busy} />
    </Screen>
  );
}

export function DocumentScreen({ nav, id }: { nav: Nav; id: string }) {
  const store = useAccounting();
  const doc = store.data.documents.find((item) => item.id === id);
  const [title, setTitle] = useState(doc?.title ?? "");
  if (!doc) {
    return (
      <Screen title="Dokument" onBack={nav.back}>
        <Empty icon="alert-circle" title="Nicht gefunden" text="Dieses Dokument wurde gelöscht." />
      </Screen>
    );
  }
  const file = documentFile(doc);
  const expense = doc.expenseId ? store.data.expenses.find((item) => item.id === doc.expenseId) : undefined;
  const twins = store.data.documents.filter((item) => item.id !== doc.id && item.fingerprint === doc.fingerprint);
  const update = (patch: Partial<StoredDocument>, note: string) =>
    store.saveDocument({ ...doc, ...patch, history: [...doc.history, { at: new Date().toISOString(), text: note }] });

  return (
    <Screen title={doc.title} subtitle={`${kindLabels[doc.kind]} · ${formatSize(doc.size)}`} onBack={nav.back}>
      {doc.mimeType.startsWith("image/") ? <Image source={{ uri: file.uri }} style={local.image} resizeMode="contain" /> : null}
      <Button label={doc.mimeType === "application/pdf" ? "PDF öffnen / teilen" : "Original teilen"} icon="share-outline" onPress={() => shareFile(file.uri, doc.mimeType, doc.title).catch((error: unknown) => Alert.alert("Fehler", String(error)))} />

      {twins.length ? (
        <Card style={{ backgroundColor: "#F6EEDC" }}>
          <Text style={{ color: "#6B4A12" }}>{`Identische Datei auch archiviert als: ${twins.map((twin) => `„${twin.title}“`).join(", ")}`}</Text>
        </Card>
      ) : null}

      <Card>
        <SectionTitle>Angaben</SectionTitle>
        <Field label="Titel" value={title} onChangeText={setTitle} />
        {title !== doc.title ? <Button label="Titel speichern" tone="secondary" onPress={() => update({ title }, `Titel geändert in „${title}“`)} /> : null}
        <Text style={styles.label}>Art</Text>
        <Chips
          options={(Object.keys(kindLabels) as DocumentKind[]).map((value) => ({ value, label: kindLabels[value] }))}
          value={doc.kind}
          onChange={(kind) => update({ kind }, `Als ${kindLabels[kind]} eingeordnet`)}
        />
        {expense ? (
          <ListRow icon="wallet" title={`Ausgabe: ${expense.vendor}`} subtitle={formatDate(expense.date)} right={formatMoney(expense.total)} onPress={() => nav.push({ name: "expense", id: expense.id })} />
        ) : null}
      </Card>

      {doc.text ? (
        <Card>
          <SectionTitle>Erkannter Text</SectionTitle>
          <Text style={local.text} selectable>
            {doc.text}
          </Text>
        </Card>
      ) : null}

      <Card>
        <SectionTitle>Änderungsprotokoll</SectionTitle>
        {[...doc.history].reverse().map((entry, index) => (
          <ListRow key={`${entry.at}-${index}`} icon="time-outline" title={entry.text} subtitle={new Date(entry.at).toLocaleString("de-DE")} />
        ))}
      </Card>

      <Button
        label="Dokument löschen"
        icon="trash"
        tone="danger"
        onPress={() =>
          Alert.alert(
            "Dokument löschen?",
            expense ? "Achtung: Belege sind steuerlich aufbewahrungspflichtig (in der Regel 8 bis 10 Jahre)." : "Die Datei wird vom iPhone entfernt.",
            [
              { text: "Abbrechen", style: "cancel" },
              {
                text: "Löschen",
                style: "destructive",
                onPress: () => {
                  store.deleteDocument(doc.id);
                  nav.back();
                },
              },
            ],
          )
        }
      />
    </Screen>
  );
}

const local = StyleSheet.create({
  image: { width: "100%", height: 420, borderRadius: 20, backgroundColor: colors.night },
  text: { color: colors.muted, fontFamily: "Menlo", fontSize: 12, lineHeight: 17 },
});
