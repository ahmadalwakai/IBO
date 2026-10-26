import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { readAccounting, RevisionConflictError, writeAccounting } from "@/lib/accounting-store";

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await readAccounting(), { headers: noStore });
}

export async function PUT(request: Request) {
  let email: string;
  try {
    ({ email } = await requireAdmin());
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { baseRevision?: number; data?: unknown };
  if (typeof body.baseRevision !== "number" || !body.data || typeof body.data !== "object") {
    return NextResponse.json({ error: "baseRevision and data are required" }, { status: 400 });
  }

  try {
    const saved = await writeAccounting(body.baseRevision, body.data, email);
    return NextResponse.json({ ok: true, revision: saved.revision, updatedAt: saved.updatedAt }, { headers: noStore });
  } catch (error) {
    if (error instanceof RevisionConflictError) {
      return NextResponse.json({ error: "Revision conflict", ...error.current }, { status: 409, headers: noStore });
    }
    const message = error instanceof Error ? error.message : "Unable to save";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
