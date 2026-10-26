import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Keyboard, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";
import {
  AdminContext,
  AdminsScreen,
  BeforeAfterScreen,
  ContactScreen,
  ConversationScreen,
  HomeScreen,
  InboxScreen,
  LiveSettingsScreen,
  LoginScreen,
  MoreScreen,
  normalizeBaseURL,
  ProjectEditorScreen,
  ProjectsScreen,
  ServiceEditorScreen,
  ServicesScreen,
  WebsiteScreen,
  type AdminContextValue,
  type AdminRoute,
  type AdminTab,
} from "./src/admin/screens";
import { translations } from "./src/admin/i18n";
import type { AdminInfo, ChatMessage, CmsContent, Language, ProjectCard, QuoteLead, ServiceItem } from "./src/admin/types";
import { AccountingApp } from "./src/accounting/AccountingApp";
import { colors, Icon, KeyboardDoneBar, type IconName } from "./src/ui";

const defaultBaseURL = "https://raumwerkpro.de";
const fallbackBaseURL: string = "https://ibo-creative.vercel.app";

const storageKeys = {
  baseURL: "ibo-admin-expo-base-url",
  email: "ibo-admin-expo-email",
  language: "ibo-admin-expo-language",
  token: "ibo-admin-expo-token",
};

function emptyService(): ServiceItem {
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
    seoDescription: "SEO-Beschreibung der neuen Leistung.",
  };
}

function emptyProject(): ProjectCard {
  return {
    title: "Neues Projekt",
    category: "Kategorie",
    image: "/images/ibo-hero.png",
    text: "Kurze Projektbeschreibung.",
  };
}

const tabs: { key: AdminTab; icon: IconName; activeIcon: IconName }[] = [
  { key: "home", icon: "home-outline", activeIcon: "home" },
  { key: "website", icon: "globe-outline", activeIcon: "globe" },
  { key: "inbox", icon: "chatbubbles-outline", activeIcon: "chatbubbles" },
  { key: "finance", icon: "wallet-outline", activeIcon: "wallet" },
  { key: "more", icon: "ellipsis-horizontal-circle-outline", activeIcon: "ellipsis-horizontal-circle" },
];

