import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createId, getMessages, saveMessages } from "@/lib/cms-store";

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(await getMessages(), { headers: noStore });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const { id, status, reply } = (await request.json()) as {
      id?: string;
      status?: "new" | "read" | "done";
      reply?: string;
    };
    const replyText = reply?.trim();
    const { messages } = await getMessages();
    const next = messages.map((message) => {
      if (message.id !== id) return message;

      return {
        ...message,
        status: status ?? (replyText ? "read" : message.status),
        replies: replyText
          ? [
              ...(message.replies ?? []),
              {
                id: createId("reply"),
                author: "admin" as const,
                message: replyText,
                createdAt: new Date().toISOString(),
              },
            ]
          : message.replies,
      };
    });
    await saveMessages(next);
    return NextResponse.json({ ok: true, messages: next }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
