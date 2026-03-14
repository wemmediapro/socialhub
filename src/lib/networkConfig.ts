/**
 * Configuration partagée des réseaux sociaux (couleurs, emojis).
 * Pour les icônes Lucide, les pages peuvent mapper ces clés à leurs composants.
 */
export const networkColors: Record<string, string> = {
  instagram: "#E4405F",
  facebook: "#1877F2",
  tiktok: "#000000",
  threads: "#101010",
  youtube: "#FF0000",
  x: "#000000",
  linkedin: "#0077B5",
  snapchat: "#FFFC00",
};

export const networkEmojis: Record<string, string> = {
  instagram: "📷",
  facebook: "📘",
  tiktok: "🎵",
  threads: "💬",
  youtube: "▶️",
  x: "𝕏",
  linkedin: "💼",
  snapchat: "👻",
};

/** Couleurs par statut workflow (sans label, à combiner avec i18n). */
export const statusColors: Record<string, string> = {
  DRAFT: "#94a3b8",
  PENDING_GRAPHIC: "#8b5cf6",
  CLIENT_REVIEW: "#f59e0b",
  SCHEDULED: "#6366f1",
  PUBLISHED: "#10b981",
  PENDING_CORRECTION: "#f97316",
  FAILED: "#ef4444",
};
