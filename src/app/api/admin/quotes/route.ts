import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getQuotes, saveQuotes } from "@/lib/cms-store";

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(await getQuotes(), { headers: noStore });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const { id, status } = (await request.json()) as { id?: string; status?: "new" | "read" | "done" };
    const { quotes } = await getQuotes();
    const next = quotes.map((quote) => (quote.id === id && status ? { ...quote, status } : quote));
    await saveQuotes(next);
    return NextResponse.json({ ok: true, quotes: next }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
