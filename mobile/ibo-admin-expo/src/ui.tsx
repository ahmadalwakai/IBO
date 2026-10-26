import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { amountInput, formatDate, formatMoney, parseAmount } from "./accounting/calc";

/**
 * Brand tokens taken from the website (src/app/globals.css): deep navy, warm white,
 * sky blue for actions, purple and oak as accents, glass cards with fine lines.
 * The older key names (night, emerald, gold, …) are kept so screens read naturally.
 */
export const colors = {
  night: "#050915",
  soft: "#050915",
  charcoal: "#0D1A2D",
  white: "#0B1527",
  mint: "rgba(255,255,255,0.06)",
  emerald: "#38BDF8",
  gold: "#B89567",
  purple: "#8F5CFF",
  text: "#F7F4EE",
  muted: "rgba(247,244,238,0.62)",
  faint: "rgba(247,244,238,0.4)",
  border: "rgba(199,206,218,0.14)",
  borderStrong: "rgba(56,189,248,0.45)",
  onDark: "#F7F4EE",
  onDarkMuted: "rgba(247,244,238,0.62)",
  onPrimary: "#050915",
  success: "#34D399",
  warning: "#FBBF24",
  danger: "#F87171",
};

export const tint = {
  blue: "rgba(56,189,248,0.14)",
  oak: "rgba(184,149,103,0.18)",
  purple: "rgba(143,92,255,0.16)",
  success: "rgba(52,211,153,0.14)",
  warning: "rgba(251,191,36,0.14)",
  danger: "rgba(248,113,113,0.14)",
};

/** Number pads on iOS have no return key; every field shares this "Fertig" bar. */
export const keyboardDoneId = "ibo-keyboard-done";

export function KeyboardDoneBar() {
  if (Platform.OS !== "ios") return null;
  return (
    <InputAccessoryView nativeID={keyboardDoneId} backgroundColor={colors.charcoal}>
      <View style={styles.doneBar}>
        <Pressable onPress={Keyboard.dismiss} hitSlop={12} accessibilityRole="button">
          <Text style={styles.doneText}>Fertig</Text>
        </Pressable>
      </View>
    </InputAccessoryView>
  );
}

export type IconName = React.ComponentProps<typeof Ionicons>["name"];

export function Icon({ name, size = 20, color = colors.text }: { name: IconName; size?: number; color?: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}

/** Signature gradient line of the website header, approximated with three segments. */
export function BrandLine() {
  return (
    <View style={styles.brandLine}>
      <View style={[styles.brandSegment, { backgroundColor: colors.emerald }]} />
      <View style={[styles.brandSegment, { backgroundColor: colors.purple }]} />
      <View style={[styles.brandSegment, { backgroundColor: colors.gold }]} />
    </View>
  );
}

export function Screen({
  title,
  subtitle,
  onBack,
  right,
  children,
  scroll = true,
  footer,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  children: React.ReactNode;
  scroll?: boolean;
  /** Pinned below the content, e.g. a save bar. */
  footer?: React.ReactNode;
}) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Zurück" onPress={onBack} style={styles.backButton} hitSlop={12}>
              <Icon name="chevron-back" color={colors.emerald} size={26} />
            </Pressable>
          ) : null}
          <View style={styles.flex}>
            <Text style={[styles.headerTitle, onBack && styles.headerTitleSmall]} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {right}
        </View>
      </View>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.body, styles.flex]}>{children}</View>
      )}
      {footer}
    </View>
  );
}

export function HeaderButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.headerAction} hitSlop={10}>
      <Icon name={icon} color={colors.emerald} size={22} />
    </Pressable>
  );
}

export function Card({ children, style, dark }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; dark?: boolean }) {
  return <View style={[styles.card, dark && styles.darkCard, style]}>{children}</View>;
}

