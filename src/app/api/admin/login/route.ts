import { NextResponse } from "next/server";
import { setAdminSession, verifyAdmin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email ?? "";
  const password = body.password ?? "";
  const verified = await verifyAdmin(email, password);

  if (!verified) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await setAdminSession(verified);
  return NextResponse.json({ ok: true, email: verified, token });
}
