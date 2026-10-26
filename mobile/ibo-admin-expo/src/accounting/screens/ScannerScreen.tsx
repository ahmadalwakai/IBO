import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { isOcrAvailable, recognizeText } from "../../../modules/receipt-ocr";
import type { Nav } from "../navigation";
import { groupRows, parseReceipt } from "../receipt-parser";
import { Button, Card, colors, Empty, Icon, Screen, styles } from "../ui";

type Phase = "picking" | "reading" | "error";

async function pick(mode: "camera" | "library" | "pdf") {
  if (mode === "pdf") {
    const result = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"], copyToCacheDirectory: true });
    if (result.canceled || !result.assets[0]) return null;
    const asset = result.assets[0];
    return { uri: asset.uri, mimeType: asset.mimeType ?? (asset.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg") };
  }

  const permission =
    mode === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error(mode === "camera" ? "Bitte erlauben Sie den Kamerazugriff in den iPhone-Einstellungen." : "Bitte erlauben Sie den Fotozugriff in den iPhone-Einstellungen.");
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.6, allowsEditing: false, exif: false };
  const result = mode === "camera" ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets[0]) return null;
  return { uri: result.assets[0].uri, mimeType: result.assets[0].mimeType ?? "image/jpeg" };
}

export function ScannerScreen({ nav, mode }: { nav: Nav; mode: "camera" | "library" | "pdf" }) {
  const [phase, setPhase] = useState<Phase>("picking");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const started = useRef(false);

  const run = async (source: "camera" | "library" | "pdf") => {
    setError("");
    setPhase("picking");
    try {
      const file = await pick(source);
      if (!file) {
        nav.back();
        return;
      }
      if (file.mimeType.startsWith("image/")) setPreview(file.uri);
      setPhase("reading");

      if (!isOcrAvailable()) {
        nav.replace({
          name: "expense",
          source: { ...file, text: "" },
          draft: { ...parseReceipt([]), warnings: ["Automatische Texterkennung ist nur in der installierten App verfügbar. Bitte Daten manuell erfassen."] },
        });
        return;
      }

      const boxes = await recognizeText(file.uri);
      const rows = groupRows(boxes);
      const draft = parseReceipt(rows);
      nav.replace({ name: "expense", draft, source: { ...file, text: rows.join("\n") } });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
      setPhase("error");
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void run(mode);
    // Runs once for the mode the scanner was opened with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen title="Beleg scannen" subtitle="Texterkennung direkt auf dem iPhone" onBack={nav.back}>
      {phase === "error" ? (
        <Card>
          <Empty icon="alert-circle-outline" title="Beleg konnte nicht gelesen werden" text={error} />
          <View style={styles.row}>
            <Button label="Kamera" icon="camera" onPress={() => run("camera")} style={styles.flex} />
            <Button label="Fotos" icon="images" tone="secondary" onPress={() => run("library")} style={styles.flex} />
          </View>
          <Button label="PDF auswählen" icon="document-attach" tone="ghost" onPress={() => run("pdf")} />
        </Card>
      ) : (
        <Card dark style={local.reading}>
          {preview ? <Image source={{ uri: preview }} style={local.preview} resizeMode="contain" /> : <Icon name="scan" size={56} color={colors.emerald} />}
          <ActivityIndicator color={colors.emerald} size="large" />
          <Text style={local.title}>{phase === "picking" ? "Beleg auswählen…" : "Beleg wird analysiert…"}</Text>
          <Text style={local.text}>
            Händler, Adresse, Datum, Belegnummer, alle Positionen mit Menge, Einzelpreis, Rabatt und Steuersatz sowie Gesamtbetrag und Zahlungsart
            werden erkannt. Sie prüfen alles vor dem Speichern.
          </Text>
        </Card>
      )}
    </Screen>
  );
}

const local = StyleSheet.create({
  reading: { alignItems: "center", gap: 14, paddingVertical: 28 },
  preview: { width: "100%", height: 280, borderRadius: 16, backgroundColor: colors.night },
  title: { color: colors.onDark, fontSize: 18, fontWeight: "800" },
  text: { color: colors.onDarkMuted, textAlign: "center", lineHeight: 20 },
});
