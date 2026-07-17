import { NextResponse } from "next/server";
import { getCmsContent } from "@/lib/cms-store";

export async function GET() {
  return NextResponse.json(await getCmsContent(), { headers: { "Cache-Control": "no-store" } });
}