export function SectionTitle({ children, action }: { children: string; action?: { label: string; onPress: () => void } }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {action ? (
        <Pressable onPress={action.onPress} hitSlop={8}>
          <Text style={styles.sectionAction}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  autoCapitalize,
  secureTextEntry,
  textContentType,
  style,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  secureTextEntry?: boolean;
  textContentType?: TextInputProps["textContentType"];
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        keyboardType={keyboardType}
        keyboardAppearance="dark"
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        textContentType={textContentType}
        inputAccessoryViewID={keyboardDoneId}
        style={[styles.input, multiline && styles.multiline]}
      />
    </View>
  );
}

/** Keeps the raw text while typing so "12," is not reformatted mid-entry. */
export function AmountField({
  label,
  value,
  onChange,
  suffix = "€",
  style,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const display = React.useCallback((input: number) => (suffix === "€" ? amountInput(input) : String(input).replace(".", ",")), [suffix]);
  const [text, setText] = React.useState(display(value));
  const focused = React.useRef(false);
  React.useEffect(() => {
    if (!focused.current) setText(display(value));
  }, [display, value]);
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.amountWrap}>
        <TextInput
          value={text}
          onFocus={() => {
            focused.current = true;
          }}
          onBlur={() => {
            focused.current = false;
            setText(display(value));
          }}
          onChangeText={(next) => {
            setText(next);
            onChange(parseAmount(next));
          }}
          keyboardType="decimal-pad"
          keyboardAppearance="dark"
          selectTextOnFocus
          inputAccessoryViewID={keyboardDoneId}
          style={[styles.input, styles.amountInput, !suffix && styles.amountNoSuffix]}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

/** German date entry (TT.MM.JJJJ) backed by an ISO date. */
export function DateField({
  label,
  value,
  onChange,
  style,
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const [text, setText] = React.useState(formatDate(value));
  React.useEffect(() => setText(formatDate(value)), [value]);
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={text}
        onChangeText={(next) => {
          setText(next);
          const match = next.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
          if (match) onChange(`${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`);
        }}
        onBlur={() => setText(formatDate(value))}
        placeholder="TT.MM.JJJJ"
        placeholderTextColor={colors.faint}
        keyboardType="numbers-and-punctuation"
        keyboardAppearance="dark"
        inputAccessoryViewID={keyboardDoneId}
        style={styles.input}
      />
    </View>
  );
}

type ButtonTone = "primary" | "secondary" | "ghost" | "danger" | "gold";

export function Button({
  label,
  onPress,
  icon,
  tone = "primary",
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  tone?: ButtonTone;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = buttonPalette[tone];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg, borderColor: palette.border },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={18} color={palette.fg} /> : null}
      <Text style={[styles.buttonText, { color: palette.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const buttonPalette: Record<ButtonTone, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.emerald, fg: colors.onPrimary, border: colors.emerald },
  secondary: { bg: tint.blue, fg: colors.emerald, border: "transparent" },
  ghost: { bg: "transparent", fg: colors.text, border: colors.border },
  danger: { bg: tint.danger, fg: colors.danger, border: "transparent" },
  gold: { bg: tint.oak, fg: "#D9B98C", border: "transparent" },
};

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          onPress={() => onChange(option.value)}
          style={[styles.segment, option.value === value && styles.segmentActive]}
        >
          <Text style={[styles.segmentText, option.value === value && styles.segmentTextActive]} numberOfLines={1}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          onPress={() => onChange(option.value)}
          style={[styles.chip, option.value === value && styles.chipActive]}
        >
          <Text style={[styles.chipText, option.value === value && styles.chipTextActive]}>{option.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function Badge({ label, tone }: { label: string; tone: "success" | "warning" | "danger" | "neutral" | "gold" }) {
  const palette = {
    success: { bg: tint.success, fg: colors.success },
    warning: { bg: tint.warning, fg: colors.warning },
    danger: { bg: tint.danger, fg: colors.danger },
    neutral: { bg: colors.mint, fg: colors.muted },
    gold: { bg: tint.oak, fg: "#D9B98C" },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.badgeText, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

export function ListRow({
  icon,
  title,
  subtitle,
  right,
  rightSub,
  onPress,
  iconTone = "mint",
  chevron,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  rightSub?: React.ReactNode;
  onPress?: () => void;
  iconTone?: "mint" | "dark" | "gold" | "danger";
  chevron?: boolean;
}) {
  const iconPalette = {
    mint: { bg: colors.mint, fg: colors.text },
    dark: { bg: tint.blue, fg: colors.emerald },
    gold: { bg: tint.oak, fg: "#D9B98C" },
    danger: { bg: tint.danger, fg: colors.danger },
  }[iconTone];
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.listRow, pressed && styles.pressed]}>
      {icon ? (
        <View style={[styles.listIcon, { backgroundColor: iconPalette.bg }]}>
          <Icon name={icon} size={18} color={iconPalette.fg} />
        </View>
      ) : null}
      <View style={styles.flex}>
        <Text style={styles.listTitle} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.listSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right !== undefined || rightSub ? (
        <View style={styles.listRight}>
          {typeof right === "string" ? <Text style={styles.listAmount}>{right}</Text> : right}
          {rightSub}
        </View>
      ) : null}
      {chevron ? <Icon name="chevron-forward" size={18} color={colors.faint} /> : null}
    </Pressable>
  );
}

export function Money({ value, style, signed }: { value: number; style?: object; signed?: boolean }) {
  const color = signed ? (value < 0 ? colors.danger : colors.success) : undefined;
  return <Text style={[styles.listAmount, color ? { color } : null, style]}>{`${signed && value > 0 ? "+" : ""}${formatMoney(value)}`}</Text>;
}

export function Empty({ icon, title, text, action }: { icon: IconName; title: string; text: string; action?: React.ReactNode }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={26} color={colors.emerald} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
      {action}
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function KeyValue({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.keyValue}>
      <Text style={[styles.kvLabel, strong && styles.kvStrong]}>{label}</Text>
      <Text style={[styles.kvValue, strong && styles.kvStrong]}>{value}</Text>
    </View>
  );
}

export function SearchField({ value, onChangeText, placeholder }: { value: string; onChangeText: (value: string) => void; placeholder: string }) {
  return (
    <View style={styles.search}>
      <Icon name="search" size={18} color={colors.faint} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        keyboardAppearance="dark"
        returnKeyType="search"
        style={styles.searchInput}
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
    </View>
  );
}

/** Sticky bar for the one important action of a form (e.g. "Speichern"). */
export function ActionBar({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <View style={styles.actionBar}>
      {hint ? <Text style={styles.actionHint}>{hint}</Text> : null}
      <View style={styles.row}>{children}</View>
    </View>
  );
}

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.night },
  header: {
    backgroundColor: colors.night,
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 10,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 48 },
  backButton: { width: 36, height: 40, alignItems: "flex-start", justifyContent: "center", marginLeft: -6 },
  headerAction: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.mint },
  headerTitle: { color: colors.text, fontSize: 30, fontWeight: "800", letterSpacing: -0.4 },
  headerTitleSmall: { fontSize: 22 },
  headerSubtitle: { color: colors.muted, fontSize: 13, marginTop: 2 },
  body: { paddingHorizontal: 16, paddingTop: 6, gap: 14, paddingBottom: 132 },
  brandLine: { flexDirection: "row", height: 3, borderRadius: 2, overflow: "hidden" },
  brandSegment: { flex: 1 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  darkCard: { backgroundColor: colors.charcoal, borderColor: "rgba(56,189,248,0.22)" },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  sectionAction: { color: colors.emerald, fontWeight: "600" },
  field: { gap: 6 },
  label: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 16,
  },
  multiline: { minHeight: 96, paddingTop: 13, textAlignVertical: "top" },
  amountWrap: { flexDirection: "row", alignItems: "center" },
  amountInput: { flex: 1, textAlign: "right", paddingRight: 38 },
  amountNoSuffix: { paddingRight: 14 },
  suffix: { position: "absolute", right: 14, color: colors.muted, fontWeight: "600" },
  button: {
    minHeight: 50,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: { fontSize: 16, fontWeight: "700" },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  segmented: { flexDirection: "row", backgroundColor: colors.mint, borderRadius: 14, padding: 4, gap: 4 },
  segment: { flex: 1, minHeight: 38, borderRadius: 11, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  segmentActive: { backgroundColor: colors.charcoal, borderWidth: 1, borderColor: colors.borderStrong },
  segmentText: { color: colors.muted, fontWeight: "600", fontSize: 14 },
  segmentTextActive: { color: colors.text },
  chips: { gap: 8, paddingVertical: 2 },
  chip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: colors.mint, borderWidth: 1, borderColor: "transparent" },
  chipActive: { backgroundColor: tint.blue, borderColor: colors.borderStrong },
  chipText: { color: colors.muted, fontWeight: "600", fontSize: 14 },
  chipTextActive: { color: colors.emerald },
  badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, alignSelf: "flex-end" },
  badgeText: { fontSize: 12, fontWeight: "700" },
  listRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, minHeight: 52 },
  listIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  listTitle: { color: colors.text, fontSize: 16, fontWeight: "600" },
  listSubtitle: { color: colors.muted, fontSize: 13, marginTop: 2, lineHeight: 18 },
  listRight: { alignItems: "flex-end", gap: 4 },
  listAmount: { color: colors.text, fontSize: 16, fontWeight: "700" },
  empty: { alignItems: "center", gap: 8, paddingVertical: 28, paddingHorizontal: 20 },
  emptyIcon: { width: 60, height: 60, borderRadius: 20, backgroundColor: tint.blue, alignItems: "center", justifyContent: "center" },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: "700", marginTop: 6 },
  emptyText: { color: colors.muted, textAlign: "center", lineHeight: 21 },
  divider: { height: 1, backgroundColor: colors.border },
  keyValue: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  kvLabel: { color: colors.muted, fontSize: 15, flexShrink: 1 },
  kvValue: { color: colors.text, fontSize: 15, fontWeight: "600" },
  kvStrong: { color: colors.text, fontSize: 18, fontWeight: "800" },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.mint,
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 16 },
  row: { flexDirection: "row", gap: 10 },
  rowWrap: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  doneBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  doneText: { color: colors.emerald, fontSize: 16, fontWeight: "700" },
  actionBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 6,
    backgroundColor: "rgba(5,9,21,0.96)",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionHint: { color: colors.muted, fontSize: 13, textAlign: "center" },
});
