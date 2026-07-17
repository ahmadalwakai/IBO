"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChatMessage, CmsContent, QuoteLead } from "@/lib/cms-types";

type AdminInfo = { email: string; createdAt: string };
type AdminTab =
  | "overview"
  | "contact"
  | "services"
  | "cards"
  | "before"
  | "chat"
  | "quotes"
  | "admins";

const tabs: Array<{ id: AdminTab; label: string }> = [
  { id: "overview", label: "Home" },
  { id: "contact", label: "Contact" },
  { id: "services", label: "Services" },
  { id: "cards", label: "Cards" },
  { id: "before", label: "Before" },
  { id: "chat", label: "Chat" },
  { id: "quotes", label: "Quotes" },
  { id: "admins", label: "Admins" },
];

const iconOptions = [
  "PaintRoller",
  "Wallpaper",
  "WandSparkles",
  "Layers3",
  "PanelTop",
  "Ruler",
  "Construction",
  "SprayCan",
  "BugOff",
  "CalendarCheck",
  "ShieldCheck",
  "Gem",
  "MessageCircle",
  "Calculator",
  "ClipboardCheck",
  "Building2",
  "ScanLine",
  "Hammer",
  "Palette",
  "Check",
  "Sparkles",
];

function emptyService() {
  return {
    slug: `neue-leistung-${Date.now().toString(36)}`,
    title: "Neue Leistung",
    eyebrow: "Kategorie",
    short: "Kurze Beschreibung der Leistung.",
    summary: "Ausführliche Beschreibung der Leistung.",
    image: "/images/service-painting.png",
    iconName: "PaintRoller",
    highlights: ["Beratung", "Ausführung"],
    seoTitle: "Neue Leistung | IBO Creative",
    seoDescription: "SEO Beschreibung der neuen Leistung.",
  };
}

function emptyProject() {
  return {
    title: "Neues Projekt",
    category: "Kategorie",
    image: "/images/ibo-hero.png",
    text: "Kurze Projektbeschreibung.",
  };
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <input value={value} type={type} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ImageControl({
  label,
  value,
  onChange,
  onUpload,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onUpload: (file: File) => void;
}) {
  return (
    <div className="admin-image-control">
      <div className="admin-image-preview">
        {value ? (
          // Admin previews must support arbitrary uploaded URLs.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" />
        ) : (
          <span>No image selected</span>
        )}
      </div>
      <Field label={`${label} URL`} value={value} onChange={onChange} />
      <label className="admin-upload">
        Upload / replace {label.toLowerCase()}
        <input
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) onUpload(file);
            event.currentTarget.value = "";
          }}
        />
      </label>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="admin-toggle">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

