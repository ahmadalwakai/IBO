import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getCmsContent, saveCmsContent } from "@/lib/cms-store";
import type { CmsContent } from "@/lib/cms-types";

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(await getCmsContent(), { headers: noStore });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const content = (await request.json()) as CmsContent;
    const saved = await saveCmsContent(content);
    return NextResponse.json({ ok: true, content: saved }, { headers: noStore });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 400 });
  }
}
