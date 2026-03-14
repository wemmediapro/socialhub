"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { normalizeMediaUrl } from "@/lib/utils";

type VideoPreviewCardProps = {
  url: string;
  className?: string;
  /** Délai en ms après lequel on considère la vidéo en erreur si pas encore chargée (défaut 15000) */
  loadTimeout?: number;
  /** Hauteur max de l'aperçu en px (ex. 420 pour la bibliothèque) */
  maxHeight?: number;
  /** Hauteur min de l'aperçu en px */
  minHeight?: number;
};

const DEFAULT_LOAD_TIMEOUT = 15000;
const DEFAULT_MAX_HEIGHT = 320;
const DEFAULT_MIN_HEIGHT = 200;

export function VideoPreviewCard({ url, className = "", loadTimeout = DEFAULT_LOAD_TIMEOUT, maxHeight = DEFAULT_MAX_HEIGHT, minHeight = DEFAULT_MIN_HEIGHT }: VideoPreviewCardProps) {
  /** Toujours utiliser un chemin relatif /api/uploads/... pour appeler le serveur courant (évite domaine en dur / CORS) */
  const normalizedUrl = useMemo(() => normalizeMediaUrl(url || ""), [url]);

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingRef = useRef(true);

  const clearLoadTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (!normalizedUrl) return;
    loadingRef.current = true;
    timeoutRef.current = setTimeout(() => {
      if (loadingRef.current) {
        setStatus("error");
        setErrorMessage("Le chargement a pris trop de temps. La vidéo est peut‑être indisponible ou bloquée (CORS).");
      }
      timeoutRef.current = null;
    }, loadTimeout);
    return () => {
      clearLoadTimeout();
      loadingRef.current = false;
    };
  }, [normalizedUrl, loadTimeout]);

  const handleLoadedData = () => {
    loadingRef.current = false;
    clearLoadTimeout();
    setStatus("ready");
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    loadingRef.current = false;
    clearLoadTimeout();
    const video = e.currentTarget;
    const err = video.error;
    setStatus("error");
    if (err?.message) {
      // Message utilisateur plus lisible pour les erreurs courantes (format, codec, CORS)
      const msg = err.message;
      if (/format|decode|source not supported|src_not_supported/i.test(msg) || err?.code === 3 || err?.code === 4) {
        setErrorMessage("Format non supporté ou fichier vidéo invalide. Vous pouvez ouvrir le lien ci‑dessous pour télécharger ou lire le fichier.");
      } else if (/network|cors|failed to fetch/i.test(msg) || err?.code === 2) {
        setErrorMessage("Impossible de charger la vidéo (réseau ou CORS). Ouvrez le lien dans un nouvel onglet si le fichier est accessible.");
      } else {
        setErrorMessage(msg);
      }
    } else {
      setErrorMessage("Impossible de charger la vidéo (CORS, format ou URL invalide).");
    }
  };

  const handleLoadStart = () => {
    setStatus("loading");
  };

  const isRelativeOrSameOrigin = (): boolean => {
    try {
      if (!normalizedUrl || normalizedUrl.startsWith("data:")) return true;
      if (normalizedUrl.startsWith("/") || normalizedUrl.startsWith("./")) return true;
      if (typeof window !== "undefined") {
        const u = new URL(normalizedUrl, window.location.origin);
        return u.origin === window.location.origin;
      }
      return false;
    } catch {
      return false;
    }
  };

  if (!normalizedUrl) {
    return (
      <div
        className={className}
        style={{
          position: "relative",
          borderRadius: "var(--border-radius-lg)",
          overflow: "hidden",
          background: "var(--color-secondary-900)",
          aspectRatio: "9/16",
          maxHeight: `${maxHeight}px`,
          minHeight: `${minHeight}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-secondary-400)",
          fontSize: "var(--font-size-sm)",
        }}
      >
        URL vidéo invalide
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        position: "relative",
        borderRadius: "var(--border-radius-lg)",
        overflow: "hidden",
        background: "var(--color-secondary-900)",
        aspectRatio: "9/16",
        maxHeight: `${maxHeight}px`,
        minHeight: `${minHeight}px`,
      }}
    >
      {status === "loading" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--spacing-3)",
            background: "var(--color-secondary-900)",
            zIndex: 2,
          }}
        >
          <Loader2
            size={32}
            strokeWidth={2}
            style={{ color: "var(--color-white)", animation: "spin 1s linear infinite" }}
          />
          <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-secondary-300)" }}>
            Chargement…
          </span>
        </div>
      )}

      {status === "error" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--spacing-4)",
            padding: "var(--spacing-4)",
            background: "var(--color-secondary-900)",
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AlertCircle size={24} style={{ color: "var(--color-error)" }} />
          </div>
          <p
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-secondary-300)",
              textAlign: "center",
              margin: 0,
            }}
          >
            {errorMessage}
          </p>
          <a
            href={normalizedUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--spacing-2)",
              padding: "var(--spacing-2) var(--spacing-4)",
              background: "var(--color-primary)",
              color: "white",
              borderRadius: "var(--border-radius-base)",
              fontSize: "var(--font-size-sm)",
              fontWeight: "var(--font-weight-semibold)",
              textDecoration: "none",
              transition: "opacity var(--transition-fast)",
            }}
          >
            <ExternalLink size={16} />
            Ouvrir dans un nouvel onglet
          </a>
        </div>
      )}

      <video
        ref={videoRef}
        src={normalizedUrl}
        controls
        playsInline
        preload="metadata"
        crossOrigin={isRelativeOrSameOrigin() ? undefined : "anonymous"}
        onLoadStart={handleLoadStart}
        onLoadedData={handleLoadedData}
        onCanPlay={handleLoadedData}
        onError={handleError}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: status === "ready" ? "block" : "none",
        }}
      />
    </div>
  );
}