export function AdminApp() {
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<AdminTab>("overview");
  const [content, setContent] = useState<CmsContent | null>(null);
  const [quotes, setQuotes] = useState<QuoteLead[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [admins, setAdmins] = useState<AdminInfo[]>([]);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [status, setStatus] = useState("Checking session...");

  const counters = useMemo(
    () => ({
      services: content?.services.length ?? 0,
      cards: content?.projects.length ?? 0,
      quotes: quotes.filter((item) => item.status === "new").length,
      messages: messages.filter((item) => item.status === "new").length,
    }),
    [content, messages, quotes],
  );

  const refreshInbox = useCallback(async (silent = false) => {
    try {
      const [quoteResponse, messageResponse] = await Promise.all([
        fetch("/api/admin/quotes", { cache: "no-store" }),
        fetch("/api/admin/messages", { cache: "no-store" }),
      ]);

      if (!quoteResponse.ok || !messageResponse.ok) {
        if (quoteResponse.status === 401 || messageResponse.status === 401) {
          setAuthenticated(false);
          setContent(null);
          setStatus("Login required");
          return;
        }

        throw new Error("Inbox refresh failed");
      }

      const [quoteData, messageData] = await Promise.all([
        quoteResponse.json(),
        messageResponse.json(),
      ]);

      setQuotes(quoteData.quotes ?? []);
      setMessages(messageData.messages ?? []);

      if (!silent) {
        setStatus("Inbox refreshed");
      }
    } catch {
      if (!silent) {
        setStatus("Inbox refresh failed");
      }
    }
  }, []);

  const loadAll = useCallback(async () => {
    const [cms, adminData] = await Promise.all([
      fetch("/api/admin/content", { cache: "no-store" }).then((res) => res.json()),
      fetch("/api/admin/admins", { cache: "no-store" }).then((res) => res.json()),
    ]);
    setContent(cms);
    setAdmins(adminData.admins ?? []);
    await refreshInbox(true);
    setStatus("Ready");
  }, [refreshInbox]);

  const bootstrap = useCallback(async () => {
    const session = await fetch("/api/admin/session").then((res) => res.json());
    if (!session.authenticated) {
      setStatus("Login required");
      return;
    }
    setAuthenticated(true);
    await loadAll();
  }, [loadAll]);

  useEffect(() => {
    // Session bootstrap intentionally hydrates the admin app from server state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!authenticated) return undefined;

    const intervalId = window.setInterval(() => {
      void refreshInbox(true);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [authenticated, refreshInbox]);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setStatus("Signing in...");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      setStatus("Wrong email or password");
      return;
    }
    setAuthenticated(true);
    setPassword("");
    await loadAll();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setContent(null);
    setStatus("Logged out");
  }

  async function save() {
    if (!content) return;
    setStatus("Saving and publishing...");
    const response = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });
    setStatus(response.ok ? "Saved and published" : "Save failed");
  }

  async function uploadImage(file: File, onUrl: (url: string) => void) {
    const form = new FormData();
    form.append("file", file);
    setStatus("Uploading image...");
    const response = await fetch("/api/admin/upload", { method: "POST", body: form });
    const data = await response.json();
    if (data.url) {
      onUrl(data.url);
      setStatus("Image uploaded");
    } else {
      setStatus(data.error ?? "Upload failed");
    }
  }

  function update(updater: (draft: CmsContent) => void) {
    setContent((current) => {
      if (!current) return current;
      const draft = structuredClone(current);
      updater(draft);
      return draft;
    });
  }

  async function addAdmin(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const data = await response.json();
    if (response.ok) {
      setAdmins((items) => [data.admin, ...items]);
      setAdminEmail("");
      setAdminPassword("");
      setStatus("Admin added");
    } else {
      setStatus(data.error ?? "Admin add failed");
    }
  }

  async function markQuote(id: string, statusValue: QuoteLead["status"]) {
    const data = await fetch("/api/admin/quotes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: statusValue }),
    }).then((res) => res.json());
    setQuotes(data.quotes ?? quotes);
  }

  async function markMessage(id: string, statusValue: ChatMessage["status"]) {
    const data = await fetch("/api/admin/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: statusValue }),
    }).then((res) => res.json());
    setMessages(data.messages ?? messages);
  }

  async function sendReply(id: string) {
    const reply = replyDrafts[id]?.trim();
    if (!reply) return;

    setStatus("Sending reply...");
    const response = await fetch("/api/admin/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, reply }),
    });
    const data = await response.json();

    if (response.ok) {
      setMessages(data.messages ?? messages);
      setReplyDrafts((current) => ({ ...current, [id]: "" }));
      setStatus("Reply sent");
    } else {
      setStatus(data.error ?? "Reply failed");
    }
  }

  if (!authenticated) {
    return (
      <main className="admin-shell admin-login-shell">
        <form className="admin-login-card" onSubmit={login}>
          <span className="admin-kicker">IBO Admin</span>
          <h1>Website Control</h1>
          <p>Sign in to manage services, cards, images, contacts, chat and quote requests.</p>
          <Field label="Email" value={email} onChange={setEmail} type="email" />
          <Field label="Password" value={password} onChange={setPassword} type="password" />
          <button className="admin-primary" type="submit">Sign in</button>
          <span className="admin-status">{status}</span>
        </form>
      </main>
    );
  }

  if (!content) {
    return <main className="admin-shell"><p className="admin-status">{status}</p></main>;
  }

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div>
          <span className="admin-kicker">IBO Admin</span>
          <h1>Control Center</h1>
        </div>
        <button className="admin-ghost" type="button" onClick={logout}>Logout</button>
      </header>

      <section className="admin-metrics">
        <span><strong>{counters.services}</strong> Services</span>
        <span><strong>{counters.cards}</strong> Cards</span>
        <span><strong>{counters.quotes}</strong> New quotes</span>
        <span><strong>{counters.messages}</strong> New chats</span>
      </section>

      <nav className="admin-tabs" aria-label="Admin tabs">
        {tabs.map((item) => (
          <button
            className={tab === item.id ? "active" : ""}
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <section className="admin-panel">
        {tab === "overview" ? (
          <div className="admin-grid">
            <div className="admin-card">
              <h2>Fast actions</h2>
              <button className="admin-primary" type="button" onClick={save}>Save and publish website</button>
              <button className="admin-ghost" type="button" onClick={() => void refreshInbox()}>Refresh inbox</button>
              <a className="admin-ghost as-link" href="/" target="_blank">Open website</a>
            </div>
            <div className="admin-card">
              <h2>Live controls</h2>
              <Toggle label="WhatsApp floating button" checked={content.settings.whatsappFloating} onChange={(value) => update((draft) => { draft.settings.whatsappFloating = value; })} />
              <Toggle label="Chat widget" checked={content.settings.chatEnabled} onChange={(value) => update((draft) => { draft.settings.chatEnabled = value; })} />
              <Toggle label="Quote form" checked={content.settings.quoteEnabled} onChange={(value) => update((draft) => { draft.settings.quoteEnabled = value; })} />
            </div>
          </div>
        ) : null}

        {tab === "contact" ? (
          <div className="admin-card">
            <h2>Contact details</h2>
            <Field label="Company name" value={content.company.name} onChange={(value) => update((draft) => { draft.company.name = value; })} />
            <Field label="Legal name" value={content.company.legalName} onChange={(value) => update((draft) => { draft.company.legalName = value; })} />
            <Field label="Address" value={content.company.address} onChange={(value) => update((draft) => { draft.company.address = value; })} />
            <Field label="Phone visible" value={content.company.phone} onChange={(value) => update((draft) => { draft.company.phone = value; })} />
            <Field label="Phone link" value={content.company.phoneHref} onChange={(value) => update((draft) => { draft.company.phoneHref = value; })} />
            <Field label="WhatsApp number" value={content.company.whatsapp} onChange={(value) => update((draft) => { draft.company.whatsapp = value; })} />
            <Field label="Email" value={content.company.email} onChange={(value) => update((draft) => { draft.company.email = value; draft.company.emailHref = `mailto:${value}`; })} />
            <Field label="Website URL" value={content.company.url} onChange={(value) => update((draft) => { draft.company.url = value; })} />
          </div>
        ) : null}

        {tab === "services" ? (
          <div className="admin-stack">
            <button className="admin-primary" type="button" onClick={() => update((draft) => { draft.services.unshift(emptyService()); })}>Add service</button>
            {content.services.map((service, index) => (
              <div className="admin-card" key={`${service.slug}-${index}`}>
                <div className="admin-row">
                  <h2>{service.title}</h2>
                  <button className="admin-danger" type="button" onClick={() => update((draft) => { draft.services.splice(index, 1); })}>Delete</button>
                </div>
                <Field label="Slug" value={service.slug} onChange={(value) => update((draft) => { draft.services[index].slug = value; })} />
                <Field label="Title" value={service.title} onChange={(value) => update((draft) => { draft.services[index].title = value; })} />
                <Field label="Eyebrow" value={service.eyebrow} onChange={(value) => update((draft) => { draft.services[index].eyebrow = value; })} />
                <TextArea label="Short text" value={service.short} onChange={(value) => update((draft) => { draft.services[index].short = value; })} />
                <TextArea label="Summary" value={service.summary} onChange={(value) => update((draft) => { draft.services[index].summary = value; })} />
                <ImageControl
                  label="Image"
                  value={service.image}
                  onChange={(value) => update((draft) => { draft.services[index].image = value; })}
                  onUpload={(file) => uploadImage(file, (url) => update((draft) => { draft.services[index].image = url; }))}
                />
                <label className="admin-field">
                  <span>Icon</span>
                  <select value={service.iconName} onChange={(event) => update((draft) => { draft.services[index].iconName = event.target.value; })}>
                    {iconOptions.map((icon) => <option key={icon}>{icon}</option>)}
                  </select>
                </label>
                <TextArea label="Highlights, one per line" value={service.highlights.join("\n")} onChange={(value) => update((draft) => { draft.services[index].highlights = value.split("\n").filter(Boolean); })} />
                <Field label="SEO title" value={service.seoTitle} onChange={(value) => update((draft) => { draft.services[index].seoTitle = value; })} />
                <TextArea label="SEO description" value={service.seoDescription} onChange={(value) => update((draft) => { draft.services[index].seoDescription = value; })} />
              </div>
            ))}
          </div>
        ) : null}

        {tab === "cards" ? (
          <div className="admin-stack">
            <button className="admin-primary" type="button" onClick={() => update((draft) => { draft.projects.unshift(emptyProject()); })}>Add card/project</button>
            {content.projects.map((project, index) => (
              <div className="admin-card" key={`${project.title}-${index}`}>
                <div className="admin-row">
                  <h2>{project.title}</h2>
                  <button className="admin-danger" type="button" onClick={() => update((draft) => { draft.projects.splice(index, 1); })}>Delete</button>
                </div>
                <Field label="Title" value={project.title} onChange={(value) => update((draft) => { draft.projects[index].title = value; })} />
                <Field label="Category" value={project.category} onChange={(value) => update((draft) => { draft.projects[index].category = value; })} />
                <TextArea label="Text" value={project.text} onChange={(value) => update((draft) => { draft.projects[index].text = value; })} />
                <ImageControl
                  label="Image"
                  value={project.image}
                  onChange={(value) => update((draft) => { draft.projects[index].image = value; })}
                  onUpload={(file) => uploadImage(file, (url) => update((draft) => { draft.projects[index].image = url; }))}
                />
              </div>
            ))}
          </div>
        ) : null}

        {tab === "before" ? (
          <div className="admin-card">
            <h2>Before / after card</h2>
            <ImageControl
              label="Hero image"
              value={content.settings.heroImage}
              onChange={(value) => update((draft) => { draft.settings.heroImage = value; })}
              onUpload={(file) => uploadImage(file, (url) => update((draft) => { draft.settings.heroImage = url; }))}
            />
            <Toggle label="Show before/after section" checked={content.settings.beforeAfterEnabled} onChange={(value) => update((draft) => { draft.settings.beforeAfterEnabled = value; })} />
            <Field label="Title" value={content.beforeAfter.title} onChange={(value) => update((draft) => { draft.beforeAfter.title = value; })} />
            <TextArea label="Text" value={content.beforeAfter.text} onChange={(value) => update((draft) => { draft.beforeAfter.text = value; })} />
            <Field label="Before label" value={content.beforeAfter.beforeLabel} onChange={(value) => update((draft) => { draft.beforeAfter.beforeLabel = value; })} />
            <Field label="After label" value={content.beforeAfter.afterLabel} onChange={(value) => update((draft) => { draft.beforeAfter.afterLabel = value; })} />
            <ImageControl
              label="After image"
              value={content.beforeAfter.afterImage}
              onChange={(value) => update((draft) => { draft.beforeAfter.afterImage = value; })}
              onUpload={(file) => uploadImage(file, (url) => update((draft) => { draft.beforeAfter.afterImage = url; }))}
            />
          </div>
        ) : null}

        {tab === "chat" ? (
          <div className="admin-grid">
            <div className="admin-card">
              <h2>Chat and WhatsApp</h2>
              <Toggle label="Chat enabled" checked={content.settings.chatEnabled} onChange={(value) => update((draft) => { draft.settings.chatEnabled = value; })} />
              <Toggle label="WhatsApp floating enabled" checked={content.settings.whatsappFloating} onChange={(value) => update((draft) => { draft.settings.whatsappFloating = value; })} />
              <TextArea label="Chat greeting" value={content.settings.chatGreeting} onChange={(value) => update((draft) => { draft.settings.chatGreeting = value; })} />
              <Field label="WhatsApp number" value={content.company.whatsapp} onChange={(value) => update((draft) => { draft.company.whatsapp = value; })} />
            </div>
            <div className="admin-card">
              <div className="admin-row">
                <h2>Messages</h2>
                <button className="admin-ghost" type="button" onClick={() => void refreshInbox()}>Refresh</button>
              </div>
              {messages.length === 0 ? <p>No chat messages yet.</p> : null}
              {messages.map((message) => (
                <article className="admin-list-item" key={message.id}>
                  <strong>{message.name}</strong>
                  <small>{message.email || "No email"} · {message.status}</small>
                  <div className="admin-thread">
                    <div className="admin-chat-bubble visitor">
                      <span>Customer</span>
                      <p>{message.message}</p>
                    </div>
                    {(message.replies ?? []).map((reply) => (
                      <div className={`admin-chat-bubble ${reply.author}`} key={reply.id}>
                        <span>{reply.author === "admin" ? "Admin" : "Customer"}</span>
                        <p>{reply.message}</p>
                      </div>
                    ))}
                  </div>
                  <TextArea
                    label="Reply in website chat"
                    value={replyDrafts[message.id] ?? ""}
                    onChange={(value) => setReplyDrafts((current) => ({ ...current, [message.id]: value }))}
                  />
                  <div className="admin-message-actions">
                    <button className="admin-primary" type="button" onClick={() => void sendReply(message.id)}>Send reply</button>
                    {message.email ? <a className="admin-ghost as-link" href={`mailto:${message.email}`}>Email</a> : null}
                    <button className="admin-ghost" type="button" onClick={() => markMessage(message.id, "done")}>Done</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {tab === "quotes" ? (
          <div className="admin-card">
            <div className="admin-row">
              <h2>Submitted quote requests</h2>
              <button className="admin-ghost" type="button" onClick={() => void refreshInbox()}>Refresh</button>
            </div>
            {quotes.length === 0 ? <p>No quote requests yet.</p> : null}
            {quotes.map((quote) => (
              <article className="admin-list-item" key={quote.id}>
                <strong>{quote.name}</strong>
                <p>{quote.message}</p>
                <small>{quote.phone} · {quote.email || "No email"} · {quote.status}</small>
                <button className="admin-ghost" type="button" onClick={() => markQuote(quote.id, "done")}>Done</button>
              </article>
            ))}
          </div>
        ) : null}

        {tab === "admins" ? (
          <div className="admin-grid">
            <form className="admin-card" onSubmit={addAdmin}>
              <h2>Add admin</h2>
              <Field label="Admin email" value={adminEmail} onChange={setAdminEmail} type="email" />
              <Field label="Admin password" value={adminPassword} onChange={setAdminPassword} type="password" />
              <button className="admin-primary" type="submit">Add admin</button>
            </form>
            <div className="admin-card">
              <h2>Admins</h2>
              {admins.map((admin) => (
                <article className="admin-list-item" key={admin.email}>
                  <strong>{admin.email}</strong>
                  <small>Created {new Date(admin.createdAt).toLocaleDateString()}</small>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <footer className="admin-bottom-bar">
        <span>{status}</span>
        <button className="admin-primary" type="button" onClick={save}>Save</button>
      </footer>
    </main>
  );
}
