/**
 * Normalise les URLs de médias pour utiliser l'API route du serveur courant.
 * - Les URLs complètes (ex. https://socialhub.../api/uploads/xxx) sont converties
 *   en chemin relatif /api/uploads/xxx pour que la vidéo soit lue depuis le
 *   serveur local (public/uploads) quand on est en local.
 * - Convertit aussi /uploads/ vers /api/uploads/
 */
export function normalizeMediaUrl(url: string): string {
  if (!url) return url;

  // Extraire le chemin /api/uploads/xxx pour toujours utiliser l'origine courante
  // (ainsi en local les vidéos sont lues depuis public/uploads)
  if (url.includes('/api/uploads/')) {
    const match = url.match(/\/api\/uploads\/([^?#]+)/);
    if (match) {
      return `/api/uploads/${match[1]}`;
    }
    return url;
  }

  // URL complète avec /uploads/ → chemin relatif /api/uploads/xxx
  if (url.includes('/uploads/')) {
    const parts = url.split('/uploads/');
    if (parts.length > 1) {
      const fileName = parts[1].split('?')[0].split('#')[0];
      if (fileName) {
        return `/api/uploads/${fileName}`;
      }
    }
  }

  // URL externe (Cloudinary, etc.) : garder telle quelle
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return url;
}

/** Contexte d'affichage des médias : bibliothèque = pleine résolution, le reste = miniature */
export type MediaContext = "library" | "preview" | "calendar" | "workflow";

/** Largeur cible pour les miniatures (aperçu, calendrier, workflow). */
const THUMB_WIDTH = 400;

/** Extensions pour lesquelles on ne doit pas ajouter ?w= (vidéo/audio : lecture streaming). */
const VIDEO_AUDIO_EXTS = /\.(mp4|webm|mov|ogg|mp3|wav|m4a)(\?|#|$)/i;

/**
 * Retourne l'URL du média adaptée au contexte :
 * - library : pleine résolution (pour la page Bibliothèque).
 * - preview, calendar, workflow : pour les images, version redimensionnée (?w=) ; pour vidéo/audio, URL telle quelle (pour que l’aperçu vidéo fonctionne).
 * Les URLs externes (Cloudinary, etc.) ne sont pas modifiées.
 */
export function getMediaUrlForContext(url: string, context: MediaContext): string {
  const normalized = normalizeMediaUrl(url);
  if (!normalized) return normalized;
  if (context === "library") return normalized;
  if (!normalized.startsWith("/api/uploads/")) return normalized;
  // Ne pas ajouter ?w= pour la vidéo/audio : la lecture en streaming (Range) doit utiliser l’URL telle quelle
  if (VIDEO_AUDIO_EXTS.test(normalized)) return normalized;
  const sep = normalized.includes("?") ? "&" : "?";
  return `${normalized}${sep}w=${THUMB_WIDTH}`;
}

