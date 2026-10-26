import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { createId, todayISO } from "./calc";
import { hasContent, type SyncState } from "./sync";
import type { AccountingData, CompanyProfile, DocumentKind, StoredDocument } from "./types";

const rootDir = () => new Directory(Paths.document, "accounting");
const docsDir = () => new Directory(rootDir(), "documents");
const dataFile = () => new File(rootDir(), "data.json");

export type CompanySeed = {
  name?: string;
  legalName?: string;
  address?: string;
  phone?: string;
  email?: string;
  url?: string;
};

function ensureDirs() {
  const root = rootDir();
  if (!root.exists) root.create({ intermediates: true });
  const docs = docsDir();
  if (!docs.exists) docs.create({ intermediates: true });
}

/** Splits "Musterstraße 1, 12345 Musterstadt" into its parts. */
function splitAddress(value = "") {
  const match = value.match(/^(.*?),?\s*(\d{5})\s+(.+)$/);
  if (!match) return { street: value.trim(), zip: "", city: "", country: "DE" };
  return { street: match[1].trim().replace(/,$/, ""), zip: match[2], city: match[3].trim(), country: "DE" };
}

export function defaultCompany(seed: CompanySeed = {}): CompanyProfile {
  return {
    name: seed.legalName || seed.name || "",
    owner: "",
    address: splitAddress(seed.address),
    email: seed.email ?? "",
    phone: seed.phone ?? "",
    website: seed.url ?? "",
    taxNumber: "",
    vatId: "",
    iban: "",
    bic: "",
    bankName: "",
    smallBusiness: false,
    vatPeriod: "monthly",
    paymentTermDays: 14,
    invoicePrefix: "RE",
    offerPrefix: "AN",
  };
}

export function emptyData(seed?: CompanySeed): AccountingData {
  return {
    version: 1,
    company: defaultCompany(seed),
    customers: [],
    invoices: [],
    expenses: [],
    documents: [],
    counters: {},
  };
}

/** Fills fields added in later app versions, for local files and server snapshots alike. */
export function normalizeData(parsed: Partial<AccountingData>, seed?: CompanySeed): AccountingData {
  const base = emptyData(seed);
  return {
    ...base,
    ...parsed,
    company: { ...base.company, ...parsed.company, address: { ...base.company.address, ...parsed.company?.address } },
  } as AccountingData;
}

export async function loadData(seed?: CompanySeed): Promise<AccountingData> {
  ensureDirs();
  const file = dataFile();
  if (!file.exists) return emptyData(seed);
  return normalizeData(JSON.parse(await file.text()) as Partial<AccountingData>, seed);
}

export function saveData(data: AccountingData) {
  ensureDirs();
  const file = dataFile();
  if (!file.exists) file.create();
  file.write(JSON.stringify(data));
}

const syncFile = () => new File(rootDir(), "sync.json");
const baseFile = () => new File(rootDir(), "sync-base.json");

/** A device that saved data before sync existed starts dirty, so its data is uploaded once. */
export async function loadSyncState(data: AccountingData): Promise<{ state: SyncState; base: AccountingData }> {
  ensureDirs();
  const stateFile = syncFile();
  const snapshotFile = baseFile();
  if (!stateFile.exists || !snapshotFile.exists) {
    return { state: { revision: 0, dirty: hasContent(data), lastSyncedAt: null }, base: { ...emptyData(), company: data.company } };
  }
  return {
    state: JSON.parse(await stateFile.text()) as SyncState,
    base: JSON.parse(await snapshotFile.text()) as AccountingData,
  };
}

export function saveSyncState(state: SyncState, base?: AccountingData) {
  ensureDirs();
  const stateFile = syncFile();
  if (!stateFile.exists) stateFile.create();
  stateFile.write(JSON.stringify(state));
  if (base) {
    const snapshotFile = baseFile();
    if (!snapshotFile.exists) snapshotFile.create();
    snapshotFile.write(JSON.stringify(base));
  }
}

export function documentFile(doc: Pick<StoredDocument, "fileName">) {
  return new File(docsDir(), doc.fileName);
}

function extensionFor(uri: string, mimeType: string) {
  const fromUri = uri.split("?")[0].match(/\.([a-z0-9]{2,4})$/i)?.[1];
  if (fromUri) return fromUri.toLowerCase();
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/heic") return "heic";
  return "jpg";
}

/** Copies a picked or scanned file into the app's permanent archive. */
export function importDocument(input: {
  uri: string;
  mimeType: string;
  kind: DocumentKind;
  title: string;
  text?: string;
}): StoredDocument {
  ensureDirs();
  const id = createId("doc");
  const fileName = `${id}.${extensionFor(input.uri, input.mimeType)}`;
  const source = new File(input.uri);
  const target = new File(docsDir(), fileName);
  source.copySync(target);
  const info = target.info({ md5: true });
  const now = new Date().toISOString();
  return {
    id,
    kind: input.kind,
    title: input.title,
    fileName,
    mimeType: input.mimeType,
    size: info.size ?? 0,
    text: input.text ?? "",
    fingerprint: info.md5 ?? `${info.size ?? 0}`,
    history: [{ at: now, text: "Archiviert" }],
    createdAt: now,
  };
}

export function removeDocumentFile(doc: StoredDocument) {
  const file = documentFile(doc);
  if (file.exists) file.delete();
}

export async function shareBackup(data: AccountingData) {
  const file = new File(Paths.cache, `IBO-Buchhaltung-Backup-${todayISO()}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(data, null, 2));
  await Sharing.shareAsync(file.uri, { mimeType: "application/json", dialogTitle: "Datensicherung teilen", UTI: "public.json" });
}

export async function shareFile(uri: string, mimeType: string, dialogTitle: string) {
  if (!(await Sharing.isAvailableAsync())) throw new Error("Teilen ist auf diesem Gerät nicht verfügbar.");
  await Sharing.shareAsync(uri, { mimeType, dialogTitle });
}
