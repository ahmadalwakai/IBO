import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { BlobPreconditionFailedError, get, put } from "@vercel/blob";
import { usesBlobJsonStorage } from "./json-storage";

/**
 * Accounting data lives in the private Blob store (or under `.data/` locally,
 * which is gitignored). Every save bumps `revision`; a save based on an older
 * revision is rejected so two devices cannot silently overwrite each other.
 */
export type AccountingSnapshot = {
  revision: number;
  updatedAt: string | null;
  updatedBy: string | null;
  data: unknown;
};

const dataPath = "accounting/data.json";
const localRoot = path.join(process.cwd(), ".data");
export const maxDocumentBytes = 4 * 1024 * 1024;
export const documentNamePattern = /^doc_[a-z0-9]{6,40}\.(jpg|jpeg|png|heic|pdf)$/;

export class RevisionConflictError extends Error {
  constructor(readonly current: AccountingSnapshot) {
    super("Revision conflict");
  }
}

const empty: AccountingSnapshot = { revision: 0, updatedAt: null, updatedBy: null, data: null };

async function readStored(): Promise<{ snapshot: AccountingSnapshot; etag?: string }> {
  if (usesBlobJsonStorage()) {
    const blob = await get(dataPath, { access: "private", useCache: false }).catch(() => null);
    if (!blob || blob.statusCode !== 200) return { snapshot: empty };
    const text = await new Response(blob.stream).text();
    return { snapshot: JSON.parse(text) as AccountingSnapshot, etag: blob.blob.etag };
  }
  try {
    return { snapshot: JSON.parse(await readFile(path.join(localRoot, dataPath), "utf8")) as AccountingSnapshot };
  } catch {
    return { snapshot: empty };
  }
}

export async function readAccounting() {
  return (await readStored()).snapshot;
}

export async function writeAccounting(baseRevision: number, data: unknown, email: string) {
  const { snapshot, etag } = await readStored();
  if (snapshot.revision !== baseRevision) throw new RevisionConflictError(snapshot);

  const next: AccountingSnapshot = {
    revision: snapshot.revision + 1,
    updatedAt: new Date().toISOString(),
    updatedBy: email,
    data,
  };
  const text = JSON.stringify(next);

  if (usesBlobJsonStorage()) {
    try {
      await put(dataPath, text, {
        access: "private",
        allowOverwrite: true,
        contentType: "application/json",
        cacheControlMaxAge: 60,
        // Guards the read-compare-write above against a concurrent save.
        ...(etag ? { ifMatch: etag } : {}),
      });
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError) throw new RevisionConflictError((await readStored()).snapshot);
      throw error;
    }
    return next;
  }

  const file = path.join(localRoot, dataPath);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, text, "utf8");
  return next;
}

const documentPath = (name: string) => `accounting/documents/${name}`;

export async function saveAccountingDocument(name: string, body: ArrayBuffer, contentType: string) {
  if (usesBlobJsonStorage()) {
    await put(documentPath(name), Buffer.from(body), { access: "private", allowOverwrite: true, contentType });
    return;
  }
  const file = path.join(localRoot, documentPath(name));
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, Buffer.from(body));
}

export async function readAccountingDocument(name: string) {
  if (usesBlobJsonStorage()) {
    const blob = await get(documentPath(name), { access: "private" }).catch(() => null);
    if (!blob || blob.statusCode !== 200) return null;
    return { body: blob.stream, contentType: blob.blob.contentType, size: blob.blob.size };
  }
  try {
    const buffer = await readFile(path.join(localRoot, documentPath(name)));
    return { body: new Uint8Array(buffer), contentType: contentTypeFor(name), size: buffer.length };
  } catch {
    return null;
  }
}

export function contentTypeFor(name: string) {
  const extension = name.split(".").pop();
  if (extension === "pdf") return "application/pdf";
  if (extension === "png") return "image/png";
  if (extension === "heic") return "image/heic";
  return "image/jpeg";
}
