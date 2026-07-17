import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { get, put } from "@vercel/blob";

type JsonValue = unknown;

const blobConfigured = Boolean(
  process.env.BLOB_READ_WRITE_TOKEN || (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN),
);

function blobPathFor(file: string) {
  return path.relative(process.cwd(), file).replace(/\\/g, "/");
}

async function readBlobText(file: string) {
  if (!blobConfigured) return null;

  const blob = await get(blobPathFor(file), {
    access: "private",
    useCache: false,
  });

  if (!blob || blob.statusCode !== 200 || !blob.stream) return null;
  return new Response(blob.stream).text();
}

export async function readJsonFile<T>(file: string): Promise<T> {
  const blobText = await readBlobText(file);
  if (blobText) return JSON.parse(blobText) as T;

  const raw = await readFile(file, "utf8");
  return JSON.parse(raw) as T;
}

export async function writeJsonFile(file: string, value: JsonValue) {
  const text = `${JSON.stringify(value, null, 2)}\n`;

  if (blobConfigured) {
    await put(blobPathFor(file), text, {
      access: "private",
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    });
    return;
  }

  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, text, "utf8");
}

export function usesBlobJsonStorage() {
  return blobConfigured;
}
