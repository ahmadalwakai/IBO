import { NextResponse } from "next/server";
import { createId, getQuotes, saveQuotes } from "@/lib/cms-store";
import type { QuoteLead } from "@/lib/cms-types";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<QuoteLead>;
  if (!body.name || !body.phone || !body.message) {
    return NextResponse.json({ error: "Name, phone and message are required" }, { status: 400 });
  }

  const quote: QuoteLead = {
    id: createId("quote"),
    name: body.name,
    phone: body.phone,
    email: body.email ?? "",
    message: body.message,
    status: "new",
    createdAt: new Date().toISOString(),
  };

  const { quotes } = await getQuotes();
  await saveQuotes([quote, ...quotes]);
  return NextResponse.json({ ok: true, quote });
}
