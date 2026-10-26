import React, { createContext, useContext, useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import {
  ActionBar,
  Badge,
  BrandLine,
  Button,
  Card,
  Chips,
  colors,
  Empty,
  Field,
  Icon,
  keyboardDoneId,
  ListRow,
  Screen,
  SectionTitle,
  Segmented,
  styles as ui,
  tint,
  type IconName,
} from "../ui";
import type { Translations } from "./i18n";
import type { AdminInfo, ChatMessage, CmsContent, Language, ProjectCard, QuoteLead, ServiceItem } from "./types";

export type AdminTab = "home" | "website" | "inbox" | "finance" | "more";

export type AdminRoute =
  | { name: "contact" }
  | { name: "liveSettings" }
  | { name: "services" }
  | { name: "service"; index: number }
  | { name: "projects" }
  | { name: "project"; index: number }
  | { name: "before" }
  | { name: "chat"; id: string }
  | { name: "admins" };

export type AdminContextValue = {
  t: Translations;
  language: Language;
  changeLanguage: (language: Language) => void;
  email: string;
  baseURL: string;
  content: CmsContent | null;
  update: (updater: (draft: CmsContent) => void) => void;
  dirty: boolean;
  saveContent: () => Promise<void>;
  uploadImage: (onUploaded: (url: string) => void) => Promise<void>;
  loading: boolean;
  messages: ChatMessage[];
  quotes: QuoteLead[];
  sendReply: (message: ChatMessage, text: string) => Promise<boolean>;
  markMessage: (message: ChatMessage) => Promise<void>;
  markQuote: (quote: QuoteLead) => Promise<void>;
  admins: AdminInfo[];
  addAdmin: (email: string, password: string) => Promise<boolean>;
  deleteAdmin: (admin: AdminInfo) => Promise<void>;
  logout: () => void;
  push: (route: AdminRoute) => void;
  back: () => void;
  setTab: (tab: AdminTab) => void;
};

export const AdminContext = createContext<AdminContextValue | null>(null);

function useAdmin() {
  const value = useContext(AdminContext);
  if (!value) throw new Error("AdminContext missing");
  return value;
}

export const iconOptions = [
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

export function normalizeBaseURL(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function imageUri(value: string, baseURL: string) {
  if (!value) return "";
  if (/^(https?:|data:|file:)/.test(value)) return value;
  return `${normalizeBaseURL(baseURL)}${value.startsWith("/") ? value : `/${value}`}`;
}

function timeAgo(iso: string, language: Language) {
  const date = new Date(iso);
  return date.toLocaleString(language === "ar" ? "ar" : "de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/** Website screens share one save bar that only appears when something changed. */
function PublishBar() {
  const { t, dirty, saveContent, loading } = useAdmin();
  if (!dirty) return null;
  return (
    <ActionBar hint={t.unsaved}>
      <Button label={t.publish} icon="cloud-upload" onPress={saveContent} disabled={loading} style={ui.flex} />
    </ActionBar>
  );
}

export function LoginScreen({
  t,
  language,
  changeLanguage,
  baseURL,
  setBaseURL,
  email,
  setEmail,
  password,
  setPassword,
  login,
  loading,
  message,
}: {
  t: Translations;
  language: Language;
  changeLanguage: (language: Language) => void;
  baseURL: string;
  setBaseURL: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  login: () => void;
  loading: boolean;
  message: string;
}) {
  const [advanced, setAdvanced] = useState(false);
  return (
    <ScrollView
      contentContainerStyle={local.login}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets
    >
      <View style={local.loginTop}>
        <Text style={local.eyebrow}>IBO ADMIN</Text>
        <LanguagePicker language={language} onChange={changeLanguage} compact />
      </View>
      <View style={{ gap: 12 }}>
        <Text style={local.loginTitle}>{t.controlCenter}</Text>
        <BrandLine />
        <Text style={local.loginSubtitle}>{t.loginSubtitle}</Text>
      </View>
      <Card>
        <Field label={t.adminEmail} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" textContentType="username" />
        <Field label={t.password} value={password} onChangeText={setPassword} secureTextEntry textContentType="password" />
        <Button label={t.signIn} icon="log-in-outline" onPress={login} disabled={loading || !email || !password} />
        {message ? <Text style={local.loginMessage}>{message}</Text> : null}
      </Card>
      <Pressable onPress={() => setAdvanced((value) => !value)} style={local.advancedToggle}>
        <Icon name={advanced ? "chevron-down" : "chevron-forward"} size={16} color={colors.faint} />
        <Text style={local.advancedText}>{t.advanced}</Text>
      </Pressable>
      {advanced ? <Field label={t.serverUrl} value={baseURL} onChangeText={setBaseURL} autoCapitalize="none" keyboardType="url" /> : null}
    </ScrollView>
  );
}

function LanguagePicker({ language, onChange, compact }: { language: Language; onChange: (language: Language) => void; compact?: boolean }) {
  const options: { value: Language; label: string }[] = [
    { value: "de", label: "Deutsch" },
    { value: "ar", label: "العربية" },
  ];
  if (!compact) return <Segmented options={options} value={language} onChange={onChange} />;
  return (
    <View style={local.langCompact}>
      {options.map((option) => (
        <Pressable key={option.value} onPress={() => onChange(option.value)} style={[local.langChip, language === option.value && local.langChipActive]}>
          <Text style={[local.langText, language === option.value && local.langTextActive]}>{option.value.toUpperCase()}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function HomeScreen() {
  const { t, email, content, messages, quotes, setTab, push } = useAdmin();
  const newChats = messages.filter((item) => item.status === "new").length;
  const newQuotes = quotes.filter((item) => item.status === "new").length;
  const siteUrl = content?.company.url;

  return (
    <Screen title={t.greeting} subtitle={email}>
      <Card dark style={local.hero}>
        <Pressable style={local.heroStat} onPress={() => setTab("inbox")}>
          <Text style={local.heroValue}>{newChats}</Text>
          <Text style={local.heroLabel}>{t.newChats}</Text>
        </Pressable>
        <View style={local.heroDivider} />
        <Pressable style={local.heroStat} onPress={() => setTab("inbox")}>
          <Text style={local.heroValue}>{newQuotes}</Text>
          <Text style={local.heroLabel}>{t.newQuotes}</Text>
        </Pressable>
      </Card>

      <SectionTitle>{t.shortcuts}</SectionTitle>
      <View style={local.tiles}>
        <Tile icon="create-outline" label={t.editWebsite} hint={t.count(content?.services.length ?? 0, t.services, t.services)} onPress={() => setTab("website")} />
        <Tile icon="chatbubbles-outline" label={t.openInbox} hint={`${newChats + newQuotes} ${t.statusMap.new}`} onPress={() => setTab("inbox")} />
        <Tile icon="wallet-outline" label={t.openFinance} hint={t.openFinanceHint} onPress={() => setTab("finance")} accent />
        <Tile icon="images-outline" label={t.projects} hint={t.count(content?.projects.length ?? 0, t.projects, t.projects)} onPress={() => { setTab("website"); push({ name: "projects" }); }} />
      </View>

      {siteUrl ? (
        <Card>
          <ListRow icon="globe-outline" iconTone="dark" title={t.viewWebsite} subtitle={siteUrl.replace(/^https?:\/\//, "")} onPress={() => Linking.openURL(siteUrl)} chevron />
        </Card>
      ) : null}
    </Screen>
  );
}

function Tile({ icon, label, hint, onPress, accent }: { icon: IconName; label: string; hint: string; onPress: () => void; accent?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [local.tile, accent && local.tileAccent, pressed && ui.pressed]}>
      <View style={[local.tileIcon, accent && { backgroundColor: tint.oak }]}>
        <Icon name={icon} size={22} color={accent ? "#D9B98C" : colors.emerald} />
      </View>
      <Text style={local.tileLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={local.tileHint} numberOfLines={1}>
        {hint}
      </Text>
    </Pressable>
  );
}

export function WebsiteScreen() {
  const { t, content, push } = useAdmin();
  if (!content) {
    return (
      <Screen title={t.tabs.website}>
        <Empty icon="cloud-offline-outline" title={t.tabs.website} text={t.status.loading} />
      </Screen>
    );
  }
  return (
    <Screen title={t.tabs.website} subtitle={content.company.name} footer={<PublishBar />}>
      <Card>
        <ListRow icon="call-outline" iconTone="dark" title={t.sections.contact} subtitle={t.sections.contactHint} onPress={() => push({ name: "contact" })} chevron />
        <ListRow icon="toggle-outline" iconTone="dark" title={t.sections.settings} subtitle={t.sections.settingsHint} onPress={() => push({ name: "liveSettings" })} chevron />
      </Card>
      <Card>
        <ListRow icon="brush-outline" iconTone="dark" title={t.sections.services} subtitle={t.count(content.services.length, t.services, t.services)} onPress={() => push({ name: "services" })} chevron />
        <ListRow icon="images-outline" iconTone="dark" title={t.sections.projects} subtitle={t.count(content.projects.length, t.projects, t.projects)} onPress={() => push({ name: "projects" })} chevron />
        <ListRow icon="git-compare-outline" iconTone="dark" title={t.sections.before} subtitle={t.sections.beforeHint} onPress={() => push({ name: "before" })} chevron />
      </Card>
    </Screen>
  );
}

export function ContactScreen() {
  const { t, content, update, back } = useAdmin();
  if (!content) return null;
  const company = content.company;
  return (
    <Screen title={t.sections.contact} onBack={back} footer={<PublishBar />}>
      <Card>
        <Field label={t.companyName} value={company.name} onChangeText={(value) => update((draft) => { draft.company.name = value; })} />
        <Field label={t.legalName} value={company.legalName} onChangeText={(value) => update((draft) => { draft.company.legalName = value; })} />
        <Field label={t.tagline} value={company.tagline} onChangeText={(value) => update((draft) => { draft.company.tagline = value; })} />
        <Field label={t.address} value={company.address} onChangeText={(value) => update((draft) => { draft.company.address = value; })} multiline />
      </Card>
      <Card>
        <Field label={t.phoneVisible} value={company.phone} keyboardType="phone-pad" onChangeText={(value) => update((draft) => { draft.company.phone = value; draft.company.phoneHref = `tel:${value.replace(/[^\d+]/g, "")}`; })} />
        <Field label={t.whatsappNumber} value={company.whatsapp} keyboardType="phone-pad" onChangeText={(value) => update((draft) => { draft.company.whatsapp = value; })} />
        <Field label={t.email} value={company.email} keyboardType="email-address" autoCapitalize="none" onChangeText={(value) => update((draft) => { draft.company.email = value; draft.company.emailHref = `mailto:${value}`; })} />
        <Field label={t.websiteUrl} value={company.url} keyboardType="url" autoCapitalize="none" onChangeText={(value) => update((draft) => { draft.company.url = value; })} />
      </Card>
    </Screen>
  );
}

export function LiveSettingsScreen() {
  const { t, content, update, back, baseURL, uploadImage } = useAdmin();
  if (!content) return null;
  const settings = content.settings;
  return (
    <Screen title={t.sections.settings} onBack={back} footer={<PublishBar />}>
      <Card>
        <ToggleRow icon="logo-whatsapp" label={t.whatsappFloating} value={settings.whatsappFloating} onChange={(value) => update((draft) => { draft.settings.whatsappFloating = value; })} />
        <ToggleRow icon="chatbubble-ellipses-outline" label={t.chatWidget} value={settings.chatEnabled} onChange={(value) => update((draft) => { draft.settings.chatEnabled = value; })} />
        <ToggleRow icon="document-text-outline" label={t.quoteForm} value={settings.quoteEnabled} onChange={(value) => update((draft) => { draft.settings.quoteEnabled = value; })} />
        <ToggleRow icon="git-compare-outline" label={t.beforeAfterSection} value={settings.beforeAfterEnabled} onChange={(value) => update((draft) => { draft.settings.beforeAfterEnabled = value; })} />
      </Card>
      <Card>
        <Field label={t.chatGreeting} value={settings.chatGreeting} onChangeText={(value) => update((draft) => { draft.settings.chatGreeting = value; })} multiline />
      </Card>
      <ImageCard
        label={t.heroImage}
        value={settings.heroImage}
        baseURL={baseURL}
        onChange={(value) => update((draft) => { draft.settings.heroImage = value; })}
        onUpload={() => uploadImage((url) => update((draft) => { draft.settings.heroImage = url; }))}
      />
    </Screen>
  );
}

function ToggleRow({ icon, label, value, onChange }: { icon: IconName; label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <View style={local.toggleRow}>
      <View style={[ui.listIcon, { backgroundColor: tint.blue }]}>
        <Icon name={icon} size={18} color={colors.emerald} />
      </View>
      <Text style={[ui.listTitle, ui.flex]}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.emerald, false: "rgba(255,255,255,0.12)" }} />
    </View>
  );
}

function ImageCard({ label, value, baseURL, onChange, onUpload }: { label: string; value: string; baseURL: string; onChange: (value: string) => void; onUpload: () => void }) {
  const { t } = useAdmin();
  const [showUrl, setShowUrl] = useState(false);
  const uri = imageUri(value, baseURL);
  return (
    <Card>
      <SectionTitle>{label}</SectionTitle>
      {uri ? (
        <Image source={{ uri }} style={local.imagePreview} resizeMode="cover" />
      ) : (
        <View style={[local.imagePreview, local.imageEmpty]}>
          <Icon name="image-outline" size={30} color={colors.faint} />
          <Text style={ui.listSubtitle}>{t.noImage}</Text>
        </View>
      )}
      <Button label={t.uploadImage} icon="image-outline" tone="secondary" onPress={onUpload} />
      <Pressable onPress={() => setShowUrl((current) => !current)} style={local.advancedToggle}>
        <Icon name={showUrl ? "chevron-down" : "chevron-forward"} size={16} color={colors.faint} />
        <Text style={local.advancedText}>{t.imageUrl}</Text>
      </Pressable>
      {showUrl ? <Field label={t.imageUrl} value={value} onChangeText={onChange} autoCapitalize="none" keyboardType="url" /> : null}
    </Card>
  );
}

export function ServicesScreen({ onAdd }: { onAdd: () => void }) {
  const { t, content, back, push } = useAdmin();
  if (!content) return null;
  return (
    <Screen title={t.sections.services} onBack={back} footer={<PublishBar />}>
      <Button label={t.addService} icon="add" tone="secondary" onPress={onAdd} />
      <Card>
        {content.services.map((service, index) => (
          <ListRow key={`${service.slug}-${index}`} icon="brush-outline" iconTone="dark" title={service.title} subtitle={service.short} onPress={() => push({ name: "service", index })} chevron />
        ))}
      </Card>
    </Screen>
  );
}

export function ServiceEditorScreen({ index }: { index: number }) {
  const { t, content, update, back, baseURL, uploadImage } = useAdmin();
  const service = content?.services[index];
  if (!service) return null;
  const set = (updater: (draft: ServiceItem) => void) => update((draft) => updater(draft.services[index]));
  return (
    <Screen title={service.title || t.sections.services} onBack={back} footer={<PublishBar />}>
      <Card>
        <SectionTitle>{t.content}</SectionTitle>
        <Field label={t.titleLabel} value={service.title} onChangeText={(value) => set((draft) => { draft.title = value; })} />
        <Field label={t.eyebrow} value={service.eyebrow} onChangeText={(value) => set((draft) => { draft.eyebrow = value; })} />
        <Field label={t.shortText} value={service.short} onChangeText={(value) => set((draft) => { draft.short = value; })} multiline />
        <Field label={t.summary} value={service.summary} onChangeText={(value) => set((draft) => { draft.summary = value; })} multiline />
        <Field
          label={t.highlights}
          value={service.highlights.join("\n")}
          onChangeText={(value) => set((draft) => { draft.highlights = value.split("\n").filter(Boolean); })}
          multiline
        />
      </Card>
      <ImageCard
        label={t.image}
        value={service.image}
        baseURL={baseURL}
        onChange={(value) => set((draft) => { draft.image = value; })}
        onUpload={() => uploadImage((url) => set((draft) => { draft.image = url; }))}
      />
      <Card>
        <SectionTitle>{t.icon}</SectionTitle>
        <Chips options={iconOptions.map((value) => ({ value, label: value }))} value={service.iconName} onChange={(value) => set((draft) => { draft.iconName = value; })} />
      </Card>
      <Card>
        <SectionTitle>{t.seo}</SectionTitle>
        <Field label={t.slug} value={service.slug} autoCapitalize="none" onChangeText={(value) => set((draft) => { draft.slug = value; })} />
        <Field label={t.seoTitle} value={service.seoTitle} onChangeText={(value) => set((draft) => { draft.seoTitle = value; })} />
        <Field label={t.seoDescription} value={service.seoDescription} onChangeText={(value) => set((draft) => { draft.seoDescription = value; })} multiline />
      </Card>
      <Button
        label={t.delete}
        icon="trash-outline"
        tone="danger"
        onPress={() =>
          Alert.alert(t.deleteItemTitle, t.deleteItemText, [
            { text: t.cancel, style: "cancel" },
            { text: t.delete, style: "destructive", onPress: () => { back(); update((draft) => { draft.services.splice(index, 1); }); } },
          ])
        }
      />
    </Screen>
  );
}

export function ProjectsScreen({ onAdd }: { onAdd: () => void }) {
  const { t, content, back, push, baseURL } = useAdmin();
  if (!content) return null;
  return (
    <Screen title={t.sections.projects} onBack={back} footer={<PublishBar />}>
      <Button label={t.addProject} icon="add" tone="secondary" onPress={onAdd} />
      <View style={local.projectGrid}>
        {content.projects.map((project, index) => (
          <Pressable key={`${project.title}-${index}`} style={({ pressed }) => [local.projectTile, pressed && ui.pressed]} onPress={() => push({ name: "project", index })}>
            {project.image ? <Image source={{ uri: imageUri(project.image, baseURL) }} style={local.projectImage} /> : <View style={[local.projectImage, local.imageEmpty]} />}
            <Text style={local.projectTitle} numberOfLines={1}>
              {project.title}
            </Text>
            <Text style={ui.listSubtitle} numberOfLines={1}>
              {project.category}
            </Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

export function ProjectEditorScreen({ index }: { index: number }) {
  const { t, content, update, back, baseURL, uploadImage } = useAdmin();
  const project = content?.projects[index];
  if (!project) return null;
  const set = (updater: (draft: ProjectCard) => void) => update((draft) => updater(draft.projects[index]));
  return (
    <Screen title={project.title || t.sections.projects} onBack={back} footer={<PublishBar />}>
      <ImageCard
        label={t.image}
        value={project.image}
        baseURL={baseURL}
        onChange={(value) => set((draft) => { draft.image = value; })}
        onUpload={() => uploadImage((url) => set((draft) => { draft.image = url; }))}
      />
      <Card>
        <Field label={t.titleLabel} value={project.title} onChangeText={(value) => set((draft) => { draft.title = value; })} />
        <Field label={t.category} value={project.category} onChangeText={(value) => set((draft) => { draft.category = value; })} />
        <Field label={t.textLabel} value={project.text} onChangeText={(value) => set((draft) => { draft.text = value; })} multiline />
      </Card>
      <Button
        label={t.delete}
        icon="trash-outline"
        tone="danger"
        onPress={() =>
          Alert.alert(t.deleteItemTitle, t.deleteItemText, [
            { text: t.cancel, style: "cancel" },
            { text: t.delete, style: "destructive", onPress: () => { back(); update((draft) => { draft.projects.splice(index, 1); }); } },
          ])
        }
      />
    </Screen>
  );
}

export function BeforeAfterScreen() {
  const { t, content, update, back, baseURL, uploadImage } = useAdmin();
  if (!content) return null;
  const section = content.beforeAfter;
  return (
    <Screen title={t.sections.before} onBack={back} footer={<PublishBar />}>
      <ImageCard
        label={t.image}
        value={section.afterImage}
        baseURL={baseURL}
        onChange={(value) => update((draft) => { draft.beforeAfter.afterImage = value; })}
        onUpload={() => uploadImage((url) => update((draft) => { draft.beforeAfter.afterImage = url; }))}
      />
      <Card>
        <Field label={t.titleLabel} value={section.title} onChangeText={(value) => update((draft) => { draft.beforeAfter.title = value; })} multiline />
        <Field label={t.textLabel} value={section.text} onChangeText={(value) => update((draft) => { draft.beforeAfter.text = value; })} multiline />
        <View style={ui.row}>
          <Field label={t.beforeLabel} value={section.beforeLabel} onChangeText={(value) => update((draft) => { draft.beforeAfter.beforeLabel = value; })} style={ui.flex} />
          <Field label={t.afterLabel} value={section.afterLabel} onChangeText={(value) => update((draft) => { draft.beforeAfter.afterLabel = value; })} style={ui.flex} />
        </View>
      </Card>
    </Screen>
  );
}

export function InboxScreen() {
  const { t, messages, quotes, push, markQuote, language } = useAdmin();
  const [segment, setSegment] = useState<"chats" | "quotes">("chats");
  const newChats = messages.filter((item) => item.status === "new").length;
  const newQuotes = quotes.filter((item) => item.status === "new").length;
  const sortedChats = [...messages].sort((a, b) => lastActivity(b).localeCompare(lastActivity(a)));
  const sortedQuotes = [...quotes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <Screen title={t.tabs.inbox}>
      <Segmented
        options={[
          { value: "chats", label: newChats ? `${t.chats} · ${newChats}` : t.chats },
          { value: "quotes", label: newQuotes ? `${t.quotes} · ${newQuotes}` : t.quotes },
        ]}
        value={segment}
        onChange={setSegment}
      />
      {segment === "chats" ? (
        <Card>
          {sortedChats.length ? (
            sortedChats.map((message) => {
              const last = message.replies?.[message.replies.length - 1];
              return (
                <ListRow
                  key={message.id}
                  icon={message.status === "new" ? "chatbubble-ellipses" : "chatbubble-outline"}
                  iconTone={message.status === "new" ? "dark" : "mint"}
                  title={message.name}
                  subtitle={`${last?.author === "admin" ? `${t.you}: ` : ""}${last?.message ?? message.message}`}
                  rightSub={message.status === "new" ? <Badge label={t.statusMap.new} tone="warning" /> : <Text style={ui.listSubtitle}>{timeAgo(lastActivity(message), language)}</Text>}
                  onPress={() => push({ name: "chat", id: message.id })}
                />
              );
            })
          ) : (
            <Empty icon="chatbubbles-outline" title={t.chats} text={t.noChats} />
          )}
        </Card>
      ) : sortedQuotes.length ? (
        sortedQuotes.map((quote) => (
          <Card key={quote.id}>
            <View style={ui.keyValue}>
              <View style={ui.flex}>
                <Text style={ui.listTitle}>{quote.name}</Text>
                <Text style={ui.listSubtitle}>{timeAgo(quote.createdAt, language)}</Text>
              </View>
              <Badge label={t.statusMap[quote.status]} tone={quote.status === "new" ? "warning" : quote.status === "done" ? "success" : "neutral"} />
            </View>
            <Text style={local.bodyText}>{quote.message}</Text>
            <View style={ui.row}>
              {quote.phone ? <Button label={t.call} icon="call" tone="secondary" onPress={() => Linking.openURL(`tel:${quote.phone.replace(/\s/g, "")}`)} style={ui.flex} /> : null}
              {quote.email ? <Button label={t.email} icon="mail" tone="secondary" onPress={() => Linking.openURL(`mailto:${quote.email}`)} style={ui.flex} /> : null}
            </View>
            {quote.status !== "done" ? <Button label={t.markDone} icon="checkmark" tone="ghost" onPress={() => markQuote(quote)} /> : null}
          </Card>
        ))
      ) : (
        <Card>
          <Empty icon="document-text-outline" title={t.quotes} text={t.noQuotes} />
        </Card>
      )}
    </Screen>
  );
}

function lastActivity(message: ChatMessage) {
  return message.replies?.[message.replies.length - 1]?.createdAt ?? message.createdAt;
}

export function ConversationScreen({ id }: { id: string }) {
  const { t, messages, back, sendReply, markMessage, language } = useAdmin();
  const [draft, setDraft] = useState("");
  const message = messages.find((item) => item.id === id);
  if (!message) return null;
  const thread = [
    { id: message.id, admin: false, text: message.message, at: message.createdAt },
    ...(message.replies ?? []).map((reply) => ({ id: reply.id, admin: reply.author === "admin", text: reply.message, at: reply.createdAt })),
  ];

  return (
    <KeyboardAvoidingView style={ui.flex} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 44 : 0}>
      <Screen
        title={message.name}
        subtitle={message.email || t.noEmail}
        onBack={back}
        right={
          message.status !== "done" ? (
            <Pressable onPress={() => markMessage(message)} style={local.doneChip} hitSlop={8}>
              <Icon name="checkmark" size={16} color={colors.success} />
              <Text style={local.doneChipText}>{t.done}</Text>
            </Pressable>
          ) : undefined
        }
        footer={
          <View style={local.composer}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={t.replyPlaceholder}
              placeholderTextColor={colors.faint}
              keyboardAppearance="dark"
              multiline
              style={local.composerInput}
              inputAccessoryViewID={keyboardDoneId}
            />
            <Pressable
              accessibilityLabel={t.replyPlaceholder}
              disabled={!draft.trim()}
              onPress={async () => {
                if (await sendReply(message, draft.trim())) setDraft("");
              }}
              style={[local.sendButton, !draft.trim() && ui.disabled]}
            >
              <Icon name="arrow-up" size={20} color={colors.onPrimary} />
            </Pressable>
          </View>
        }
      >
        {thread.map((entry) => (
          <View key={entry.id} style={[local.bubble, entry.admin ? local.bubbleMine : local.bubbleTheirs]}>
            <Text style={local.bubbleText}>{entry.text}</Text>
            <Text style={local.bubbleMeta}>{`${entry.admin ? t.you : t.customer} · ${timeAgo(entry.at, language)}`}</Text>
          </View>
        ))}
      </Screen>
    </KeyboardAvoidingView>
  );
}

export function MoreScreen() {
  const { t, email, language, changeLanguage, logout, push, admins, baseURL } = useAdmin();
  return (
    <Screen title={t.tabs.more}>
      <Card>
        <SectionTitle>{t.account}</SectionTitle>
        <ListRow icon="person-circle-outline" iconTone="dark" title={email} subtitle={t.signedInAs} />
        <ListRow icon="people-outline" iconTone="dark" title={t.manageAdmins} subtitle={t.count(admins.length, t.admins, t.admins)} onPress={() => push({ name: "admins" })} chevron />
      </Card>
      <Card>
        <SectionTitle>{t.language}</SectionTitle>
        <LanguagePicker language={language} onChange={changeLanguage} />
      </Card>
      <Card>
        <SectionTitle>{t.connection}</SectionTitle>
        <ListRow icon="server-outline" title={baseURL.replace(/^https?:\/\//, "")} subtitle={t.serverUrl} />
      </Card>
      <Button label={t.logout} icon="log-out-outline" tone="danger" onPress={logout} />
    </Screen>
  );
}

export function AdminsScreen() {
  const { t, admins, addAdmin, deleteAdmin, back, email: currentEmail, language } = useAdmin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <Screen title={t.admins} onBack={back}>
      <Card>
        {admins.map((admin) => (
          <ListRow
            key={admin.email}
            icon="person-outline"
            iconTone="dark"
            title={admin.email}
            subtitle={`${t.created} ${new Date(admin.createdAt).toLocaleDateString(language === "ar" ? "ar" : "de-DE")}`}
            right={
              admin.email !== currentEmail ? (
                <Pressable
                  hitSlop={10}
                  onPress={() =>
                    Alert.alert(t.deleteItemTitle, admin.email, [
                      { text: t.cancel, style: "cancel" },
                      { text: t.delete, style: "destructive", onPress: () => deleteAdmin(admin) },
                    ])
                  }
                >
                  <Icon name="trash-outline" size={20} color={colors.danger} />
                </Pressable>
              ) : undefined
            }
          />
        ))}
      </Card>
      <Card>
        <SectionTitle>{t.addAdmin}</SectionTitle>
        <Field label={t.adminEmail} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Field label={t.adminPassword} value={password} onChangeText={setPassword} secureTextEntry textContentType="newPassword" />
        <Button
          label={t.addAdmin}
          icon="person-add-outline"
          disabled={!email.trim() || password.length < 8}
          onPress={async () => {
            if (await addAdmin(email.trim(), password)) {
              setEmail("");
              setPassword("");
            }
          }}
        />
      </Card>
    </Screen>
  );
}

const local = StyleSheet.create({
  login: { flexGrow: 1, justifyContent: "center", gap: 22, padding: 22, backgroundColor: colors.night },
  loginTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  eyebrow: { color: colors.emerald, fontSize: 13, fontWeight: "700", letterSpacing: 1 },
  loginTitle: { color: colors.text, fontSize: 38, fontWeight: "800", letterSpacing: -0.6 },
  loginSubtitle: { color: colors.muted, fontSize: 16, lineHeight: 23 },
  loginMessage: { color: colors.muted, textAlign: "center" },
  advancedToggle: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  advancedText: { color: colors.faint, fontSize: 14, fontWeight: "600" },
  langCompact: { flexDirection: "row", gap: 4, backgroundColor: colors.mint, borderRadius: 999, padding: 3 },
  langChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  langChipActive: { backgroundColor: tint.blue },
  langText: { color: colors.muted, fontWeight: "700", fontSize: 12 },
  langTextActive: { color: colors.emerald },
  hero: { flexDirection: "row", alignItems: "center", paddingVertical: 20 },
  heroStat: { flex: 1, alignItems: "center", gap: 4 },
  heroValue: { color: colors.text, fontSize: 40, fontWeight: "800" },
  heroLabel: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  heroDivider: { width: 1, alignSelf: "stretch", backgroundColor: colors.border },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 6,
  },
  tileAccent: { borderColor: "rgba(184,149,103,0.4)" },
  tileIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: tint.blue, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  tileLabel: { color: colors.text, fontSize: 16, fontWeight: "700" },
  tileHint: { color: colors.muted, fontSize: 13 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 52 },
  imagePreview: { width: "100%", height: 180, borderRadius: 14, backgroundColor: colors.charcoal },
  imageEmpty: { alignItems: "center", justifyContent: "center", gap: 6 },
  projectGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  projectTile: { flexBasis: "47%", flexGrow: 1, gap: 4 },
  projectImage: { width: "100%", aspectRatio: 1.2, borderRadius: 16, backgroundColor: colors.charcoal, marginBottom: 4 },
  projectTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  bodyText: { color: colors.text, fontSize: 15, lineHeight: 22 },
  bubble: { maxWidth: "86%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, gap: 4 },
  bubbleTheirs: { alignSelf: "flex-start", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 6 },
  bubbleMine: { alignSelf: "flex-end", backgroundColor: tint.blue, borderBottomRightRadius: 6 },
  bubbleText: { color: colors.text, fontSize: 16, lineHeight: 22 },
  bubbleMeta: { color: colors.faint, fontSize: 11 },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.night,
  },
  composerInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 130,
    borderRadius: 22,
    backgroundColor: colors.mint,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    color: colors.text,
    fontSize: 16,
  },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.emerald, alignItems: "center", justifyContent: "center" },
  doneChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: tint.success, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  doneChipText: { color: colors.success, fontWeight: "700", fontSize: 13 },
});
