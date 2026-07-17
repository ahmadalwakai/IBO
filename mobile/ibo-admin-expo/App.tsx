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

type Language = "de" | "ar";
type TabKey = "home" | "website" | "chat" | "quotes" | "admins";
type WebsitePanel = "contact" | "settings" | "services" | "cards" | "before";

const defaultBaseURL = "https://raumwerkpro.de";
const fallbackBaseURL: string = "https://ibo-two-sepia.vercel.app";

const storageKeys = {
  baseURL: "ibo-admin-expo-base-url",
  email: "ibo-admin-expo-email",
  language: "ibo-admin-expo-language",
  token: "ibo-admin-expo-token",
};

const translations = {
  de: {
    langGerman: "DE",
    langArabic: "AR",
    controlCenter: "Kontrollzentrum",
    subtitle: "Expo-App zur Verwaltung der Live-Website.",
    serverUrl: "Server-URL",
    adminEmail: "Admin-E-Mail",
    password: "Passwort",
    signIn: "Anmelden",
    logout: "Abmelden",
    save: "Speichern",
    delete: "Löschen",
    done: "Erledigt",
    refresh: "Aktualisieren",
    refreshAll: "Alles aktualisieren",
    tabs: {
      home: "Start",
      website: "Website",
      chat: "Chat",
      quotes: "Anfragen",
      admins: "Admins",
    },
    metrics: {
      services: "Leistungen",
      cards: "Karten",
      newChats: "Neue Chats",
      newQuotes: "Neue Anfragen",
    },
    fastActions: "Schnellaktionen",
    savePublish: "Website speichern und veröffentlichen",
    panels: {
      contact: "Kontakt",
      settings: "Einstellungen",
      services: "Leistungen",
      cards: "Karten",
      before: "Vorher/Nachher",
    },
    contactDetails: "Kontaktdaten",
    companyName: "Firmenname",
    legalName: "Rechtlicher Name",
    tagline: "Slogan",
    address: "Adresse",
    phoneVisible: "Telefon sichtbar",
    phoneLink: "Telefon-Link",
    whatsappNumber: "WhatsApp-Nummer",
    email: "E-Mail",
    websiteUrl: "Website-URL",
    liveControls: "Live-Steuerung",
    whatsappFloating: "Schwebender WhatsApp-Button",
    chatWidget: "Chat-Widget",
    quoteForm: "Anfrageformular",
    beforeAfterSection: "Vorher/Nachher-Bereich",
    chatGreeting: "Chat-Begrüßung",
    heroImage: "Hero-Bild",
    addService: "Leistung hinzufügen",
    addCard: "Karte hinzufügen",
    beforeAfter: "Vorher/Nachher",
    titleLabel: "Titel",
    textLabel: "Text",
    beforeLabel: "Vorher-Label",
    afterLabel: "Nachher-Label",
    imageLabel: "Bild",
    noImage: "Kein Bild ausgewählt",
    uploadReplace: "Hochladen / ersetzen",
    icon: "Icon",
    highlights: "Highlights, eine Zeile pro Punkt",
    seoTitle: "SEO-Titel",
    seoDescription: "SEO-Beschreibung",
    slug: "Slug",
    eyebrow: "Kategoriezeile",
    shortText: "Kurztext",
    summary: "Zusammenfassung",
    category: "Kategorie",
    noChatMessages: "Noch keine Chat-Nachrichten.",
    noQuoteRequests: "Noch keine Anfragen.",
    noEmail: "Keine E-Mail",
    customer: "Kunde",
    admin: "Admin",
    replyInChat: "Antwort im Website-Chat",
    sendReply: "Antwort senden",
    addAdmin: "Admin hinzufügen",
    adminPassword: "Admin-Passwort",
    created: "Erstellt",
    statusMap: {
      new: "Neu",
      read: "Gelesen",
      done: "Erledigt",
    },
    status: {
      ready: "Bereit",
      loading: "Daten werden geladen...",
      signingIn: "Anmeldung...",
      signedIn: "Angemeldet",
      signedOut: "Abgemeldet",
      savingWebsite: "Website wird gespeichert...",
      websiteSaved: "Website gespeichert",
      uploadingImage: "Bild wird hochgeladen...",
      imageUploaded: "Bild hochgeladen",
      sendingReply: "Antwort wird gesendet...",
      replySent: "Antwort gesendet",
      updatingChat: "Chat wird aktualisiert...",
      chatDone: "Chat erledigt",
      updatingQuote: "Anfrage wird aktualisiert...",
      quoteDone: "Anfrage erledigt",
      addingAdmin: "Admin wird hinzugefügt...",
      adminAdded: "Admin hinzugefügt",
      deletingAdmin: "Admin wird gelöscht...",
      adminDeleted: "Admin gelöscht",
      refreshing: "Aktualisierung...",
      inboxRefreshed: "Posteingang aktualisiert",
      refreshFailed: "Aktualisierung fehlgeschlagen",
      requestFailed: "Anfrage fehlgeschlagen",
      uploadFailed: "Upload fehlgeschlagen",
      invalidServerResponse: "Ungültige Serverantwort",
    },
    alerts: {
      photoAccessTitle: "Fotozugriff benötigt",
      photoAccessBody: "Erlauben Sie Fotozugriff, um Website-Bilder hochzuladen.",
    },
  },
  ar: {
    langGerman: "ألماني",
    langArabic: "عربي",
    controlCenter: "لوحة التحكم",
    subtitle: "تطبيق Expo لإدارة الموقع المباشر.",
    serverUrl: "رابط الخادم",
    adminEmail: "بريد المدير",
    password: "كلمة المرور",
    signIn: "تسجيل الدخول",
    logout: "تسجيل الخروج",
    save: "حفظ",
    delete: "حذف",
    done: "تم",
    refresh: "تحديث",
    refreshAll: "تحديث الكل",
    tabs: {
      home: "الرئيسية",
      website: "الموقع",
      chat: "الدردشة",
      quotes: "الطلبات",
      admins: "المديرون",
    },
    metrics: {
      services: "الخدمات",
      cards: "البطاقات",
      newChats: "دردشات جديدة",
      newQuotes: "طلبات جديدة",
    },
    fastActions: "إجراءات سريعة",
    savePublish: "حفظ ونشر الموقع",
    panels: {
      contact: "التواصل",
      settings: "الإعدادات",
      services: "الخدمات",
      cards: "البطاقات",
      before: "قبل/بعد",
    },
    contactDetails: "بيانات التواصل",
    companyName: "اسم الشركة",
    legalName: "الاسم القانوني",
    tagline: "الشعار",
    address: "العنوان",
    phoneVisible: "رقم الهاتف الظاهر",
    phoneLink: "رابط الهاتف",
    whatsappNumber: "رقم واتساب",
    email: "البريد الإلكتروني",
    websiteUrl: "رابط الموقع",
    liveControls: "التحكم المباشر",
    whatsappFloating: "زر واتساب العائم",
    chatWidget: "أداة الدردشة",
    quoteForm: "نموذج الطلب",
    beforeAfterSection: "قسم قبل/بعد",
    chatGreeting: "رسالة ترحيب الدردشة",
    heroImage: "صورة الواجهة",
    addService: "إضافة خدمة",
    addCard: "إضافة بطاقة",
    beforeAfter: "قبل/بعد",
    titleLabel: "العنوان",
    textLabel: "النص",
    beforeLabel: "وسم قبل",
    afterLabel: "وسم بعد",
    imageLabel: "الصورة",
    noImage: "لم يتم اختيار صورة",
    uploadReplace: "رفع / استبدال",
    icon: "الأيقونة",
    highlights: "النقاط المهمة، سطر لكل نقطة",
    seoTitle: "عنوان SEO",
    seoDescription: "وصف SEO",
    slug: "الرابط المختصر",
    eyebrow: "سطر التصنيف",
    shortText: "نص قصير",
    summary: "الملخص",
    category: "التصنيف",
    noChatMessages: "لا توجد رسائل دردشة بعد.",
    noQuoteRequests: "لا توجد طلبات بعد.",
    noEmail: "لا يوجد بريد",
    customer: "العميل",
    admin: "المدير",
    replyInChat: "الرد داخل دردشة الموقع",
    sendReply: "إرسال الرد",
    addAdmin: "إضافة مدير",
    adminPassword: "كلمة مرور المدير",
    created: "تم الإنشاء",
    statusMap: {
      new: "جديد",
      read: "مقروء",
      done: "تم",
    },
    status: {
      ready: "جاهز",
      loading: "جاري تحميل البيانات...",
      signingIn: "جاري تسجيل الدخول...",
      signedIn: "تم تسجيل الدخول",
      signedOut: "تم تسجيل الخروج",
      savingWebsite: "جاري حفظ الموقع...",
      websiteSaved: "تم حفظ الموقع",
      uploadingImage: "جاري رفع الصورة...",
      imageUploaded: "تم رفع الصورة",
      sendingReply: "جاري إرسال الرد...",
      replySent: "تم إرسال الرد",
      updatingChat: "جاري تحديث الدردشة...",
      chatDone: "تم إنهاء الدردشة",
      updatingQuote: "جاري تحديث الطلب...",
      quoteDone: "تم إنهاء الطلب",
      addingAdmin: "جاري إضافة المدير...",
      adminAdded: "تمت إضافة المدير",
      deletingAdmin: "جاري حذف المدير...",
      adminDeleted: "تم حذف المدير",
      refreshing: "جاري التحديث...",
      inboxRefreshed: "تم تحديث صندوق الرسائل",
      refreshFailed: "فشل التحديث",
      requestFailed: "فشل الطلب",
      uploadFailed: "فشل الرفع",
      invalidServerResponse: "استجابة الخادم غير صالحة",
    },
    alerts: {
      photoAccessTitle: "نحتاج الوصول للصور",
      photoAccessBody: "اسمح بالوصول للصور حتى يمكن رفع صور الموقع.",
    },
  },
};

