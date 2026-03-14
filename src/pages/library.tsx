import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useTranslation } from "@/i18n/TranslationContext";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeMediaUrl } from "@/lib/utils";
import {
  Image as ImageIcon,
  RefreshCcw,
  ExternalLink,
  Download,
  FileText,
  Users,
  AlertCircle,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import LoadingSpinner from "@/components/LoadingSpinner";
import { VideoPreviewCard } from "@/components/VideoPreviewCard";

type WorkflowStatus =
  | "DRAFT"
  | "PENDING_GRAPHIC"
  | "CLIENT_REVIEW"
  | "SCHEDULED"
  | "PUBLISHED"
  | "PENDING_CORRECTION"
  | "FAILED";

type MediaSource = "workflowPosts" | "workflowCollab";

type MediaItem = {
  id: string;
  source: MediaSource;
  url: string;
  title: string;
  titleIt?: string;
  description?: string;
  status?: string;
  projectNames: string[];
  influencerName?: string;
  uploadedAt?: string;
  scheduledAt?: string;
  networks?: string[];
  type?: string;
  groupId: string;
  position: number;
};

type MediaGroup = {
  groupId: string;
  items: MediaItem[];
  primary: MediaItem;
};

type Project = { _id: string; name: string };
type Influencer = { _id: string; name: string };

const isVideoUrl = (url: string) => /\.(mp4|mov|webm|ogg|mkv)$/i.test(url);

/** Hauteur de la zone d'aperçu principal (vidéo / image / slide du carrousel) */
const PREVIEW_HEIGHT = 400;
/** Taille des vignettes du carrousel sous l'aperçu */
const CAROUSEL_THUMB_SIZE = 80;

const formatDate = (value?: string, locale: string = "fr-FR") => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const LibraryPage = () => {
  const { t, language } = useTranslation();
  const { canUpdate, canDelete } = useAuth();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | MediaSource>("all");
  const [search, setSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [mediaErrors, setMediaErrors] = useState<Record<string, boolean>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  /** Index de la slide affichée par groupe (carrousel) */
  const [carouselIndex, setCarouselIndex] = useState<Record<string, number>>({});

  const locale = language === "it" ? "it-IT" : "fr-FR";
  const getDisplayTitle = (item: MediaItem) =>
    language === "it" && item.titleIt ? item.titleIt : item.title;
  /** Pour les collaborations, on n'affiche pas la description comme titre. */
  const getDisplayTitleForCard = (item: MediaItem) =>
    item.source === "workflowCollab" ? t("library.collabFallbackTitle") : getDisplayTitle(item);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [postsRes, collabsRes, projectsRes, influencersRes] = await Promise.all([
        axios.get("/api/posts"),
        axios.get("/api/collaborations"),
        axios.get("/api/projects"),
        axios.get("/api/influencers"),
      ]);

      const projects: Project[] = projectsRes.data.projects || [];
      const influencers: Influencer[] = influencersRes.data.influencers || [];
      const projectMap = new Map(projects.map((p) => [p._id, p.name]));
      const influencerMap = new Map(influencers.map((i) => [i._id, i.name]));

      const postItems: MediaItem[] = (postsRes.data.posts || [])
        .filter(
          (post: { status: string; mediaUrls?: string[] }) =>
            ["SCHEDULED", "PUBLISHED"].includes(post.status) &&
            Array.isArray(post.mediaUrls) &&
            post.mediaUrls.length > 0
        )
        .flatMap((post: Record<string, unknown>) => {
          const projectIds: string[] =
            Array.isArray(post.projectIds) && post.projectIds.length > 0
              ? (post.projectIds as string[])
              : post.projectId
                ? [post.projectId as string]
                : [];
          const projectNames = projectIds.map((id) => projectMap.get(id) || id);
          const networks: string[] = Array.isArray(post.networks)
            ? post.networks
            : post.network
              ? [post.network as string]
              : [];
          return (post.mediaUrls as string[]).map((url: string, index: number) => ({
            id: `${post._id}-media-${index}`,
            source: "workflowPosts" as MediaSource,
            url: normalizeMediaUrl(url),
            title: (post.caption || post.description || t("library.postFallbackTitle")) as string,
            titleIt: (post.captionIt || post.descriptionIt) as string | undefined,
            description: post.description as string | undefined,
            status: post.status as string,
            projectNames,
            scheduledAt: post.scheduledAt as string | undefined,
            uploadedAt: post.updatedAt as string | undefined,
            networks,
            type: post.type as string | undefined,
            groupId: post._id as string,
            position: index,
          }));
        });

      const collabItems: MediaItem[] = (collabsRes.data.collaborations || []).flatMap(
        (collab: Record<string, unknown>) => {
          const projectIds: string[] =
            Array.isArray(collab.projectIds) && collab.projectIds.length > 0
              ? (collab.projectIds as string[])
              : collab.projectId
                ? [collab.projectId as string]
                : [];
          const projectNames = projectIds.map((id) => projectMap.get(id) || id);
          const influencerName = influencerMap.get(collab.influencerId as string);
          const contentUploads = (collab.contentUploads || []) as Array<Record<string, unknown>>;
          return contentUploads
            .flatMap((upload: Record<string, unknown>, uploadIndex: number) =>
              ((upload.urls as string[]) || []).map((url: string, mediaIndex: number) => ({
                id: `${collab._id}-upload-${uploadIndex}-${mediaIndex}`,
                source: "workflowCollab" as MediaSource,
                url: normalizeMediaUrl(url),
                title: (upload.description ||
                  collab.description ||
                  t("library.collabFallbackTitle")) as string,
                titleIt: (collab as { descriptionIt?: string }).descriptionIt,
                description: upload.description as string | undefined,
                status: collab.status as WorkflowStatus,
                projectNames,
                influencerName,
                uploadedAt: upload.uploadedAt as string | undefined,
                groupId: `${collab._id}-upload-${uploadIndex}`,
                position: mediaIndex,
              }))
            );
        }
      );

      const allItems = [...postItems, ...collabItems].sort((a, b) => {
        const dateA = new Date(a.uploadedAt || a.scheduledAt || 0).getTime();
        const dateB = new Date(b.uploadedAt || b.scheduledAt || 0).getTime();
        return dateB - dateA;
      });

      setMediaItems(allItems);
      setLastUpdated(new Date().toISOString());
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : err instanceof Error
            ? err.message
            : "Unknown error";
      setError(message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    const lowerSearch = search.toLowerCase().trim();
    return mediaItems.filter((item) => {
      if (filter !== "all" && item.source !== filter) return false;
      if (!lowerSearch) return true;
      const haystack = [
        item.title,
        item.titleIt,
        item.description,
        item.influencerName,
        item.projectNames.join(" "),
        item.networks?.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(lowerSearch);
    });
  }, [mediaItems, filter, search]);

  const groupedItems = useMemo<MediaGroup[]>(() => {
    const map = new Map<string, { items: MediaItem[]; firstIndex: number }>();
    filteredItems.forEach((item, index) => {
      const existing = map.get(item.groupId);
      if (existing) {
        existing.items.push(item);
      } else {
        map.set(item.groupId, { items: [item], firstIndex: index });
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => a[1].firstIndex - b[1].firstIndex)
      .map(([groupId, data]) => {
        const items = [...data.items].sort((a, b) => a.position - b.position);
        return { groupId, items, primary: items[0] };
      });
  }, [filteredItems]);

  /** ID de l'entité backend : post _id ou collaboration _id (sans -upload-N) */
  const getEntityId = (groupId: string, source: MediaSource) =>
    source === "workflowPosts" ? groupId : groupId.replace(/-upload-\d+$/, "");

  const handleDeleteLibraryItem = async (groupId: string, source: MediaSource) => {
    const entityId = getEntityId(groupId, source);
    const confirmKey = source === "workflowPosts" ? "library.deleteConfirmPost" : "library.deleteConfirmCollab";
    if (!confirm(t(confirmKey))) return;
    setDeletingId(groupId);
    try {
      if (source === "workflowPosts") {
        await axios.delete(`/api/posts/${entityId}`);
      } else {
        await axios.delete(`/api/collaborations/${entityId}`);
      }
      await loadData();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : err instanceof Error
            ? err.message
            : "Unknown error";
      alert(message || t("library.deleteError"));
    } finally {
      setDeletingId(null);
    }
  };

  const postsCount = mediaItems.filter((i) => i.source === "workflowPosts").length;
  const collabCount = mediaItems.filter((i) => i.source === "workflowCollab").length;

  if (loading && mediaItems.length === 0) {
    return (
      <div className="page-container">
        <div className="page-content dash" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-content dash">
        {/* Hero : même structure que le dashboard */}
        <div className="page-hero">
          <div className="page-hero-inner">
            <div className="page-hero-text">
              <div className="page-hero-breadcrumbs">
                <Breadcrumbs
                  items={[
                    { label: t("menu.dashboard"), href: "/" },
                    { label: t("library.title") },
                  ]}
                />
              </div>
              <h1 className="page-hero-title">{t("library.title")}</h1>
              <p className="page-hero-subtitle">{t("library.subtitle")}</p>
            </div>
            <div className="page-hero-actions">
              <button
                type="button"
                onClick={loadData}
                className="page-hero-btn"
                disabled={loading}
              >
                <RefreshCcw size={16} />
                {loading ? "..." : t("library.lastUpdated")}
              </button>
              {lastUpdated && (
                <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.8)", marginLeft: "0.75rem" }}>
                  {formatDate(lastUpdated, locale)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* KPIs : style dashboard */}
        <div className="dash-kpis">
          <div className="dash-kpi">
            <div className="dash-kpi-icon">
              <ImageIcon size={24} strokeWidth={2.5} />
            </div>
            <div className="dash-kpi-body">
              <div className="dash-kpi-value">{mediaItems.length}</div>
              <div className="dash-kpi-label">{t("library.validatedCount")}</div>
            </div>
          </div>
          <div className="dash-kpi">
            <div className="dash-kpi-icon">
              <FileText size={24} strokeWidth={2.5} />
            </div>
            <div className="dash-kpi-body">
              <div className="dash-kpi-value">{postsCount}</div>
              <div className="dash-kpi-label">{t("library.filters.posts")}</div>
            </div>
          </div>
          <div className="dash-kpi">
            <div className="dash-kpi-icon">
              <Users size={24} strokeWidth={2.5} />
            </div>
            <div className="dash-kpi-body">
              <div className="dash-kpi-value">{collabCount}</div>
              <div className="dash-kpi-label">{t("library.filters.collab")}</div>
            </div>
          </div>
        </div>

        {/* Filtres et recherche : style calendar-filters-bar */}
        <section className="dash-section calendar-section">
          <div className="dash-section-head">
            <h2 className="dash-section-title">{t("library.filters.title") || "Filtres"}</h2>
          </div>
          <div className="calendar-filters-bar" style={{ flexWrap: "wrap", gap: "var(--spacing-3)" }}>
            <div className="calendar-filter-group">
              <label className="calendar-filter-label">{t("library.filters.source") || "Source"}</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as "all" | MediaSource)}
                className="calendar-filter-select"
                style={{ minWidth: "160px" }}
              >
                <option value="all">{t("library.filters.all")}</option>
                <option value="workflowPosts">{t("library.filters.posts")}</option>
                <option value="workflowCollab">{t("library.filters.collab")}</option>
              </select>
            </div>
            <div className="calendar-filter-group" style={{ flex: "1 1 280px", minWidth: "200px" }}>
              <label className="calendar-filter-label">{t("library.searchPlaceholder")}</label>
              <input
                type="search"
                placeholder={t("library.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="calendar-filter-select"
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </section>

        {/* Message d'erreur */}
        {error && !loading && (
          <div
            className="dash-section"
            style={{
              padding: "var(--spacing-4)",
              border: "1px solid var(--color-error-200)",
              background: "var(--color-error-50)",
              color: "var(--color-error-700)",
              borderRadius: "var(--border-radius-base)",
            }}
          >
            {error}
          </div>
        )}

        {/* Vide */}
        {!loading && !error && filteredItems.length === 0 && (
          <section className="dash-section">
            <div
              className="card"
              style={{
                padding: "var(--spacing-10)",
                textAlign: "center",
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--border-radius-base)",
              }}
            >
              {t("library.empty")}
            </div>
          </section>
        )}

        {/* Grille médias : cartes style dashboard */}
        {!loading && !error && groupedItems.length > 0 && (
          <section className="dash-section">
            <div className="dash-section-head">
              <h2 className="dash-section-title">
                {t("library.mediaGridTitle") || "Médiathèque"} · {groupedItems.length}
              </h2>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "var(--spacing-5)",
              }}
            >
              {groupedItems.map((group) => {
                const item = group.primary;
                return (
                  <div
                    key={group.groupId}
                    className="dash-kpi"
                    style={{
                      padding: 0,
                      overflow: "hidden",
                      flexDirection: "column",
                      alignItems: "stretch",
                    }}
                  >
                    <div style={{ position: "relative", background: "var(--color-bg-secondary)" }}>
                      {(() => {
                        const isCarousel = group.items.length > 1;
                        const currentIndex = isCarousel ? (carouselIndex[group.groupId] ?? 0) : 0;
                        const displayMedia = group.items[currentIndex] ?? group.primary;
                        const errorKey = isCarousel ? `${group.groupId}-${currentIndex}` : group.groupId;
                        const showError = mediaErrors[errorKey];
                        return showError ? (
                          <div
                            style={{
                              width: "100%",
                              height: PREVIEW_HEIGHT,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "var(--spacing-2)",
                              background: "var(--color-gray-100)",
                              color: "var(--color-text-secondary)",
                              fontSize: "0.875rem",
                            }}
                          >
                            <AlertCircle size={32} style={{ color: "var(--color-error)" }} />
                            <span>{t("library.mediaUnavailable") || "Média non disponible"}</span>
                            <a
                              href={displayMedia.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "var(--spacing-2)",
                                padding: "var(--spacing-2) var(--spacing-3)",
                                background: "var(--color-primary)",
                                color: "white",
                                borderRadius: "var(--border-radius-base)",
                                fontSize: "0.8125rem",
                                textDecoration: "none",
                              }}
                            >
                              <ExternalLink size={14} />
                              {t("library.open")}
                            </a>
                          </div>
                        ) : isVideoUrl(displayMedia.url) ? (
                          <div style={{ height: PREVIEW_HEIGHT, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg-secondary)" }}>
                            <VideoPreviewCard
                              url={displayMedia.url}
                              className="library-video-preview"
                              loadTimeout={12000}
                              maxHeight={PREVIEW_HEIGHT}
                              minHeight={320}
                            />
                          </div>
                        ) : (
                          <img
                            src={displayMedia.url}
                            alt={getDisplayTitleForCard(displayMedia)}
                            style={{ width: "100%", height: PREVIEW_HEIGHT, objectFit: "contain" }}
                            onError={() => setMediaErrors((prev) => ({ ...prev, [errorKey]: true }))}
                          />
                        );
                      })()}
                      {group.items.length > 1 && (
                        <>
                          <button
                            type="button"
                            aria-label={t("library.carouselPrev") || "Slide précédente"}
                            onClick={() => setCarouselIndex((prev) => ({ ...prev, [group.groupId]: Math.max(0, (prev[group.groupId] ?? 0) - 1) }))}
                            style={{
                              position: "absolute",
                              left: "var(--spacing-2)",
                              top: "50%",
                              transform: "translateY(-50%)",
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              border: "none",
                              background: "rgba(0,0,0,0.6)",
                              color: "white",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              zIndex: 2,
                            }}
                          >
                            <ChevronLeft size={24} />
                          </button>
                          <button
                            type="button"
                            aria-label={t("library.carouselNext") || "Slide suivante"}
                            onClick={() => setCarouselIndex((prev) => ({ ...prev, [group.groupId]: Math.min(group.items.length - 1, (prev[group.groupId] ?? 0) + 1) }))}
                            style={{
                              position: "absolute",
                              right: "var(--spacing-2)",
                              top: "50%",
                              transform: "translateY(-50%)",
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              border: "none",
                              background: "rgba(0,0,0,0.6)",
                              color: "white",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              zIndex: 2,
                            }}
                          >
                            <ChevronRight size={24} />
                          </button>
                          <span
                            style={{
                              position: "absolute",
                              bottom: "var(--spacing-2)",
                              left: "50%",
                              transform: "translateX(-50%)",
                              padding: "0.25rem 0.6rem",
                              borderRadius: "999px",
                              background: "rgba(0,0,0,0.6)",
                              color: "white",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              zIndex: 2,
                            }}
                          >
                            {(carouselIndex[group.groupId] ?? 0) + 1} / {group.items.length}
                          </span>
                        </>
                      )}
                      <span
                        style={{
                          position: "absolute",
                          top: "var(--spacing-2)",
                          left: "var(--spacing-2)",
                          padding: "0.25rem 0.6rem",
                          borderRadius: "999px",
                          background:
                            item.source === "workflowPosts"
                              ? "var(--color-primary-600)"
                              : "var(--color-red-600, #dc2626)",
                          color: "white",
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        {item.source === "workflowPosts"
                          ? t("library.filters.posts")
                          : t("library.filters.collab")}
                      </span>
                      {group.items.length > 1 && (
                        <span
                          style={{
                            position: "absolute",
                            top: "var(--spacing-2)",
                            right: "var(--spacing-2)",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "999px",
                            background: "rgba(0,0,0,0.6)",
                            color: "white",
                            fontSize: "0.6875rem",
                            fontWeight: 600,
                          }}
                        >
                          {t("library.carouselLabel")} · {group.items.length}
                        </span>
                      )}
                    </div>

                    <div style={{ padding: "var(--spacing-4)", display: "flex", flexDirection: "column", gap: "var(--spacing-3)" }}>
                      <h3
                        className="dash-section-title"
                        style={{ marginBottom: 0, fontSize: "0.9375rem", lineHeight: 1.35 }}
                      >
                        {getDisplayTitleForCard(item)}
                      </h3>

                      {group.items.length > 1 && (
                        <div style={{ display: "flex", gap: "var(--spacing-2)", flexWrap: "wrap", marginTop: "var(--spacing-2)" }}>
                          {group.items.map((media, idx) => {
                            const isSelected = (carouselIndex[group.groupId] ?? 0) === idx;
                            return (
                              <button
                                key={`${group.groupId}-thumb-${idx}`}
                                type="button"
                                onClick={() => setCarouselIndex((prev) => ({ ...prev, [group.groupId]: idx }))}
                                style={{
                                  width: CAROUSEL_THUMB_SIZE,
                                  height: CAROUSEL_THUMB_SIZE,
                                  padding: 0,
                                  borderRadius: "var(--border-radius-base)",
                                  overflow: "hidden",
                                  border: isSelected ? "3px solid var(--color-primary)" : "1px solid var(--color-border)",
                                  background: "var(--color-bg-secondary)",
                                  cursor: "pointer",
                                  flexShrink: 0,
                                }}
                                aria-label={t("library.carouselGoTo") ? `${t("library.carouselGoTo")} ${idx + 1}` : `Slide ${idx + 1}`}
                              >
                                {isVideoUrl(media.url) ? (
                                  <video
                                    src={media.url}
                                    muted
                                    playsInline
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  />
                                ) : (
                                  <img
                                    src={media.url}
                                    alt=""
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div
                        style={{
                          display: "grid",
                          gap: "0.25rem",
                          fontSize: "0.8125rem",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        <div><strong>{t("library.projects")}:</strong> {item.projectNames.join(", ") || "—"}</div>
                        {item.influencerName && (
                          <div><strong>{t("library.influencer")}:</strong> {item.influencerName}</div>
                        )}
                        {item.networks && item.networks.length > 0 && (
                          <div><strong>{t("library.network")}:</strong> {item.networks.join(", ")}</div>
                        )}
                        {item.type && (
                          <div><strong>{t("library.type")}:</strong> {item.type}</div>
                        )}
                        <div><strong>{t("library.uploadedAt")}:</strong> {formatDate(item.uploadedAt, locale)}</div>
                        {item.scheduledAt && (
                          <div><strong>{t("library.scheduledAt")}:</strong> {formatDate(item.scheduledAt, locale)}</div>
                        )}
                        {item.status && (
                          <div><strong>{t("library.status")}:</strong> {item.status}</div>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: "var(--spacing-2)", marginTop: "var(--spacing-2)" }}>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="page-hero-btn"
                          style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}
                        >
                          <ExternalLink size={16} />
                          {t("library.open")}
                        </a>
                        <a
                          href={item.url}
                          download
                          className="page-hero-btn"
                          style={{
                            flex: 1,
                            justifyContent: "center",
                            textDecoration: "none",
                            background: "var(--color-gray-100)",
                            color: "var(--color-text-primary)",
                          }}
                        >
                          <Download size={16} />
                          {t("library.download")}
                        </a>
                      </div>
                      {(canUpdate("library") || canDelete("library")) && (
                        <div style={{ display: "flex", gap: "var(--spacing-2)", marginTop: "var(--spacing-2)", flexWrap: "wrap" }}>
                          {canUpdate("library") && (
                            <Link
                              href={item.source === "workflowPosts" ? `/posts/${group.groupId}/edit` : "/collab"}
                              className="page-hero-btn"
                              style={{
                                flex: 1,
                                minWidth: "120px",
                                justifyContent: "center",
                                textDecoration: "none",
                                background: "var(--color-primary-100)",
                                color: "var(--color-primary-700)",
                              }}
                            >
                              <Pencil size={16} />
                              {t("common.edit")}
                            </Link>
                          )}
                          {canDelete("library") && (
                            <button
                              type="button"
                              onClick={() => handleDeleteLibraryItem(group.groupId, item.source)}
                              disabled={deletingId === group.groupId}
                              className="page-hero-btn"
                              style={{
                                flex: 1,
                                minWidth: "120px",
                                justifyContent: "center",
                                background: "#fef2f2",
                                color: "#b91c1c",
                                border: "1px solid #fecaca",
                              }}
                            >
                              <Trash2 size={16} />
                              {deletingId === group.groupId ? "..." : t("common.delete")}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default LibraryPage;
