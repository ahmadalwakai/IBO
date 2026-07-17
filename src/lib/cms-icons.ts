import { createElement, type ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  BugOff,
  Building2,
  Calculator,
  CalendarCheck,
  Check,
  ClipboardCheck,
  Construction,
  Gem,
  Hammer,
  Layers3,
  MessageCircle,
  PaintRoller,
  Palette,
  PanelTop,
  Ruler,
  ScanLine,
  ShieldCheck,
  Sparkles,
  SprayCan,
  Wallpaper,
  WandSparkles,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  BadgeCheck,
  BugOff,
  Building2,
  Calculator,
  CalendarCheck,
  Check,
  ClipboardCheck,
  Construction,
  Gem,
  Hammer,
  Layers3,
  MessageCircle,
  PaintRoller,
  Palette,
  PanelTop,
  Ruler,
  ScanLine,
  ShieldCheck,
  Sparkles,
  SprayCan,
  Wallpaper,
  WandSparkles,
};

export function iconFor(iconName: string | undefined): LucideIcon {
  return iconName && icons[iconName] ? icons[iconName] : Sparkles;
}

export function CmsIcon({
  iconName,
  ...props
}: { iconName?: string } & ComponentProps<LucideIcon>) {
  return createElement(iconFor(iconName), props);
}