type Translations = typeof translations.de;

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
  const [language, setLanguage] = useState<Language>("de");
  const [baseURL, setBaseURL] = useState(defaultBaseURL);
  const [email, setEmail] = useState("ibrahimalnuaimi.ik@gmail.com");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [content, setContent] = useState<CmsContent | null>(null);
  const [quotes, setQuotes] = useState<QuoteLead[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [admins, setAdmins] = useState<AdminInfo[]>([]);
  const [status, setStatus] = useState(translations.de.status.ready);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<TabKey>("home");
  const [websitePanel, setWebsitePanel] = useState<WebsitePanel>("contact");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");

  const authed = Boolean(token);
  const newChats = messages.filter((item) => item.status === "new").length;
  const newQuotes = quotes.filter((item) => item.status === "new").length;
  const t = translations[language];

  const changeLanguage = useCallback(async (value: Language) => {
    setLanguage(value);
    await SecureStore.setItemAsync(storageKeys.language, value);
  }, []);

  const requestUrls = useCallback((path: string) => {
    const normalized = normalizeBaseURL(baseURL || defaultBaseURL);
    const urls = [`${normalized}${path}`];
    if (normalized === defaultBaseURL && fallbackBaseURL !== defaultBaseURL) {
      urls.push(`${fallbackBaseURL}${path}`);
    }
    return urls;
  }, [baseURL]);

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

      let lastError: Error | null = null;
      const urls = requestUrls(path);

      for (const url of urls) {
        try {
          const response = await fetch(url, { ...options, headers });
          const text = await response.text();
          let data: Record<string, unknown> = {};

          if (text) {
            try {
              data = JSON.parse(text) as Record<string, unknown>;
            } catch {
              if (url !== urls[urls.length - 1]) continue;
              throw new Error(t.status.invalidServerResponse);
            }
          }

          if (!response.ok) {
            const message =
              typeof data.error === "string" ? data.error : text || t.status.requestFailed;
            if (url !== urls[urls.length - 1] && [404, 502, 503, 504].includes(response.status)) {
              lastError = new Error(message);
              continue;
            }
            throw new Error(message);
          }

          return data as T;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(t.status.requestFailed);
          if (url === urls[urls.length - 1]) break;
        }
      }

      throw lastError ?? new Error(t.status.requestFailed);
    },
    [requestUrls, t.status.invalidServerResponse, t.status.requestFailed, token],
  );

  const run = useCallback(async (label: string, action: () => Promise<void>) => {
    setLoading(true);
    setStatus(label);
    try {
      await action();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t.status.requestFailed);
    } finally {
      setLoading(false);
    }
  }, [t.status.requestFailed]);

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
        if (!silent) setStatus(t.status.inboxRefreshed);
      } catch (error) {
        if (!silent) setStatus(error instanceof Error ? error.message : t.status.refreshFailed);
      }
    },
    [request, t.status.inboxRefreshed, t.status.refreshFailed],
  );

  useEffect(() => {
    void (async () => {
      const [storedBase, storedEmail, storedLanguage, storedToken] = await Promise.all([
        SecureStore.getItemAsync(storageKeys.baseURL),
        SecureStore.getItemAsync(storageKeys.email),
        SecureStore.getItemAsync(storageKeys.language),
        SecureStore.getItemAsync(storageKeys.token),
      ]);
      if (storedBase) setBaseURL(storedBase);
      if (storedEmail) setEmail(storedEmail);
      if (storedLanguage === "de" || storedLanguage === "ar") setLanguage(storedLanguage);
      if (storedToken) setToken(storedToken);
    })();
  }, []);

  useEffect(() => {
    if (!token) return;
    void run(t.status.loading, async () => {
      await loadAll();
      setStatus(t.status.ready);
    });
  }, [loadAll, run, t.status.loading, t.status.ready, token]);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      void refreshInbox(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshInbox, token]);

  async function login() {
    await run(t.status.signingIn, async () => {
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
      setStatus(t.status.signedIn);
    });
  }

  async function logout() {
    await SecureStore.deleteItemAsync(storageKeys.token);
    setToken("");
    setContent(null);
    setMessages([]);
    setQuotes([]);
    setAdmins([]);
    setStatus(t.status.signedOut);
  }

  async function saveContent() {
    if (!content) return;
    await run(t.status.savingWebsite, async () => {
      const result = await request<{ ok: boolean; content: CmsContent }>("/api/admin/content", {
        method: "PUT",
        body: JSON.stringify(content),
      });
      setContent(result.content);
      setStatus(t.status.websiteSaved);
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
      Alert.alert(t.alerts.photoAccessTitle, t.alerts.photoAccessBody);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];

    await run(t.status.uploadingImage, async () => {
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

      if (!response.url) throw new Error(response.error ?? t.status.uploadFailed);
      onUploaded(response.url);
      setStatus(t.status.imageUploaded);
    });
  }

  async function sendReply(message: ChatMessage) {
    const reply = replyDrafts[message.id]?.trim();
    if (!reply) return;

    await run(t.status.sendingReply, async () => {
      const result = await request<{ ok: boolean; messages: ChatMessage[] }>("/api/admin/messages", {
        method: "PATCH",
        body: JSON.stringify({ id: message.id, reply }),
      });
      setMessages(result.messages);
      setReplyDrafts((current) => ({ ...current, [message.id]: "" }));
      setStatus(t.status.replySent);
    });
  }

  async function markMessage(message: ChatMessage) {
    await run(t.status.updatingChat, async () => {
      const result = await request<{ ok: boolean; messages: ChatMessage[] }>("/api/admin/messages", {
        method: "PATCH",
        body: JSON.stringify({ id: message.id, status: "done" }),
      });
      setMessages(result.messages);
      setStatus(t.status.chatDone);
    });
  }

  async function markQuote(quote: QuoteLead) {
    await run(t.status.updatingQuote, async () => {
      const result = await request<{ ok: boolean; quotes: QuoteLead[] }>("/api/admin/quotes", {
        method: "PATCH",
        body: JSON.stringify({ id: quote.id, status: "done" }),
      });
      setQuotes(result.quotes);
      setStatus(t.status.quoteDone);
    });
  }

  async function addAdmin() {
    if (!newAdminEmail.trim() || !newAdminPassword.trim()) return;

    await run(t.status.addingAdmin, async () => {
      const result = await request<{ ok: boolean; admin: AdminInfo }>("/api/admin/admins", {
        method: "POST",
        body: JSON.stringify({ email: newAdminEmail, password: newAdminPassword }),
      });
      setAdmins((current) => [result.admin, ...current]);
      setNewAdminEmail("");
      setNewAdminPassword("");
      setStatus(t.status.adminAdded);
    });
  }

  async function deleteAdmin(admin: AdminInfo) {
    await run(t.status.deletingAdmin, async () => {
      await request<{ ok: boolean }>("/api/admin/admins", {
        method: "DELETE",
        body: JSON.stringify({ email: admin.email }),
      });
      setAdmins((current) => current.filter((item) => item.email !== admin.email));
      setStatus(t.status.adminDeleted);
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
              <LanguageSwitch language={language} t={t} onChange={changeLanguage} />
              <Text style={styles.kicker}>IBO ADMIN</Text>
              <Text style={styles.title}>{t.controlCenter}</Text>
              <Text style={styles.muted}>{t.subtitle}</Text>
            </View>

            <View style={styles.card}>
              <LabeledInput label={t.serverUrl} value={baseURL} onChangeText={setBaseURL} autoCapitalize="none" />
              <LabeledInput label={t.adminEmail} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
              <LabeledInput label={t.password} value={password} onChangeText={setPassword} secureTextEntry />
              <PrimaryButton label={t.signIn} onPress={login} disabled={loading} />
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
            <Text style={styles.headerTitle}>{t.controlCenter}</Text>
          </View>
          <View style={styles.topbarActions}>
            <LanguageSwitch language={language} t={t} onChange={changeLanguage} compact />
            <Pressable style={styles.ghostButton} onPress={logout}>
              <Text style={styles.buttonText}>{t.logout}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.tabs}>
          {(["home", "website", "chat", "quotes", "admins"] as TabKey[]).map((item) => (
            <Pressable
              key={item}
              style={[styles.tab, tab === item && styles.activeTab]}
              onPress={() => setTab(item)}
            >
              <Text style={[styles.tabText, tab === item && styles.activeTabText]}>
                {tabLabel(item, t)}
                {item === "chat" && newChats ? ` ${newChats}` : ""}
                {item === "quotes" && newQuotes ? ` ${newQuotes}` : ""}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {tab === "home" && (
            <View style={styles.grid}>
              <Metric title={t.metrics.services} value={summary.services} />
              <Metric title={t.metrics.cards} value={summary.cards} />
              <Metric title={t.metrics.newChats} value={summary.chats} />
              <Metric title={t.metrics.newQuotes} value={summary.quotes} />

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t.fastActions}</Text>
                <PrimaryButton label={t.savePublish} onPress={saveContent} disabled={!content || loading} />
                <SecondaryButton label={t.refreshAll} onPress={() => run(t.status.refreshing, loadAll)} />
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
              t={t}
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
              t={t}
            />
          )}

          {tab === "quotes" && (
            <QuotesEditor quotes={quotes} markDone={markQuote} refresh={() => refreshInbox()} t={t} />
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
              t={t}
            />
          )}
        </ScrollView>

        <View style={styles.bottomBar}>
          <StatusLine status={status} loading={loading} compact />
          <PrimaryButton label={t.save} onPress={saveContent} disabled={!content || loading} small />
        </View>
      </View>
    </SafeAreaView>
  );
}

function tabLabel(tab: TabKey, t: Translations) {
  switch (tab) {
    case "home":
      return t.tabs.home;
    case "website":
      return t.tabs.website;
    case "chat":
      return t.tabs.chat;
    case "quotes":
      return t.tabs.quotes;
    case "admins":
      return t.tabs.admins;
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
  t: Translations;
};

function WebsiteEditor({ content, baseURL, panel, setPanel, update, uploadImage, saveContent, loading, t }: WebsiteEditorProps) {
  return (
    <View style={styles.stack}>
      <View style={styles.segmented}>
        {(["contact", "settings", "services", "cards", "before"] as WebsitePanel[]).map((item) => (
          <Pressable
            key={item}
            style={[styles.segment, panel === item && styles.activeSegment]}
            onPress={() => setPanel(item)}
          >
            <Text style={[styles.segmentText, panel === item && styles.activeSegmentText]}>{panelLabel(item, t)}</Text>
          </Pressable>
        ))}
      </View>

      {panel === "contact" && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t.contactDetails}</Text>
          <LabeledInput label={t.companyName} value={content.company.name} onChangeText={(value) => update((draft) => { draft.company.name = value; })} />
          <LabeledInput label={t.legalName} value={content.company.legalName} onChangeText={(value) => update((draft) => { draft.company.legalName = value; })} />
          <LabeledInput label={t.tagline} value={content.company.tagline} onChangeText={(value) => update((draft) => { draft.company.tagline = value; })} />
          <LabeledInput label={t.address} value={content.company.address} onChangeText={(value) => update((draft) => { draft.company.address = value; })} />
          <LabeledInput label={t.phoneVisible} value={content.company.phone} onChangeText={(value) => update((draft) => { draft.company.phone = value; })} />
          <LabeledInput label={t.phoneLink} value={content.company.phoneHref} onChangeText={(value) => update((draft) => { draft.company.phoneHref = value; })} />
          <LabeledInput label={t.whatsappNumber} value={content.company.whatsapp} onChangeText={(value) => update((draft) => { draft.company.whatsapp = value; })} />
          <LabeledInput label={t.email} value={content.company.email} onChangeText={(value) => update((draft) => { draft.company.email = value; draft.company.emailHref = `mailto:${value}`; })} />
          <LabeledInput label={t.websiteUrl} value={content.company.url} onChangeText={(value) => update((draft) => { draft.company.url = value; })} />
        </View>
      )}

      {panel === "settings" && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t.liveControls}</Text>
          <ToggleRow label={t.whatsappFloating} value={content.settings.whatsappFloating} onValueChange={(value) => update((draft) => { draft.settings.whatsappFloating = value; })} />
          <ToggleRow label={t.chatWidget} value={content.settings.chatEnabled} onValueChange={(value) => update((draft) => { draft.settings.chatEnabled = value; })} />
          <ToggleRow label={t.quoteForm} value={content.settings.quoteEnabled} onValueChange={(value) => update((draft) => { draft.settings.quoteEnabled = value; })} />
          <ToggleRow label={t.beforeAfterSection} value={content.settings.beforeAfterEnabled} onValueChange={(value) => update((draft) => { draft.settings.beforeAfterEnabled = value; })} />
          <LabeledInput label={t.chatGreeting} value={content.settings.chatGreeting} onChangeText={(value) => update((draft) => { draft.settings.chatGreeting = value; })} multiline />
          <ImageField
            label={t.heroImage}
            value={content.settings.heroImage}
            baseURL={baseURL}
            onChangeText={(value) => update((draft) => { draft.settings.heroImage = value; })}
            onUpload={() => uploadImage((url) => update((draft) => { draft.settings.heroImage = url; }))}
            t={t}
          />
        </View>
      )}

      {panel === "services" && (
        <View style={styles.stack}>
          <PrimaryButton label={t.addService} onPress={() => update((draft) => { draft.services.unshift(emptyService()); })} />
          {content.services.map((service, index) => (
            <ServiceCard
              key={`${service.slug}-${index}`}
              service={service}
              baseURL={baseURL}
              update={(updater) => update((draft) => updater(draft.services[index]))}
              deleteItem={() => update((draft) => { draft.services.splice(index, 1); })}
              uploadImage={() => uploadImage((url) => update((draft) => { draft.services[index].image = url; }))}
              t={t}
            />
          ))}
        </View>
      )}

      {panel === "cards" && (
        <View style={styles.stack}>
          <PrimaryButton label={t.addCard} onPress={() => update((draft) => { draft.projects.unshift(emptyCard()); })} />
          {content.projects.map((card, index) => (
            <ProjectCardEditor
              key={`${card.title}-${index}`}
              card={card}
              baseURL={baseURL}
              update={(updater) => update((draft) => updater(draft.projects[index]))}
              deleteItem={() => update((draft) => { draft.projects.splice(index, 1); })}
              uploadImage={() => uploadImage((url) => update((draft) => { draft.projects[index].image = url; }))}
              t={t}
            />
          ))}
        </View>
      )}

      {panel === "before" && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t.beforeAfter}</Text>
          <LabeledInput label={t.titleLabel} value={content.beforeAfter.title} onChangeText={(value) => update((draft) => { draft.beforeAfter.title = value; })} multiline />
          <LabeledInput label={t.textLabel} value={content.beforeAfter.text} onChangeText={(value) => update((draft) => { draft.beforeAfter.text = value; })} multiline />
          <LabeledInput label={t.beforeLabel} value={content.beforeAfter.beforeLabel} onChangeText={(value) => update((draft) => { draft.beforeAfter.beforeLabel = value; })} />
          <LabeledInput label={t.afterLabel} value={content.beforeAfter.afterLabel} onChangeText={(value) => update((draft) => { draft.beforeAfter.afterLabel = value; })} />
          <ImageField
            label={t.imageLabel}
            value={content.beforeAfter.afterImage}
            baseURL={baseURL}
            onChangeText={(value) => update((draft) => { draft.beforeAfter.afterImage = value; })}
            onUpload={() => uploadImage((url) => update((draft) => { draft.beforeAfter.afterImage = url; }))}
            t={t}
          />
        </View>
      )}

      <PrimaryButton label={t.savePublish} onPress={saveContent} disabled={loading} />
    </View>
  );
}

