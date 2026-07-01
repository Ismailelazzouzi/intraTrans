/**
 * Design System Tokens
 *
 * Central mapping from semantic states to Tailwind class strings.
 * Import these instead of hardcoding 'bg-emerald-500/10 text-emerald-400' etc.
 */

export const STATUS_STYLES = {
  ACTIVE: {
    bg: "bg-status-active/10",
    border: "border-status-active/20",
    text: "text-status-active",
    dot: "bg-status-active",
    label: "Active",
  },
  PENDING: {
    bg: "bg-status-pending/10",
    border: "border-status-pending/20",
    text: "text-status-pending",
    dot: "bg-status-pending",
    label: "Pending",
  },
  ERROR: {
    bg: "bg-status-error/10",
    border: "border-status-error/20",
    text: "text-status-error",
    dot: "bg-status-error",
    label: "Error",
  },
  INFO: {
    bg: "bg-status-info/10",
    border: "border-status-info/20",
    text: "text-status-info",
    dot: "bg-status-info",
    label: "Info",
  },
} as const;

export const NOTIFICATION_STYLES = {
  success:
    "bg-brand-success/10 border border-brand-success/30 text-brand-success",
  error: "bg-status-error/10 border border-status-error/30 text-status-error",
} as const;

export const USER_TYPE_STYLES: Record<
  string,
  { bg: string; border: string; text: string; label: string; animate?: string }
> = {
  ADMIN: {
    bg: "bg-status-info/10",
    border: "border-status-info/20",
    text: "text-status-info",
    label: "ADMIN",
  },
  ROOT: {
    bg: "bg-status-info/10",
    border: "border-status-info/20",
    text: "text-status-info",
    label: "ROOT",
  },
  PROVIDER: {
    bg: "bg-brand-success/10",
    border: "border-brand-success/20",
    text: "text-brand-success",
    label: "PROVIDER",
  },
  PENDING: {
    bg: "bg-status-pending/10",
    border: "border-status-pending/20",
    text: "text-status-pending",
    label: "PENDING REVIEW",
    animate: "animate-pulse",
  },
  REJECTED: {
    bg: "bg-status-error/10",
    border: "border-status-error/20",
    text: "text-status-error",
    label: "REJECTED",
  },
  CLIENT: {
    bg: "bg-text-secondary/10",
    border: "border-border-subtle/20",
    text: "text-text-secondary",
    label: "CLIENT",
  },
};

export const PANEL_STYLES = {
  default:
    "bg-surface-overlay border border-border-default rounded-card p-6 backdrop-blur-md",
  elevated:
    "bg-surface-elevated/30 border border-border-default rounded-card p-6",
  modal: "bg-surface-panel border border-border-default rounded-modal p-8 shadow-2xl",
  card: "bg-surface-overlay border border-border-default rounded-card p-5",
  dashed:
    "bg-surface-overlay border border-dashed border-border-default rounded-card py-16 text-center",
} as const;

export const BUTTON_CLASSES = {
  primary:
    "bg-brand-primary text-surface-panel hover:bg-brand-success cursor-pointer transition-all duration-300",
  secondary:
    "text-text-secondary hover:text-text-primary transition-all duration-300",
  ghost:
    "bg-transparent border border-border-default text-text-secondary hover:text-text-primary hover:border-border-subtle transition-all",
  danger:
    "bg-status-error/10 border border-status-error/30 text-status-error hover:bg-status-error/20 transition-all",
} as const;

export const INPUT_CLASSES =
  "w-full bg-surface-elevated/50 border border-border-subtle rounded-interactive px-4 py-3 text-text-primary outline-none focus:border-brand-primary/50 transition-all";

export const TEXTAREA_CLASSES =
  "w-full bg-surface-elevated/50 border border-border-subtle rounded-interactive px-4 py-3 text-text-primary h-32 resize-none outline-none focus:border-brand-primary/50 transition-all";

export const AVATAR_CLASSES = {
  sm: "w-7 h-7 rounded-full border border-border-subtle/60 flex items-center justify-center shrink-0",
  md: "w-9 h-9 rounded-full border border-border-subtle/60 flex items-center justify-center shrink-0",
  lg: "w-10 h-10 rounded-full border border-border-subtle/60 flex items-center justify-center shrink-0",
  initials:
    "font-bold text-text-secondary",
  image:
    "h-full w-full object-cover rounded-full",
} as const;
