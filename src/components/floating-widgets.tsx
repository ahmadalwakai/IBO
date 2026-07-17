"use client";

import { MessageCircle, Send, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChatMessage, CmsContent } from "@/lib/cms-types";

type PublicChat = Pick<ChatMessage, "id" | "name" | "message" | "status" | "createdAt"> & {
  replies: NonNullable<ChatMessage["replies"]>;
};

const chatStorageKey = "ibo-chat-id";

export function FloatingWidgets({ initialContent }: { initialContent: CmsContent }) {
  const [content, setContent] = useState<CmsContent | null>(initialContent);
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [chat, setChat] = useState<PublicChat | null>(null);
  const [chatError, setChatError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/public/content")
      .then((res) => res.json())
      .then(setContent)
      .catch(() => undefined);
  }, []);

  const loadChat = useCallback(async (chatId: string) => {
    const response = await fetch(`/api/chat?id=${encodeURIComponent(chatId)}`, { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { chat?: PublicChat };
    if (data.chat) {
      setChat(data.chat);
    }
  }, []);

  useEffect(() => {
    const storedChatId = window.localStorage.getItem(chatStorageKey);
    if (storedChatId) {
      // Restores the visitor's active website-chat thread after refresh.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadChat(storedChatId);
    }
  }, [loadChat]);

  useEffect(() => {
    if (!chat?.id) return undefined;

    const intervalId = window.setInterval(() => {
      void loadChat(chat.id);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [chat?.id, loadChat]);

  const whatsappHref = useMemo(() => {
    if (!content?.company.whatsapp) return "#";
    const number = content.company.whatsapp.replace(/[^\d]/g, "");
    const text = encodeURIComponent("Hallo IBO Creative, ich möchte ein Projekt besprechen.");
    return `https://wa.me/${number}?text=${text}`;
  }, [content]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setChatError("");

    if (chat && !message.trim()) return;

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chat ? { chatId: chat.id, message } : { name, email, message }),
    });
    const data = (await response.json().catch(() => ({}))) as { chat?: PublicChat; error?: string };

    if (response.ok) {
      if (data.chat) {
        setChat(data.chat);
        window.localStorage.setItem(chatStorageKey, data.chat.id);
      }
      setSent(!chat);
      setName("");
      setEmail("");
      setMessage("");
    } else {
      setChatError(data.error ?? "Nachricht konnte nicht gesendet werden.");
    }
  }

  if (!content) return null;

  return (
    <div className="floating-stack">
      {open && content.settings.chatEnabled ? (
        <form className="chat-panel" onSubmit={submit}>
          <div className="chat-head">
            <div>
              <strong>IBO Chat</strong>
              <span>{content.settings.chatGreeting}</span>
            </div>
            <button type="button" aria-label="Chat schließen" onClick={() => setOpen(false)}>
              <X aria-hidden="true" />
            </button>
          </div>
          {chat ? (
            <div className="chat-thread" aria-live="polite">
              {sent ? <p className="success-note">Danke. Ihre Nachricht ist angekommen.</p> : null}
              <article className="chat-bubble visitor">
                <span>Sie</span>
                <p>{chat.message}</p>
              </article>
              {chat.replies.map((reply) => (
                <article className={`chat-bubble ${reply.author}`} key={reply.id}>
                  <span>{reply.author === "admin" ? "Antwort von IBO" : "Sie"}</span>
                  <p>{reply.message}</p>
                </article>
              ))}
              <label>
                Antwort schreiben
                <textarea value={message} required onChange={(event) => setMessage(event.target.value)} />
              </label>
            </div>
          ) : (
            <>
              <label>
                Name
                <input value={name} required onChange={(event) => setName(event.target.value)} />
              </label>
              <label>
                E-Mail optional
                <input value={email} type="email" onChange={(event) => setEmail(event.target.value)} />
              </label>
              <label>
                Nachricht
                <textarea value={message} required onChange={(event) => setMessage(event.target.value)} />
              </label>
            </>
          )}
          {chatError ? <p className="error-note">{chatError}</p> : null}
          <button className="luxury-button primary" type="submit">
            <span>{chat ? "Antwort senden" : "Senden"}</span>
            <Send aria-hidden="true" />
          </button>
        </form>
      ) : null}

      <div className="floating-actions">
        {content.settings.chatEnabled ? (
          <button className="floating-chat" type="button" aria-label="Chat öffnen" onClick={() => setOpen((value) => !value)}>
            <MessageCircle aria-hidden="true" />
          </button>
        ) : null}
        {content.settings.whatsappFloating ? (
          <a className="floating-whatsapp" href={whatsappHref} target="_blank" rel="noreferrer" aria-label="WhatsApp öffnen">
            <MessageCircle aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </div>
  );
}
