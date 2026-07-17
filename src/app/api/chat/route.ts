import { NextResponse } from "next/server";
import { createId, getMessages, saveMessages } from "@/lib/cms-store";
import type { ChatMessage } from "@/lib/cms-types";

const noStore = { "Cache-Control": "no-store" };

function publicChat(message: ChatMessage) {
  return {
    id: message.id,
    name: message.name,
    message: message.message,
    status: message.status,
    createdAt: message.createdAt,
    replies: message.replies ?? [],
  };
}

export async function GET(request: Request) {
  const chatId = new URL(request.url).searchParams.get("id");
  if (!chatId) {
    return NextResponse.json({ error: "Chat id is required" }, { status: 400, headers: noStore });
  }

  const { messages } = await getMessages();
  const chat = messages.find((message) => message.id === chatId);
  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404, headers: noStore });
  }

  return NextResponse.json({ chat: publicChat(chat) }, { headers: noStore });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<ChatMessage> & { chatId?: string };
  const replyText = body.message?.trim();

  if (body.chatId && replyText) {
    const { messages } = await getMessages();
    const next = messages.map((message) => {
      if (message.id !== body.chatId) return message;

      return {
        ...message,
        status: "new" as const,
        replies: [
          ...(message.replies ?? []),
          {
            id: createId("reply"),
            author: "visitor" as const,
            message: replyText,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    });
    const chat = next.find((message) => message.id === body.chatId);

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404, headers: noStore });
    }

    await saveMessages(next);
    return NextResponse.json({ ok: true, chat: publicChat(chat) }, { headers: noStore });
  }

  if (!body.name || !body.message) {
    return NextResponse.json({ error: "Name and message are required" }, { status: 400, headers: noStore });
  }

  const message: ChatMessage = {
    id: createId("chat"),
    name: body.name,
    email: body.email ?? "",
    message: replyText ?? body.message,
    status: "new",
    createdAt: new Date().toISOString(),
    replies: [],
  };

  const { messages } = await getMessages();
  await saveMessages([message, ...messages]);
  return NextResponse.json({ ok: true, chat: publicChat(message), message }, { headers: noStore });
}
