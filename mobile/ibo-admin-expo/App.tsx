import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

type CmsContent = {
  company: CmsCompany;
  settings: SiteSettings;
  navItems: NavItem[];
  services: ServiceItem[];
  stats: StatItem[];
  trustItems: IconTextItem[];
  processSteps: IconTextItem[];
  projects: ProjectCard[];
  beforeAfter: BeforeAfter;
  materials: string[];
  cities: CityItem[];
  testimonials: TestimonialItem[];
  faqs: FAQItem[];
  whyChoose: IconTextItem[];
  checklist: ChecklistItem[];
  galleryFilters: string[];
};

type CmsCompany = {
  name: string;
  legalName: string;
  tagline: string;
  address: string;
  phone: string;
  phoneHref: string;
  email: string;
  emailHref: string;
  url: string;
  area: string;
  whatsapp: string;
};

type SiteSettings = {
  whatsappFloating: boolean;
  chatEnabled: boolean;
  quoteEnabled: boolean;
  chatGreeting: string;
  beforeAfterEnabled: boolean;
  heroImage: string;
};

type NavItem = { label: string; href: string };
type StatItem = { label: string; value: number; suffix: string };
type IconTextItem = { title: string; text: string; iconName: string };
type CityItem = {
  slug: string;
  name: string;
  title: string;
  intro: string;
  localFocus: string[];
  seoTitle: string;
  seoDescription: string;
};
type TestimonialItem = { name: string; context: string; quote: string };
type FAQItem = { question: string; answer: string };
type ChecklistItem = { text: string; iconName: string };

type ServiceItem = {
  slug: string;
  title: string;
  eyebrow: string;
  short: string;
  summary: string;
  image: string;
  iconName: string;
  highlights: string[];
  seoTitle: string;
  seoDescription: string;
};

type ProjectCard = {
  title: string;
  category: string;
  image: string;
  text: string;
};

type BeforeAfter = {
  title: string;
  text: string;
  beforeLabel: string;
  afterLabel: string;
  afterImage: string;
};

type QuoteLead = {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: "new" | "read" | "done";
  createdAt: string;
};

type ChatReply = {
  id: string;
  author: "admin" | "visitor";
  message: string;
  createdAt: string;
};

type ChatMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  status: "new" | "read" | "done";
  createdAt: string;
  replies?: ChatReply[];
};

type AdminInfo = {
  email: string;
  createdAt: string;
};

type TabKey = "home" | "website" | "chat" | "quotes" | "admins";
type WebsitePanel = "contact" | "settings" | "services" | "cards" | "before";

const storageKeys = {
  baseURL: "ibo-admin-expo-base-url",
  email: "ibo-admin-expo-email",
  token: "ibo-admin-expo-token",
};

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

function emptyService(): ServiceItem {
  return {
    slug: `neue-leistung-${Date.now().toString(36)}`,
    title: "Neue Leistung",
    eyebrow: "Kategorie",
    short: "Kurze Beschreibung der Leistung.",
    summary: "Ausfuehrliche Beschreibung der Leistung.",
    image: "/images/service-painting.png",
    iconName: "PaintRoller",
    highlights: ["Beratung", "Ausfuehrung"],
    seoTitle: "Neue Leistung | IBO Creative",
    seoDescription: "SEO Beschreibung der neuen Leistung.",
  };
}

function emptyCard(): ProjectCard {
  return {
    title: "Neues Projekt",
    category: "Kategorie",
    image: "/images/ibo-hero.png",
    text: "Kurze Projektbeschreibung.",
  };
}