function panelLabel(panel: WebsitePanel, t: Translations) {
  switch (panel) {
    case "contact":
      return t.panels.contact;
    case "settings":
      return t.panels.settings;
    case "services":
      return t.panels.services;
    case "cards":
      return t.panels.cards;
    case "before":
      return t.panels.before;
  }
}

function ServiceCard({
  service,
  baseURL,
  update,
  deleteItem,
  uploadImage,
  t,
}: {
  service: ServiceItem;
  baseURL: string;
  update: (updater: (draft: ServiceItem) => void) => void;
  deleteItem: () => void;
  uploadImage: () => Promise<void>;
  t: Translations;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>{service.title}</Text>
        <DangerButton label={t.delete} onPress={deleteItem} />
      </View>
      <LabeledInput label={t.slug} value={service.slug} onChangeText={(value) => update((draft) => { draft.slug = value; })} />
      <LabeledInput label={t.titleLabel} value={service.title} onChangeText={(value) => update((draft) => { draft.title = value; })} />
      <LabeledInput label={t.eyebrow} value={service.eyebrow} onChangeText={(value) => update((draft) => { draft.eyebrow = value; })} />
      <LabeledInput label={t.shortText} value={service.short} onChangeText={(value) => update((draft) => { draft.short = value; })} multiline />
      <LabeledInput label={t.summary} value={service.summary} onChangeText={(value) => update((draft) => { draft.summary = value; })} multiline />
      <ImageField
        label={t.imageLabel}
        value={service.image}
        baseURL={baseURL}
        onChangeText={(value) => update((draft) => { draft.image = value; })}
        onUpload={uploadImage}
        t={t}
      />
      <Text style={styles.label}>{t.icon}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconScroller}>
        {iconOptions.map((icon) => (
          <Pressable key={icon} style={[styles.iconChip, service.iconName === icon && styles.activeIconChip]} onPress={() => update((draft) => { draft.iconName = icon; })}>
            <Text style={[styles.iconChipText, service.iconName === icon && styles.activeIconChipText]}>{icon}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <LabeledInput
        label={t.highlights}
        value={service.highlights.join("\n")}
        onChangeText={(value) => update((draft) => { draft.highlights = value.split("\n").filter(Boolean); })}
        multiline
      />
      <LabeledInput label={t.seoTitle} value={service.seoTitle} onChangeText={(value) => update((draft) => { draft.seoTitle = value; })} />
      <LabeledInput label={t.seoDescription} value={service.seoDescription} onChangeText={(value) => update((draft) => { draft.seoDescription = value; })} multiline />
    </View>
  );
}

function ProjectCardEditor({
  card,
  baseURL,
  update,
  deleteItem,
  uploadImage,
  t,
}: {
  card: ProjectCard;
  baseURL: string;
  update: (updater: (draft: ProjectCard) => void) => void;
  deleteItem: () => void;
  uploadImage: () => Promise<void>;
  t: Translations;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>{card.title}</Text>
        <DangerButton label={t.delete} onPress={deleteItem} />
      </View>
      <LabeledInput label={t.titleLabel} value={card.title} onChangeText={(value) => update((draft) => { draft.title = value; })} />
      <LabeledInput label={t.category} value={card.category} onChangeText={(value) => update((draft) => { draft.category = value; })} />
      <LabeledInput label={t.textLabel} value={card.text} onChangeText={(value) => update((draft) => { draft.text = value; })} multiline />
      <ImageField
        label={t.imageLabel}
        value={card.image}
        baseURL={baseURL}
        onChangeText={(value) => update((draft) => { draft.image = value; })}
        onUpload={uploadImage}
        t={t}
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
  t,
}: {
  label: string;
  value: string;
  baseURL: string;
  onChangeText: (value: string) => void;
  onUpload: () => void;
  t: Translations;
}) {
  const uri = imageUri(value, baseURL);

  return (
    <View style={styles.imageField}>
      {uri ? (
        <Image source={{ uri }} style={styles.imagePreview} resizeMode="cover" />
      ) : (
        <View style={styles.imagePreviewEmpty}>
          <Text style={styles.imagePreviewText}>{t.noImage}</Text>
        </View>
      )}
      <LabeledInput label={`${label} URL`} value={value} onChangeText={onChangeText} />
      <SecondaryButton label={`${t.uploadReplace} ${label.toLowerCase()}`} onPress={onUpload} />
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
  t,
}: {
  messages: ChatMessage[];
  drafts: Record<string, string>;
  setDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  sendReply: (message: ChatMessage) => Promise<void>;
  markDone: (message: ChatMessage) => Promise<void>;
  refresh: () => Promise<void>;
  t: Translations;
}) {
  return (
    <View style={styles.stack}>
      <View style={styles.rowBetween}>
        <Text style={styles.screenTitle}>{t.tabs.chat}</Text>
        <SecondaryButton label={t.refresh} onPress={refresh} small />
      </View>
      {messages.length === 0 ? <EmptyState text={t.noChatMessages} /> : null}
      {messages.map((message) => (
        <View style={styles.card} key={message.id}>
          <View style={styles.rowBetween}>
            <View style={styles.flex}>
              <Text style={styles.sectionTitle}>{message.name}</Text>
              <Text style={styles.muted}>{message.email || t.noEmail} - {t.statusMap[message.status]}</Text>
            </View>
            <StatusPill status={message.status} t={t} />
          </View>
          <Bubble author={t.customer} text={message.message} />
          {(message.replies ?? []).map((reply) => (
            <Bubble key={reply.id} author={reply.author === "admin" ? t.admin : t.customer} text={reply.message} admin={reply.author === "admin"} />
          ))}
          <LabeledInput
            label={t.replyInChat}
            value={drafts[message.id] ?? ""}
            onChangeText={(value) => setDrafts((current) => ({ ...current, [message.id]: value }))}
            multiline
          />
          <View style={styles.actionRow}>
            <PrimaryButton label={t.sendReply} onPress={() => sendReply(message)} small />
            <SecondaryButton label={t.done} onPress={() => markDone(message)} small />
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
  t,
}: {
  quotes: QuoteLead[];
  markDone: (quote: QuoteLead) => Promise<void>;
  refresh: () => Promise<void>;
  t: Translations;
}) {
  return (
    <View style={styles.stack}>
      <View style={styles.rowBetween}>
        <Text style={styles.screenTitle}>{t.tabs.quotes}</Text>
        <SecondaryButton label={t.refresh} onPress={refresh} small />
      </View>
      {quotes.length === 0 ? <EmptyState text={t.noQuoteRequests} /> : null}
      {quotes.map((quote) => (
        <View style={styles.card} key={quote.id}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>{quote.name}</Text>
            <StatusPill status={quote.status} t={t} />
          </View>
          <Text style={styles.bodyText}>{quote.message}</Text>
          <Text style={styles.muted}>{quote.phone}</Text>
          <Text style={styles.muted}>{quote.email || t.noEmail}</Text>
          <SecondaryButton label={t.done} onPress={() => markDone(quote)} />
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
  t,
}: {
  admins: AdminInfo[];
  email: string;
  password: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  addAdmin: () => Promise<void>;
  deleteAdmin: (admin: AdminInfo) => Promise<void>;
  t: Translations;
}) {
  return (
    <View style={styles.stack}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t.addAdmin}</Text>
        <LabeledInput label={t.adminEmail} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <LabeledInput label={t.adminPassword} value={password} onChangeText={setPassword} secureTextEntry />
        <PrimaryButton label={t.addAdmin} onPress={addAdmin} disabled={!email.trim() || !password.trim()} />
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t.tabs.admins}</Text>
        {admins.map((admin) => (
          <View style={styles.adminRow} key={admin.email}>
            <View style={styles.flex}>
              <Text style={styles.bodyText}>{admin.email}</Text>
              <Text style={styles.muted}>{t.created} {new Date(admin.createdAt).toLocaleDateString()}</Text>
            </View>
            <DangerButton label={t.delete} onPress={() => deleteAdmin(admin)} />
          </View>
        ))}
      </View>
    </View>
  );
}

function LanguageSwitch({
  language,
  t,
  onChange,
  compact = false,
}: {
  language: Language;
  t: Translations;
  onChange: (language: Language) => void;
  compact?: boolean;
}) {
  return (
    <View style={[styles.languageSwitch, compact && styles.compactLanguageSwitch]}>
      {(["de", "ar"] as Language[]).map((item) => (
        <Pressable
          key={item}
          style={[styles.languageButton, language === item && styles.activeLanguageButton]}
          onPress={() => onChange(item)}
        >
          <Text style={[styles.languageText, language === item && styles.activeLanguageText]}>
            {item === "de" ? t.langGerman : t.langArabic}
          </Text>
        </Pressable>
      ))}
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

function StatusPill({ status, t }: { status: keyof Translations["statusMap"]; t: Translations }) {
  return (
    <View style={[styles.statusPill, status === "new" && styles.statusNew]}>
      <Text style={styles.statusText}>{t.statusMap[status]}</Text>
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
  topbarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  languageSwitch: {
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 16,
    padding: 4,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  compactLanguageSwitch: {
    alignSelf: "center",
  },
  languageButton: {
    minHeight: 34,
    minWidth: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingHorizontal: 10,
  },
  activeLanguageButton: {
    backgroundColor: "#38bdf8",
  },
  languageText: {
    color: "rgba(248,250,252,0.76)",
    fontWeight: "900",
  },
  activeLanguageText: {
    color: "#07111f",
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