export default function App() {
  const [language, setLanguage] = useState<Language>("de");
  const [baseURL, setBaseURL] = useState(defaultBaseURL);
  const [email, setEmail] = useState("ibrahimalnuaimi.ik@gmail.com");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [content, setContent] = useState<CmsContent | null>(null);
  const [savedContent, setSavedContent] = useState("");
  const [quotes, setQuotes] = useState<QuoteLead[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [admins, setAdmins] = useState<AdminInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const [tab, setTabState] = useState<AdminTab>("home");
  const [stack, setStack] = useState<AdminRoute[]>([]);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const t = translations[language];
  const authed = Boolean(token);
  const dirty = Boolean(content) && JSON.stringify(content) !== savedContent;
  const inboxBadge = messages.filter((item) => item.status === "new").length + quotes.filter((item) => item.status === "new").length;

  const showToast = useCallback((text: string, error = false) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ text, error });
    toastTimer.current = setTimeout(() => setToast(null), error ? 4000 : 2200);
  }, []);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardWillShow", () => setKeyboardOpen(true));
    const hide = Keyboard.addListener("keyboardWillHide", () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const changeLanguage = useCallback(async (value: Language) => {
    setLanguage(value);
    await SecureStore.setItemAsync(storageKeys.language, value);
  }, []);

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(storageKeys.token);
    setToken("");
    setContent(null);
    setSavedContent("");
    setMessages([]);
    setQuotes([]);
    setAdmins([]);
    setStack([]);
    setTabState("home");
  }, []);

  const request = useCallback(
    async <T,>(path: string, options: RequestInit = {}, requireToken = true): Promise<T> => {
      const headers = new Headers(options.headers);
      if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      headers.set("Accept", "application/json");
      if (requireToken && token) headers.set("Authorization", `Bearer ${token}`);

      const normalized = normalizeBaseURL(baseURL || defaultBaseURL);
      const urls = [`${normalized}${path}`];
      if (normalized === defaultBaseURL && fallbackBaseURL !== defaultBaseURL) urls.push(`${fallbackBaseURL}${path}`);

      let lastError: Error | null = null;
      for (const url of urls) {
        const isLast = url === urls[urls.length - 1];
        try {
          const response = await fetch(url, { ...options, headers });
          const text = await response.text();
          let data: Record<string, unknown> = {};
          if (text) {
            try {
              data = JSON.parse(text) as Record<string, unknown>;
            } catch {
              if (!isLast) continue;
              throw new Error(t.status.invalidServerResponse);
            }
          }
          if (response.status === 401 && requireToken) {
            // The session was revoked (e.g. a rotated server secret): return to the login screen.
            await signOut();
            throw new Error(t.status.signedOut);
          }
          if (!response.ok) {
            const message = typeof data.error === "string" ? data.error : text || t.status.requestFailed;
            if (!isLast && [404, 502, 503, 504].includes(response.status)) {
              lastError = new Error(message);
              continue;
            }
            throw new Error(message);
          }
          return data as T;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(t.status.requestFailed);
          if (isLast) break;
        }
      }
      throw lastError ?? new Error(t.status.requestFailed);
    },
    [baseURL, signOut, t.status.invalidServerResponse, t.status.requestFailed, t.status.signedOut, token],
  );

  /** Runs an action with a spinner toast; returns false when it failed. */
  const run = useCallback(
    async (label: string, action: () => Promise<string | void>) => {
      setLoading(true);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast({ text: label });
      try {
        const done = await action();
        if (done) showToast(done);
        else setToast(null);
        return true;
      } catch (error) {
        showToast(error instanceof Error ? error.message : t.status.requestFailed, true);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [showToast, t.status.requestFailed],
  );

  const loadAll = useCallback(async () => {
    const [loadedContent, loadedQuotes, loadedMessages, loadedAdmins] = await Promise.all([
      request<CmsContent>("/api/admin/content"),
      request<{ quotes: QuoteLead[] }>("/api/admin/quotes"),
      request<{ messages: ChatMessage[] }>("/api/admin/messages"),
      request<{ admins: AdminInfo[] }>("/api/admin/admins"),
    ]);
    setContent(loadedContent);
    setSavedContent(JSON.stringify(loadedContent));
    setQuotes(loadedQuotes.quotes);
    setMessages(loadedMessages.messages);
    setAdmins(loadedAdmins.admins);
  }, [request]);

  const refreshInbox = useCallback(async () => {
    try {
      const [loadedQuotes, loadedMessages] = await Promise.all([
        request<{ quotes: QuoteLead[] }>("/api/admin/quotes"),
        request<{ messages: ChatMessage[] }>("/api/admin/messages"),
      ]);
      setQuotes(loadedQuotes.quotes);
      setMessages(loadedMessages.messages);
    } catch {
      // Polling stays silent; explicit actions report their own errors.
    }
  }, [request]);

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
    void run(t.status.loading, loadAll);
    // Load once per session; language changes must not refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => void refreshInbox(), 5000);
    return () => clearInterval(interval);
  }, [refreshInbox, token]);

  const login = () =>
    run(t.status.signingIn, async () => {
      const result = await request<{ ok: boolean; email: string; token: string }>(
        "/api/admin/login",
        { method: "POST", body: JSON.stringify({ email: email.trim(), password }) },
        false,
      );
      await Promise.all([
        SecureStore.setItemAsync(storageKeys.baseURL, normalizeBaseURL(baseURL)),
        SecureStore.setItemAsync(storageKeys.email, result.email),
        SecureStore.setItemAsync(storageKeys.token, result.token),
      ]);
      setEmail(result.email);
      setPassword("");
      setToken(result.token);
    });

  const saveContent = useCallback(async () => {
    if (!content) return;
    await run(t.status.saving, async () => {
      const result = await request<{ ok: boolean; content: CmsContent }>("/api/admin/content", { method: "PUT", body: JSON.stringify(content) });
      setContent(result.content);
      setSavedContent(JSON.stringify(result.content));
      return t.status.saved;
    });
  }, [content, request, run, t.status.saved, t.status.saving]);

  const update = useCallback((updater: (draft: CmsContent) => void) => {
    setContent((current) => {
      if (!current) return current;
      const draft = JSON.parse(JSON.stringify(current)) as CmsContent;
      updater(draft);
      return draft;
    });
  }, []);

  const uploadImage = useCallback(
    async (onUploaded: (url: string) => void) => {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t.photoAccessTitle, t.photoAccessBody);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: false, mediaTypes: ["images"], quality: 0.85 });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      await run(t.status.uploading, async () => {
        const form = new FormData();
        form.append("file", { uri: asset.uri, name: asset.fileName ?? `image-${Date.now()}.jpg`, type: asset.mimeType ?? "image/jpeg" } as unknown as Blob);
        const response = await request<{ ok?: boolean; url?: string; error?: string }>("/api/admin/upload", { method: "POST", body: form });
        if (!response.url) throw new Error(response.error ?? t.status.uploadFailed);
        onUploaded(response.url);
        return t.status.uploaded;
      });
    },
    [request, run, t],
  );

  const push = useCallback((route: AdminRoute) => setStack((current) => [...current, route]), []);
  const back = useCallback(() => setStack((current) => current.slice(0, -1)), []);
  const setTab = useCallback((next: AdminTab) => {
    setStack([]);
    setTabState(next);
  }, []);

  const accountingServer = useMemo(
    () => (token ? { baseURL: normalizeBaseURL(baseURL || defaultBaseURL), token } : undefined),
    [baseURL, token],
  );

  const context: AdminContextValue = {
    t,
    language,
    changeLanguage,
    email,
    baseURL,
    content,
    update,
    dirty,
    saveContent,
    uploadImage,
    loading,
    messages,
    quotes,
    sendReply: (message, text) =>
      run(t.status.sending, async () => {
        const result = await request<{ ok: boolean; messages: ChatMessage[] }>("/api/admin/messages", {
          method: "PATCH",
          body: JSON.stringify({ id: message.id, reply: text }),
        });
        setMessages(result.messages);
        return t.status.sent;
      }),
    markMessage: async (message) => {
      await run(t.status.sending, async () => {
        const result = await request<{ ok: boolean; messages: ChatMessage[] }>("/api/admin/messages", {
          method: "PATCH",
          body: JSON.stringify({ id: message.id, status: "done" }),
        });
        setMessages(result.messages);
        return t.status.updated;
      });
    },
    markQuote: async (quote) => {
      await run(t.status.sending, async () => {
        const result = await request<{ ok: boolean; quotes: QuoteLead[] }>("/api/admin/quotes", {
          method: "PATCH",
          body: JSON.stringify({ id: quote.id, status: "done" }),
        });
        setQuotes(result.quotes);
        return t.status.updated;
      });
    },
    admins,
    addAdmin: (newEmail, newPassword) =>
      run(t.status.sending, async () => {
        const result = await request<{ ok: boolean; admin: AdminInfo }>("/api/admin/admins", {
          method: "POST",
          body: JSON.stringify({ email: newEmail, password: newPassword }),
        });
        setAdmins((current) => [...current, result.admin]);
        return t.status.adminAdded;
      }),
    deleteAdmin: async (admin) => {
      await run(t.status.sending, async () => {
        await request<{ ok: boolean }>("/api/admin/admins", { method: "DELETE", body: JSON.stringify({ email: admin.email }) });
        setAdmins((current) => current.filter((item) => item.email !== admin.email));
        return t.status.adminDeleted;
      });
    },
    logout: () => void signOut(),
    push,
    back,
    setTab,
  };

  if (!authed) {
    return (
      <SafeAreaView style={local.safe}>
        <StatusBar barStyle="light-content" />
        <LoginScreen
          t={t}
          language={language}
          changeLanguage={changeLanguage}
          baseURL={baseURL}
          setBaseURL={setBaseURL}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          login={() => void login()}
          loading={loading}
          message={toast?.text ?? ""}
        />
        <KeyboardDoneBar />
      </SafeAreaView>
    );
  }

  if (tab === "finance") {
    return <AccountingApp onClose={() => setTab("home")} seed={content?.company} server={accountingServer} onUnauthorized={() => void signOut()} />;
  }

  const route = stack[stack.length - 1];
  const screen = (() => {
    switch (route?.name) {
      case "contact":
        return <ContactScreen />;
      case "liveSettings":
        return <LiveSettingsScreen />;
      case "services":
        return (
          <ServicesScreen
            onAdd={() => {
              update((draft) => { draft.services.unshift(emptyService()); });
              push({ name: "service", index: 0 });
            }}
          />
        );
      case "service":
        return <ServiceEditorScreen index={route.index} />;
      case "projects":
        return (
          <ProjectsScreen
            onAdd={() => {
              update((draft) => { draft.projects.unshift(emptyProject()); });
              push({ name: "project", index: 0 });
            }}
          />
        );
      case "project":
        return <ProjectEditorScreen index={route.index} />;
      case "before":
        return <BeforeAfterScreen />;
      case "chat":
        return <ConversationScreen id={route.id} />;
      case "admins":
        return <AdminsScreen />;
      default:
        switch (tab) {
          case "website":
            return <WebsiteScreen />;
          case "inbox":
            return <InboxScreen />;
          case "more":
            return <MoreScreen />;
          default:
            return <HomeScreen />;
        }
    }
  })();

  return (
    <AdminContext.Provider value={context}>
      <SafeAreaView style={local.safe}>
        <StatusBar barStyle="light-content" />
        <View style={local.flex}>{screen}</View>

        {!route && !keyboardOpen ? (
          <View style={local.tabBar}>
            {tabs.map((item) => {
              const active = tab === item.key;
              return (
                <Pressable key={item.key} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => setTab(item.key)} style={local.tab}>
                  <View>
                    <Icon name={active ? item.activeIcon : item.icon} size={24} color={active ? colors.emerald : colors.onDarkMuted} />
                    {item.key === "inbox" && inboxBadge ? (
                      <View style={local.badge}>
                        <Text style={local.badgeText}>{inboxBadge > 9 ? "9+" : inboxBadge}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[local.tabLabel, active && local.tabLabelActive]} numberOfLines={1}>
                    {t.tabs[item.key]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {toast ? (
          <View pointerEvents="none" style={local.toastWrap}>
            <View style={[local.toast, toast.error && local.toastError]}>
              {loading ? <ActivityIndicator size="small" color={colors.emerald} /> : <Icon name={toast.error ? "alert-circle" : "checkmark-circle"} size={18} color={toast.error ? colors.danger : colors.success} />}
              <Text style={local.toastText} numberOfLines={2}>
                {toast.text}
              </Text>
            </View>
          </View>
        ) : null}
        <KeyboardDoneBar />
      </SafeAreaView>
    </AdminContext.Provider>
  );
}

const local = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.night },
  flex: { flex: 1 },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.night,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingBottom: 4,
  },
  tab: { flex: 1, alignItems: "center", gap: 3 },
  tabLabel: { color: colors.onDarkMuted, fontSize: 11, fontWeight: "600" },
  tabLabelActive: { color: colors.emerald },
  badge: {
    position: "absolute",
    top: -4,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  toastWrap: { position: "absolute", top: 54, left: 0, right: 0, alignItems: "center" },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "88%",
    backgroundColor: colors.charcoal,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  toastError: { borderColor: "rgba(248,113,113,0.5)" },
  toastText: { color: colors.text, fontSize: 14, fontWeight: "600", flexShrink: 1 },
});