function normalizeBaseURL(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function imageUri(value: string, baseURL: string) {
  if (!value) return "";
  if (/^(https?:|data:|file:)/.test(value)) return value;
  const path = value.startsWith("/") ? value : `/${value}`;
  return `${normalizeBaseURL(baseURL)}${path}`;
}

export default function App() {
  const [baseURL, setBaseURL] = useState("https://raumwerkpro.de");
  const [email, setEmail] = useState("ibrahimalnuaimi.ik@gmail.com");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [content, setContent] = useState<CmsContent | null>(null);
  const [quotes, setQuotes] = useState<QuoteLead[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [admins, setAdmins] = useState<AdminInfo[]>([]);
  const [status, setStatus] = useState("Ready");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<TabKey>("home");
  const [websitePanel, setWebsitePanel] = useState<WebsitePanel>("contact");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");

  const authed = Boolean(token);
  const newChats = messages.filter((item) => item.status === "new").length;
  const newQuotes = quotes.filter((item) => item.status === "new").length;

  const endpoint = useCallback(
    (path: string) => `${normalizeBaseURL(baseURL)}${path}`,
    [baseURL],
  );

  const request = useCallback(
    async <T,>(
      path: string,
      options: RequestInit = {},
      requireToken = true,
    ): Promise<T> => {
      const headers = new Headers(options.headers);

      if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      headers.set("Accept", "application/json");
      if (requireToken && token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      const response = await fetch(endpoint(path), { ...options, headers });
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(data.error ?? text ?? "Request failed");
      }

      return data as T;
    },
    [endpoint, token],
  );

  const run = useCallback(async (label: string, action: () => Promise<void>) => {
    setLoading(true);
    setStatus(label);
    try {
      await action();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAll = useCallback(async () => {
    const [loadedContent, loadedQuotes, loadedMessages, loadedAdmins] = await Promise.all([
      request<CmsContent>("/api/admin/content"),
      request<{ quotes: QuoteLead[] }>("/api/admin/quotes"),
      request<{ messages: ChatMessage[] }>("/api/admin/messages"),
      request<{ admins: AdminInfo[] }>("/api/admin/admins"),
    ]);
    setContent(loadedContent);
    setQuotes(loadedQuotes.quotes);
    setMessages(loadedMessages.messages);
    setAdmins(loadedAdmins.admins);
  }, [request]);

  const refreshInbox = useCallback(
    async (silent = false) => {
      try {
        const [loadedQuotes, loadedMessages] = await Promise.all([
          request<{ quotes: QuoteLead[] }>("/api/admin/quotes"),
          request<{ messages: ChatMessage[] }>("/api/admin/messages"),
        ]);
        setQuotes(loadedQuotes.quotes);
        setMessages(loadedMessages.messages);
        if (!silent) setStatus("Inbox refreshed");
      } catch (error) {
        if (!silent) setStatus(error instanceof Error ? error.message : "Refresh failed");
      }
    },
    [request],
  );

  useEffect(() => {
    void (async () => {
      const [storedBase, storedEmail, storedToken] = await Promise.all([
        SecureStore.getItemAsync(storageKeys.baseURL),
        SecureStore.getItemAsync(storageKeys.email),
        SecureStore.getItemAsync(storageKeys.token),
      ]);
      if (storedBase) setBaseURL(storedBase);
      if (storedEmail) setEmail(storedEmail);
      if (storedToken) setToken(storedToken);
    })();
  }, []);

  useEffect(() => {
    if (!token) return;
    void run("Loading data...", async () => {
      await loadAll();
      setStatus("Ready");
    });
  }, [loadAll, run, token]);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      void refreshInbox(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshInbox, token]);

  async function login() {
    await run("Signing in...", async () => {
      const result = await request<{ ok: boolean; email: string; token: string }>(
        "/api/admin/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        },
        false,
      );
      await Promise.all([
        SecureStore.setItemAsync(storageKeys.baseURL, normalizeBaseURL(baseURL)),
        SecureStore.setItemAsync(storageKeys.email, result.email),
        SecureStore.setItemAsync(storageKeys.token, result.token),
      ]);
      setEmail(result.email);
      setToken(result.token);
      setPassword("");
      setStatus("Signed in");
    });
  }

  async function logout() {
    await SecureStore.deleteItemAsync(storageKeys.token);
    setToken("");
    setContent(null);
    setMessages([]);
    setQuotes([]);
    setAdmins([]);
    setStatus("Signed out");
  }

  async function saveContent() {
    if (!content) return;
    await run("Saving website...", async () => {
      const result = await request<{ ok: boolean; content: CmsContent }>("/api/admin/content", {
        method: "PUT",
        body: JSON.stringify(content),
      });
      setContent(result.content);
      setStatus("Website saved");
    });
  }

  function updateContent(updater: (draft: CmsContent) => void) {
    setContent((current) => {
      if (!current) return current;
      const draft = JSON.parse(JSON.stringify(current)) as CmsContent;
      updater(draft);
      return draft;
    });
  }

  async function uploadImage(onUploaded: (url: string) => void) {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photo access needed", "Allow photo access to upload website images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];

    await run("Uploading image...", async () => {
      const form = new FormData();
      form.append("file", {
        uri: asset.uri,
        name: asset.fileName ?? `image-${Date.now()}.jpg`,
        type: asset.mimeType ?? "image/jpeg",
      } as unknown as Blob);

      const response = await request<{ ok?: boolean; url?: string; error?: string }>(
        "/api/admin/upload",
        { method: "POST", body: form },
      );

      if (!response.url) throw new Error(response.error ?? "Upload failed");
      onUploaded(response.url);
      setStatus("Image uploaded");
    });
  }

  async function sendReply(message: ChatMessage) {
    const reply = replyDrafts[message.id]?.trim();
    if (!reply) return;

    await run("Sending reply...", async () => {
      const result = await request<{ ok: boolean; messages: ChatMessage[] }>("/api/admin/messages", {
        method: "PATCH",
        body: JSON.stringify({ id: message.id, reply }),
      });
      setMessages(result.messages);
      setReplyDrafts((current) => ({ ...current, [message.id]: "" }));
      setStatus("Reply sent");
    });
  }

  async function markMessage(message: ChatMessage) {
    await run("Updating chat...", async () => {
      const result = await request<{ ok: boolean; messages: ChatMessage[] }>("/api/admin/messages", {
        method: "PATCH",
        body: JSON.stringify({ id: message.id, status: "done" }),
      });
      setMessages(result.messages);
      setStatus("Chat done");
    });
  }

  async function markQuote(quote: QuoteLead) {
    await run("Updating quote...", async () => {
      const result = await request<{ ok: boolean; quotes: QuoteLead[] }>("/api/admin/quotes", {
        method: "PATCH",
        body: JSON.stringify({ id: quote.id, status: "done" }),
      });
      setQuotes(result.quotes);
      setStatus("Quote done");
    });
  }

  async function addAdmin() {
    if (!newAdminEmail.trim() || !newAdminPassword.trim()) return;

    await run("Adding admin...", async () => {
      const result = await request<{ ok: boolean; admin: AdminInfo }>("/api/admin/admins", {
        method: "POST",
        body: JSON.stringify({ email: newAdminEmail, password: newAdminPassword }),
      });
      setAdmins((current) => [result.admin, ...current]);
      setNewAdminEmail("");
      setNewAdminPassword("");
      setStatus("Admin added");
    });
  }

  async function deleteAdmin(admin: AdminInfo) {
    await run("Deleting admin...", async () => {
      await request<{ ok: boolean }>("/api/admin/admins", {
        method: "DELETE",
        body: JSON.stringify({ email: admin.email }),
      });
      setAdmins((current) => current.filter((item) => item.email !== admin.email));
      setStatus("Admin deleted");
    });
  }

  const summary = useMemo(
    () => ({
      services: content?.services.length ?? 0,
      cards: content?.projects.length ?? 0,
      chats: newChats,
      quotes: newQuotes,
    }),
    [content?.projects.length, content?.services.length, newChats, newQuotes],
  );

  if (!authed) {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.loginScreen} keyboardShouldPersistTaps="handled">
            <View style={styles.brandBlock}>
              <Text style={styles.kicker}>IBO ADMIN</Text>
              <Text style={styles.title}>Control Center</Text>
              <Text style={styles.muted}>Expo app for managing the live website.</Text>
            </View>

            <View style={styles.card}>
              <LabeledInput label="Server URL" value={baseURL} onChangeText={setBaseURL} autoCapitalize="none" />
              <LabeledInput label="Admin email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
              <LabeledInput label="Password" value={password} onChangeText={setPassword} secureTextEntry />
              <PrimaryButton label="Sign in" onPress={login} disabled={loading} />
            </View>

            <StatusLine status={status} loading={loading} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.appShell}>
        <View style={styles.topbar}>
          <View>
            <Text style={styles.kicker}>IBO ADMIN</Text>
            <Text style={styles.headerTitle}>Control Center</Text>
          </View>
          <Pressable style={styles.ghostButton} onPress={logout}>
            <Text style={styles.buttonText}>Logout</Text>
          </Pressable>
        </View>

        <View style={styles.tabs}>
          {(["home", "website", "chat", "quotes", "admins"] as TabKey[]).map((item) => (
            <Pressable
              key={item}
              style={[styles.tab, tab === item && styles.activeTab]}
              onPress={() => setTab(item)}
            >
              <Text style={[styles.tabText, tab === item && styles.activeTabText]}>
                {tabLabel(item)}
                {item === "chat" && newChats ? ` ${newChats}` : ""}
                {item === "quotes" && newQuotes ? ` ${newQuotes}` : ""}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {tab === "home" && (
            <View style={styles.grid}>
              <Metric title="Services" value={summary.services} />
              <Metric title="Cards" value={summary.cards} />
              <Metric title="New chats" value={summary.chats} />
              <Metric title="New quotes" value={summary.quotes} />

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Fast actions</Text>
                <PrimaryButton label="Save and publish website" onPress={saveContent} disabled={!content || loading} />
                <SecondaryButton label="Refresh all" onPress={() => run("Refreshing...", loadAll)} />
              </View>
            </View>
          )}

          {tab === "website" && content && (
            <WebsiteEditor
              content={content}
              baseURL={baseURL}
              panel={websitePanel}
              setPanel={setWebsitePanel}
              update={updateContent}
              uploadImage={uploadImage}
              saveContent={saveContent}
              loading={loading}
            />
          )}

          {tab === "chat" && (
            <ChatEditor
              messages={messages}
              drafts={replyDrafts}
              setDrafts={setReplyDrafts}
              sendReply={sendReply}
              markDone={markMessage}
              refresh={() => refreshInbox()}
            />
          )}

          {tab === "quotes" && (
            <QuotesEditor quotes={quotes} markDone={markQuote} refresh={() => refreshInbox()} />
          )}

          {tab === "admins" && (
            <AdminsEditor
              admins={admins}
              email={newAdminEmail}
              password={newAdminPassword}
              setEmail={setNewAdminEmail}
              setPassword={setNewAdminPassword}
              addAdmin={addAdmin}
              deleteAdmin={deleteAdmin}
            />
          )}
        </ScrollView>

        <View style={styles.bottomBar}>
          <StatusLine status={status} loading={loading} compact />
          <PrimaryButton label="Save" onPress={saveContent} disabled={!content || loading} small />
        </View>
      </View>
    </SafeAreaView>
  );
}

function tabLabel(tab: TabKey) {
  switch (tab) {
    case "home":
      return "Home";
    case "website":
      return "Website";
    case "chat":
      return "Chat";
    case "quotes":
      return "Quotes";
    case "admins":
      return "Admins";
  }
}

type WebsiteEditorProps = {
  content: CmsContent;
  baseURL: string;
  panel: WebsitePanel;
  setPanel: (panel: WebsitePanel) => void;
  update: (updater: (draft: CmsContent) => void) => void;
  uploadImage: (onUploaded: (url: string) => void) => Promise<void>;
  saveContent: () => Promise<void>;
  loading: boolean;
};

function WebsiteEditor({ content, baseURL, panel, setPanel, update, uploadImage, saveContent, loading }: WebsiteEditorProps) {
  return (
    <View style={styles.stack}>
      <View style={styles.segmented}>
        {(["contact", "settings", "services", "cards", "before"] as WebsitePanel[]).map((item) => (
          <Pressable
            key={item}
            style={[styles.segment, panel === item && styles.activeSegment]}
            onPress={() => setPanel(item)}
          >
            <Text style={[styles.segmentText, panel === item && styles.activeSegmentText]}>{panelLabel(item)}</Text>
          </Pressable>
        ))}
      </View>

      {panel === "contact" && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contact details</Text>
          <LabeledInput label="Company name" value={content.company.name} onChangeText={(value) => update((draft) => { draft.company.name = value; })} />
          <LabeledInput label="Legal name" value={content.company.legalName} onChangeText={(value) => update((draft) => { draft.company.legalName = value; })} />
          <LabeledInput label="Tagline" value={content.company.tagline} onChangeText={(value) => update((draft) => { draft.company.tagline = value; })} />
          <LabeledInput label="Address" value={content.company.address} onChangeText={(value) => update((draft) => { draft.company.address = value; })} />
          <LabeledInput label="Phone visible" value={content.company.phone} onChangeText={(value) => update((draft) => { draft.company.phone = value; })} />
          <LabeledInput label="Phone link" value={content.company.phoneHref} onChangeText={(value) => update((draft) => { draft.company.phoneHref = value; })} />
          <LabeledInput label="WhatsApp number" value={content.company.whatsapp} onChangeText={(value) => update((draft) => { draft.company.whatsapp = value; })} />
          <LabeledInput label="Email" value={content.company.email} onChangeText={(value) => update((draft) => { draft.company.email = value; draft.company.emailHref = `mailto:${value}`; })} />
          <LabeledInput label="Website URL" value={content.company.url} onChangeText={(value) => update((draft) => { draft.company.url = value; })} />
        </View>
      )}

      {panel === "settings" && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Live controls</Text>
          <ToggleRow label="WhatsApp floating button" value={content.settings.whatsappFloating} onValueChange={(value) => update((draft) => { draft.settings.whatsappFloating = value; })} />
          <ToggleRow label="Chat widget" value={content.settings.chatEnabled} onValueChange={(value) => update((draft) => { draft.settings.chatEnabled = value; })} />
          <ToggleRow label="Quote form" value={content.settings.quoteEnabled} onValueChange={(value) => update((draft) => { draft.settings.quoteEnabled = value; })} />
          <ToggleRow label="Before / after section" value={content.settings.beforeAfterEnabled} onValueChange={(value) => update((draft) => { draft.settings.beforeAfterEnabled = value; })} />
          <LabeledInput label="Chat greeting" value={content.settings.chatGreeting} onChangeText={(value) => update((draft) => { draft.settings.chatGreeting = value; })} multiline />
          <ImageField
            label="Hero image"
            value={content.settings.heroImage}
            baseURL={baseURL}
            onChangeText={(value) => update((draft) => { draft.settings.heroImage = value; })}
            onUpload={() => uploadImage((url) => update((draft) => { draft.settings.heroImage = url; }))}
          />
        </View>
      )}

      {panel === "services" && (
        <View style={styles.stack}>
          <PrimaryButton label="Add service" onPress={() => update((draft) => { draft.services.unshift(emptyService()); })} />
          {content.services.map((service, index) => (
            <ServiceCard
              key={`${service.slug}-${index}`}
              service={service}
              baseURL={baseURL}
              update={(updater) => update((draft) => updater(draft.services[index]))}
              deleteItem={() => update((draft) => { draft.services.splice(index, 1); })}
              uploadImage={() => uploadImage((url) => update((draft) => { draft.services[index].image = url; }))}
            />
          ))}
        </View>
      )}

      {panel === "cards" && (
        <View style={styles.stack}>
          <PrimaryButton label="Add card" onPress={() => update((draft) => { draft.projects.unshift(emptyCard()); })} />
          {content.projects.map((card, index) => (
            <ProjectCardEditor
              key={`${card.title}-${index}`}
              card={card}
              baseURL={baseURL}
              update={(updater) => update((draft) => updater(draft.projects[index]))}
              deleteItem={() => update((draft) => { draft.projects.splice(index, 1); })}
              uploadImage={() => uploadImage((url) => update((draft) => { draft.projects[index].image = url; }))}
            />
          ))}
        </View>
      )}

      {panel === "before" && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Before / after</Text>
          <LabeledInput label="Title" value={content.beforeAfter.title} onChangeText={(value) => update((draft) => { draft.beforeAfter.title = value; })} multiline />
          <LabeledInput label="Text" value={content.beforeAfter.text} onChangeText={(value) => update((draft) => { draft.beforeAfter.text = value; })} multiline />
          <LabeledInput label="Before label" value={content.beforeAfter.beforeLabel} onChangeText={(value) => update((draft) => { draft.beforeAfter.beforeLabel = value; })} />
          <LabeledInput label="After label" value={content.beforeAfter.afterLabel} onChangeText={(value) => update((draft) => { draft.beforeAfter.afterLabel = value; })} />
          <ImageField
            label="After image"
            value={content.beforeAfter.afterImage}
            baseURL={baseURL}
            onChangeText={(value) => update((draft) => { draft.beforeAfter.afterImage = value; })}
            onUpload={() => uploadImage((url) => update((draft) => { draft.beforeAfter.afterImage = url; }))}
          />
        </View>
      )}

      <PrimaryButton label="Save and publish website" onPress={saveContent} disabled={loading} />
    </View>
  );
}

function panelLabel(panel: WebsitePanel) {
  switch (panel) {
    case "contact":
      return "Contact";
    case "settings":
      return "Settings";
    case "services":
      return "Services";
    case "cards":
      return "Cards";
    case "before":
      return "Before";
  }
}

function ServiceCard({
  service,
  baseURL,
  update,
  deleteItem,
  uploadImage,
}: {
  service: ServiceItem;
  baseURL: string;
  update: (updater: (draft: ServiceItem) => void) => void;
  deleteItem: () => void;
  uploadImage: () => Promise<void>;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>{service.title}</Text>
        <DangerButton label="Delete" onPress={deleteItem} />
      </View>
      <LabeledInput label="Slug" value={service.slug} onChangeText={(value) => update((draft) => { draft.slug = value; })} />
      <LabeledInput label="Title" value={service.title} onChangeText={(value) => update((draft) => { draft.title = value; })} />
      <LabeledInput label="Eyebrow" value={service.eyebrow} onChangeText={(value) => update((draft) => { draft.eyebrow = value; })} />
      <LabeledInput label="Short text" value={service.short} onChangeText={(value) => update((draft) => { draft.short = value; })} multiline />
      <LabeledInput label="Summary" value={service.summary} onChangeText={(value) => update((draft) => { draft.summary = value; })} multiline />
      <ImageField
        label="Image"
        value={service.image}
        baseURL={baseURL}
        onChangeText={(value) => update((draft) => { draft.image = value; })}
        onUpload={uploadImage}
      />
      <Text style={styles.label}>Icon</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconScroller}>
        {iconOptions.map((icon) => (
          <Pressable key={icon} style={[styles.iconChip, service.iconName === icon && styles.activeIconChip]} onPress={() => update((draft) => { draft.iconName = icon; })}>
            <Text style={[styles.iconChipText, service.iconName === icon && styles.activeIconChipText]}>{icon}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <LabeledInput
        label="Highlights, one per line"
        value={service.highlights.join("\n")}
        onChangeText={(value) => update((draft) => { draft.highlights = value.split("\n").filter(Boolean); })}
        multiline
      />
      <LabeledInput label="SEO title" value={service.seoTitle} onChangeText={(value) => update((draft) => { draft.seoTitle = value; })} />
      <LabeledInput label="SEO description" value={service.seoDescription} onChangeText={(value) => update((draft) => { draft.seoDescription = value; })} multiline />
    </View>
  );
}

function ProjectCardEditor({
  card,
  baseURL,
  update,
  deleteItem,
  uploadImage,
}: {
  card: ProjectCard;
  baseURL: string;
  update: (updater: (draft: ProjectCard) => void) => void;
  deleteItem: () => void;
  uploadImage: () => Promise<void>;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>{card.title}</Text>
        <DangerButton label="Delete" onPress={deleteItem} />
      </View>
      <LabeledInput label="Title" value={card.title} onChangeText={(value) => update((draft) => { draft.title = value; })} />
      <LabeledInput label="Category" value={card.category} onChangeText={(value) => update((draft) => { draft.category = value; })} />
      <LabeledInput label="Text" value={card.text} onChangeText={(value) => update((draft) => { draft.text = value; })} multiline />
      <ImageField
        label="Image"
        value={card.image}
        baseURL={baseURL}
        onChangeText={(value) => update((draft) => { draft.image = value; })}
        onUpload={uploadImage}
      />
    </View>
  );
}

function ImageField({
  label,
  value,
  baseURL,
  onChangeText,
  onUpload,
}: {
  label: string;
  value: string;
  baseURL: string;
  onChangeText: (value: string) => void;
  onUpload: () => void;
}) {
  const uri = imageUri(value, baseURL);

  return (
    <View style={styles.imageField}>
      {uri ? (
        <Image source={{ uri }} style={styles.imagePreview} resizeMode="cover" />
      ) : (
        <View style={styles.imagePreviewEmpty}>
          <Text style={styles.imagePreviewText}>No image selected</Text>
        </View>
      )}
      <LabeledInput label={`${label} URL`} value={value} onChangeText={onChangeText} />
      <SecondaryButton label={`Upload / replace ${label.toLowerCase()}`} onPress={onUpload} />
    </View>
  );
}

function ChatEditor({
  messages,
  drafts,
  setDrafts,
  sendReply,
  markDone,
  refresh,
}: {
  messages: ChatMessage[];
  drafts: Record<string, string>;
  setDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  sendReply: (message: ChatMessage) => Promise<void>;
  markDone: (message: ChatMessage) => Promise<void>;
  refresh: () => Promise<void>;
}) {
  return (
    <View style={styles.stack}>
      <View style={styles.rowBetween}>
        <Text style={styles.screenTitle}>Chat</Text>
        <SecondaryButton label="Refresh" onPress={refresh} small />
      </View>
      {messages.length === 0 ? <EmptyState text="No chat messages yet." /> : null}
      {messages.map((message) => (
        <View style={styles.card} key={message.id}>
          <View style={styles.rowBetween}>
            <View style={styles.flex}>
              <Text style={styles.sectionTitle}>{message.name}</Text>
              <Text style={styles.muted}>{message.email || "No email"} - {message.status}</Text>
            </View>
            <StatusPill status={message.status} />
          </View>
          <Bubble author="Customer" text={message.message} />
          {(message.replies ?? []).map((reply) => (
            <Bubble key={reply.id} author={reply.author === "admin" ? "Admin" : "Customer"} text={reply.message} admin={reply.author === "admin"} />
          ))}
          <LabeledInput
            label="Reply in website chat"
            value={drafts[message.id] ?? ""}
            onChangeText={(value) => setDrafts((current) => ({ ...current, [message.id]: value }))}
            multiline
          />
          <View style={styles.actionRow}>
            <PrimaryButton label="Send reply" onPress={() => sendReply(message)} small />
            <SecondaryButton label="Done" onPress={() => markDone(message)} small />
          </View>
        </View>
      ))}
    </View>
  );
}

function QuotesEditor({
  quotes,
  markDone,
  refresh,
}: {
  quotes: QuoteLead[];
  markDone: (quote: QuoteLead) => Promise<void>;
  refresh: () => Promise<void>;
}) {
  return (
    <View style={styles.stack}>
      <View style={styles.rowBetween}>
        <Text style={styles.screenTitle}>Quotes</Text>
        <SecondaryButton label="Refresh" onPress={refresh} small />
      </View>
      {quotes.length === 0 ? <EmptyState text="No quote requests yet." /> : null}
      {quotes.map((quote) => (
        <View style={styles.card} key={quote.id}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>{quote.name}</Text>
            <StatusPill status={quote.status} />
          </View>
          <Text style={styles.bodyText}>{quote.message}</Text>
          <Text style={styles.muted}>{quote.phone}</Text>
          <Text style={styles.muted}>{quote.email || "No email"}</Text>
          <SecondaryButton label="Done" onPress={() => markDone(quote)} />
        </View>
      ))}
    </View>
  );
}

function AdminsEditor({
  admins,
  email,
  password,
  setEmail,
  setPassword,
  addAdmin,
  deleteAdmin,
}: {
  admins: AdminInfo[];
  email: string;
  password: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  addAdmin: () => Promise<void>;
  deleteAdmin: (admin: AdminInfo) => Promise<void>;
}) {
  return (
    <View style={styles.stack}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Add admin</Text>
        <LabeledInput label="Admin email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <LabeledInput label="Admin password" value={password} onChangeText={setPassword} secureTextEntry />
        <PrimaryButton label="Add admin" onPress={addAdmin} disabled={!email.trim() || !password.trim()} />
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Admins</Text>
        {admins.map((admin) => (
          <View style={styles.adminRow} key={admin.email}>
            <View style={styles.flex}>
              <Text style={styles.bodyText}>{admin.email}</Text>
              <Text style={styles.muted}>Created {new Date(admin.createdAt).toLocaleDateString()}</Text>
            </View>
            <DangerButton label="Delete" onPress={() => deleteAdmin(admin)} />
          </View>
        ))}
      </View>
    </View>
  );
}

function Metric({ title, value }: { title: string; value: number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{title}</Text>
    </View>
  );
}

function LabeledInput({
  label,
  value,
  onChangeText,
  multiline,
  secureTextEntry,
  autoCapitalize,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "url";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        placeholderTextColor="rgba(248,250,252,0.38)"
      />
    </View>
  );
}

function ToggleRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.bodyText}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

function Bubble({ author, text, admin = false }: { author: string; text: string; admin?: boolean }) {
  return (
    <View style={[styles.bubble, admin ? styles.adminBubble : styles.customerBubble]}>
      <Text style={styles.bubbleAuthor}>{author}</Text>
      <Text style={styles.bodyText}>{text}</Text>
    </View>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <View style={[styles.statusPill, status === "new" && styles.statusNew]}>
      <Text style={styles.statusText}>{status}</Text>
    </View>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.muted}>{text}</Text>
    </View>
  );
}

function StatusLine({ status, loading, compact = false }: { status: string; loading: boolean; compact?: boolean }) {
  return (
    <View style={[styles.statusLine, compact && styles.compactStatusLine]}>
      {loading ? <ActivityIndicator color="#38bdf8" /> : null}
      <Text style={styles.statusLineText} numberOfLines={compact ? 1 : 3}>{status}</Text>
    </View>
  );
}

function PrimaryButton({ label, onPress, disabled, small }: { label: string; onPress: () => void; disabled?: boolean; small?: boolean }) {
  return (
    <Pressable style={[styles.primaryButton, small && styles.smallButton, disabled && styles.disabledButton]} onPress={onPress} disabled={disabled}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress, small }: { label: string; onPress: () => void; small?: boolean }) {
  return (
    <Pressable style={[styles.secondaryButton, small && styles.smallButton]} onPress={onPress}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

function DangerButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.dangerButton} onPress={onPress}>
      <Text style={styles.dangerText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#07111f",
  },
  flex: {
    flex: 1,
  },
  loginScreen: {
    flexGrow: 1,
    justifyContent: "center",
    gap: 18,
    padding: 20,
  },
  appShell: {
    flex: 1,
    backgroundColor: "#07111f",
  },
  brandBlock: {
    gap: 8,
  },
  kicker: {
    color: "#38bdf8",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    color: "#f8fafc",
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: 0,
  },
  headerTitle: {
    color: "#f8fafc",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0,
  },
  screenTitle: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0,
  },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  activeTab: {
    backgroundColor: "#38bdf8",
  },
  tabText: {
    color: "rgba(248,250,252,0.76)",
    fontWeight: "800",
    fontSize: 12,
  },
  activeTabText: {
    color: "#07111f",
  },
  content: {
    gap: 14,
    padding: 14,
    paddingBottom: 104,
  },
  stack: {
    gap: 14,
  },
  grid: {
    gap: 12,
  },
  card: {
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 18,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  metric: {
    minHeight: 94,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  metricValue: {
    color: "#f8fafc",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0,
  },
  metricLabel: {
    color: "rgba(248,250,252,0.68)",
    fontWeight: "700",
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0,
  },
  bodyText: {
    color: "#f8fafc",
    fontSize: 15,
    lineHeight: 21,
  },
  muted: {
    color: "rgba(248,250,252,0.62)",
    lineHeight: 20,
  },
  field: {
    gap: 7,
  },
  label: {
    color: "rgba(248,250,252,0.7)",
    fontSize: 12,
    fontWeight: "800",
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#f8fafc",
    backgroundColor: "rgba(5,9,21,0.62)",
  },
  textArea: {
    minHeight: 104,
    textAlignVertical: "top",
  },
  imageField: {
    gap: 10,
  },
  imagePreview: {
    width: "100%",
    aspectRatio: 1.55,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(5,9,21,0.62)",
  },
  imagePreviewEmpty: {
    width: "100%",
    aspectRatio: 1.55,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(5,9,21,0.62)",
  },
  imagePreviewText: {
    color: "rgba(248,250,252,0.62)",
    fontWeight: "800",
  },
  primaryButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: "#38bdf8",
  },
  secondaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  ghostButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  smallButton: {
    minHeight: 40,
    paddingHorizontal: 12,
  },
  disabledButton: {
    opacity: 0.45,
  },
  buttonText: {
    color: "#f8fafc",
    fontWeight: "900",
  },
  dangerButton: {
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: "rgba(248,113,113,0.18)",
  },
  dangerText: {
    color: "#fecaca",
    fontWeight: "900",
  },
  segmented: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  segment: {
    minHeight: 40,
    justifyContent: "center",
    borderRadius: 16,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  activeSegment: {
    backgroundColor: "#8f5cff",
  },
  segmentText: {
    color: "rgba(248,250,252,0.74)",
    fontWeight: "800",
  },
  activeSegmentText: {
    color: "#fff",
  },
  toggleRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  adminRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingTop: 10,
  },
  iconScroller: {
    gap: 8,
    paddingVertical: 2,
  },
  iconChip: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  activeIconChip: {
    borderColor: "#38bdf8",
    backgroundColor: "rgba(56,189,248,0.18)",
  },
  iconChipText: {
    color: "rgba(248,250,252,0.76)",
    fontWeight: "700",
  },
  activeIconChipText: {
    color: "#f8fafc",
  },
  bubble: {
    gap: 5,
    borderRadius: 14,
    padding: 11,
  },
  customerBubble: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(143,92,255,0.14)",
  },
  adminBubble: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(56,189,248,0.14)",
  },
  bubbleAuthor: {
    color: "rgba(248,250,252,0.56)",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  statusNew: {
    backgroundColor: "rgba(56,189,248,0.18)",
  },
  statusText: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "900",
  },
  empty: {
    minHeight: 90,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 18,
  },
  statusLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 18,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  compactStatusLine: {
    flex: 1,
    paddingVertical: 8,
  },
  statusLineText: {
    flex: 1,
    color: "rgba(248,250,252,0.72)",
    fontWeight: "700",
  },
  bottomBar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 20,
    padding: 8,
    backgroundColor: "rgba(7,17,31,0.94)",
  },
});
