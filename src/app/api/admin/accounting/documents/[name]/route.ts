import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  contentTypeFor,
  documentNamePattern,
  maxDocumentBytes,
  readAccountingDocument,
  saveAccountingDocument,
} from "@/lib/accounting-store";

type Context = { params: Promise<{ name: string }> };

async function authorize(context: Context) {
  await requireAdmin();
  const { name } = await context.params;
  if (!documentNamePattern.test(name)) throw new Error("Invalid document name");
  return name;
}

export async function GET(_request: Request, context: Context) {
  let name: string;
  try {
    name = await authorize(context);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: message === "Invalid document name" ? 400 : 401 });
  }

  const document = await readAccountingDocument(name);
  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new Response(document.body, {
    headers: {
      "Content-Type": document.contentType,
      "Content-Length": String(document.size),
      "Cache-Control": "private, no-store",
    },
  });
}

export async function PUT(request: Request, context: Context) {
  let name: string;
  try {
    name = await authorize(context);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: message === "Invalid document name" ? 400 : 401 });
  }

  const body = await request.arrayBuffer();
  if (!body.byteLength) return NextResponse.json({ error: "Empty document" }, { status: 400 });
  if (body.byteLength > maxDocumentBytes) return NextResponse.json({ error: "Document too large" }, { status: 413 });

  await saveAccountingDocument(name, body, contentTypeFor(name));
  return NextResponse.json({ ok: true });
}
