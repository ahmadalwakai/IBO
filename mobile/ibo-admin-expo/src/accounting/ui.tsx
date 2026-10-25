import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { amountInput, formatDate, formatMoney, parseAmount } from "./calc";

export const colors = {
  night: "#061E1B",
  emerald: "#00D6A0",
  soft: "#F8FAF9",
  gold: "#D8B56A",
  charcoal: "#142E2A",
  mint: "#E8F4EF",
  text: "#142E2A",
  muted: "#5C6F6B",
  border: "#DDE8E4",
  white: "#FFFFFF",
  danger: "#D64545",
  warning: "#B7791F",
  onDark: "#F8FAF9",
  onDarkMuted: "rgba(248,250,249,0.66)",
};

export type IconName = React.ComponentProps<typeof Ionicons>["name"];

export function Icon({ name, size = 20, color = colors.text }: { name: IconName; size?: number; color?: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}

export function Screen({
  title,
  subtitle,
  onBack,
  right,
  children,
  scroll = true,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  children: React.ReactNode;
  scroll?: boolean;
}) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Zurück" onPress={onBack} style={styles.headerIcon} hitSlop={10}>
              <Icon name="chevron-back" color={colors.onDark} size={24} />
            </Pressable>
          ) : null}
          <View style={styles.flex}>
            <Text style={styles.headerTitle} numberOfLines={1}>
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
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {scroll ? (
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.body, styles.flex]}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

export function HeaderButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.headerIcon} hitSlop={10}>
      <Icon name={icon} color={colors.emerald} size={24} />
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
  style,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9AABA6"
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
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
  const [text, setText] = React.useState(amountInput(value));
  const focused = React.useRef(false);
  React.useEffect(() => {
    if (!focused.current) setText(suffix === "€" ? amountInput(value) : String(value).replace(".", ","));
  }, [suffix, value]);
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
            setText(suffix === "€" ? amountInput(value) : String(value).replace(".", ","));
          }}
          onChangeText={(next) => {
            setText(next);
            onChange(parseAmount(next));
          }}
          keyboardType="decimal-pad"
          style={[styles.input, styles.amountInput]}
        />
        <Text style={styles.suffix}>{suffix}</Text>
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
        placeholderTextColor="#9AABA6"
        keyboardType="numbers-and-punctuation"
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
      <Text style={[styles.buttonText, { color: palette.fg }]}>{label}</Text>
    </Pressable>
  );
}

const buttonPalette: Record<ButtonTone, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.emerald, fg: colors.night, border: colors.emerald },
  secondary: { bg: colors.mint, fg: colors.charcoal, border: colors.mint },
  ghost: { bg: "transparent", fg: colors.charcoal, border: colors.border },
  danger: { bg: "#FCEDED", fg: colors.danger, border: "#F6D3D3" },
  gold: { bg: colors.night, fg: colors.gold, border: colors.gold },
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
    success: { bg: "#D9F8EE", fg: "#047857" },
    warning: { bg: "#FDF3DC", fg: colors.warning },
    danger: { bg: "#FCEDED", fg: colors.danger },
    neutral: { bg: colors.mint, fg: colors.muted },
    gold: { bg: "#F6EEDC", fg: "#8A6A22" },
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
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  rightSub?: React.ReactNode;
  onPress?: () => void;
  iconTone?: "mint" | "dark" | "gold" | "danger";
}) {
  const iconPalette = {
    mint: { bg: colors.mint, fg: colors.charcoal },
    dark: { bg: colors.night, fg: colors.emerald },
    gold: { bg: "#F6EEDC", fg: "#8A6A22" },
    danger: { bg: "#FCEDED", fg: colors.danger },
  }[iconTone];
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.listRow, pressed && styles.pressed]}>
      {icon ? (
        <View style={[styles.listIcon, { backgroundColor: iconPalette.bg }]}>
          <Icon name={icon} size={18} color={iconPalette.fg} />
        </View>
      ) : null}
      <View style={styles.flex}>
        <Text style={styles.listTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.listSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.listRight}>
        {typeof right === "string" ? <Text style={styles.listAmount}>{right}</Text> : right}
        {rightSub}
      </View>
    </Pressable>
  );
}

export function Money({ value, style, signed }: { value: number; style?: object; signed?: boolean }) {
  const color = signed ? (value < 0 ? colors.danger : "#047857") : undefined;
  return <Text style={[styles.listAmount, color ? { color } : null, style]}>{`${signed && value > 0 ? "+" : ""}${formatMoney(value)}`}</Text>;
}

export function Empty({ icon, title, text, action }: { icon: IconName; title: string; text: string; action?: React.ReactNode }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={28} color={colors.emerald} />
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
      <Icon name="search" size={18} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9AABA6"
        style={styles.searchInput}
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
    </View>
  );
}

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.soft },
  header: {
    backgroundColor: colors.night,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 44 },
  headerIcon: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 18 },
  headerTitle: { color: colors.onDark, fontSize: 24, fontWeight: "800" },
  headerSubtitle: { color: colors.onDarkMuted, fontSize: 13, marginTop: 2 },
  body: { padding: 16, gap: 14, paddingBottom: 140 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: "#061E1B",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  darkCard: { backgroundColor: colors.charcoal },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "800" },
  sectionAction: { color: "#00A57B", fontWeight: "700" },
  field: { gap: 6 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  input: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    color: colors.text,
    fontSize: 16,
  },
  multiline: { minHeight: 88, paddingTop: 12, textAlignVertical: "top" },
  amountWrap: { flexDirection: "row", alignItems: "center" },
  amountInput: { flex: 1, textAlign: "right", paddingRight: 34 },
  suffix: { position: "absolute", right: 12, color: colors.muted, fontWeight: "700" },
  button: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: { fontSize: 15, fontWeight: "800" },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.45 },
  segmented: { flexDirection: "row", backgroundColor: colors.mint, borderRadius: 14, padding: 4, gap: 4 },
  segment: { flex: 1, minHeight: 36, borderRadius: 11, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  segmentActive: { backgroundColor: colors.night },
  segmentText: { color: colors.charcoal, fontWeight: "700", fontSize: 13 },
  segmentTextActive: { color: colors.emerald },
  chips: { gap: 8, paddingVertical: 2 },
  chip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.mint },
  chipActive: { backgroundColor: colors.night },
  chipText: { color: colors.charcoal, fontWeight: "700", fontSize: 13 },
  chipTextActive: { color: colors.emerald },
  badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, alignSelf: "flex-end" },
  badgeText: { fontSize: 11, fontWeight: "800" },
  listRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  listIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  listTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  listSubtitle: { color: colors.muted, fontSize: 13, marginTop: 2 },
  listRight: { alignItems: "flex-end", gap: 4 },
  listAmount: { color: colors.text, fontSize: 15, fontWeight: "800" },
  empty: { alignItems: "center", gap: 8, paddingVertical: 32, paddingHorizontal: 20 },
  emptyIcon: { width: 64, height: 64, borderRadius: 22, backgroundColor: colors.night, alignItems: "center", justifyContent: "center" },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: "800", marginTop: 6 },
  emptyText: { color: colors.muted, textAlign: "center", lineHeight: 20 },
  divider: { height: 1, backgroundColor: colors.border },
  keyValue: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  kvLabel: { color: colors.muted, fontSize: 14, flexShrink: 1 },
  kvValue: { color: colors.text, fontSize: 14, fontWeight: "600" },
  kvStrong: { color: colors.text, fontSize: 17, fontWeight: "900" },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 15 },
  row: { flexDirection: "row", gap: 10 },
  rowWrap: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
});
