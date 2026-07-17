import { NextResponse } from "next/server";
import { createAdmin, deleteAdmin, listAdmins, requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ admins: await listAdmins() });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    const admin = await createAdmin(body.email, body.password);
    return NextResponse.json({ ok: true, admin });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to add admin";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const { email } = (await request.json()) as { email?: string };
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
    await deleteAdmin(email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete admin";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 400 });
  }
}
