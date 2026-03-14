import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/router";
import EmojiPicker from "@/components/EmojiPicker";
import { normalizeMediaUrl } from "@/lib/utils";
import { uploadFileWithProgress } from "@/lib/uploadWithProgress";
import { useTranslation } from "@/i18n/TranslationContext";
import Breadcrumbs from "@/components/Breadcrumbs";
import {
  Image as ImageIcon,
  Video,
  Hash,
  Send,
  Upload,
  X,
  Facebook,
  Instagram,
  Music,
  FileText,
  Film,
  Layers,
  AlignLeft,
  Sparkles,
  Palette,
  Monitor,
  MessageCircle,
  Check,
  Calendar,
  Briefcase
} from "lucide-react";

type Post = {
  _id?: string;
  projectId: string;
  projectIds: string[];
  networks: string[];
  type: "post" | "story" | "reel" | "carousel";
  description?: string;
  caption?: string;
  descriptionIt?: string;
  captionIt?: string;
  hashtags?: string;
  scheduledAt: string;
  mediaUrls: string[];
  assignedTo?: "infographiste" | "video_motion";
};

export default function NewPostPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [form, setForm] = useState<Post>({
    projectId: "DEMO",
    projectIds: [],
    networks: ["instagram"],
    type: "post",
    description: "",
    caption: "",
    descriptionIt: "",
    captionIt: "",
    hashtags: "",
    scheduledAt: new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 16),
    mediaUrls: [],
    assignedTo: "infographiste",
  });
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ percent: number; currentFile?: string; current?: number; total?: number } | null>(null);
  const [projects, setProjects] = useState<any[]>([]);

  const descriptionRef = useRef<HTMLInputElement>(null);
  const captionRef = useRef<HTMLTextAreaElement>(null);
  const hashtagsRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        setProjects(data.projects || []);
        if (data.projects && data.projects.length > 0) {
          setForm((f) => ({
            ...f,
            projectId: data.projects[0]._id,
            projectIds: [data.projects[0]._id],
          }));
        }
      })
      .catch(console.error);
  }, []);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const total = files.length;
    setUploadProgress({ percent: 0, current: 0, total, currentFile: files[0]?.name });
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      setUploadProgress({ percent: 0, current: i + 1, total, currentFile: files[i].name });
      try {
        const u = await uploadFileWithProgress(files[i], (percent) => {
          setUploadProgress({ percent, current: i + 1, total, currentFile: files[i].name });
        });
        urls.push(u);
      } catch (err) {
        console.error("Upload error:", err);
        alert(`Erreur lors de l'upload du fichier ${files[i].name}`);
      }
    }
    setForm((prev) => ({ ...prev, mediaUrls: [...prev.mediaUrls, ...urls] }));
    setUploading(false);
    setUploadProgress(null);
  };

  const removeMedia = (index: number) => {
    setForm((prev) => ({
      ...prev,
      mediaUrls: prev.mediaUrls.filter((_, i) => i !== index),
    }));
  };

  const insertEmoji = (field: "description" | "caption" | "hashtags", emoji: string) => {
    const ref = field === "description" ? descriptionRef : field === "caption" ? captionRef : hashtagsRef;
    const input = ref.current;
    if (!input) {
      setForm((prev) => ({ ...prev, [field]: (prev[field] || "") + emoji }));
      return;
    }
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const text = form[field] || "";
    const newText = text.slice(0, start) + emoji + text.slice(end);
    setForm((prev) => ({ ...prev, [field]: newText }));
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const toggleNetwork = (network: string) => {
    const networks = form.networks.includes(network)
      ? form.networks.filter((n) => n !== network)
      : [...form.networks, network];
    setForm((prev) => ({ ...prev, networks }));
  };

  const createPost = async () => {
    if (form.networks.length === 0) {
      alert(t("posts.selectPlatform") || "Veuillez sélectionner au moins une plateforme");
      return;
    }
    const hasProjects = form.projectIds?.length > 0 || (form.projectId && form.projectId !== "DEMO");
    if (!hasProjects) {
      if (projects.length === 0) {
        alert(t("posts.selectProject") || "Aucun projet disponible. Créez d'abord un projet.");
        return;
      }
      alert(t("posts.selectProject") || "Veuillez sélectionner au moins un projet.");
      return;
    }
    const finalProjectIds = form.projectIds?.length > 0 ? form.projectIds : [form.projectId];
    setCreating(true);
    try {
      const body = {
        ...form,
        projectId: finalProjectIds[0],
        projectIds: finalProjectIds,
        networks: form.networks,
        descriptionIt: form.descriptionIt || undefined,
        captionIt: form.captionIt || undefined,
        mediaUrls: Array.isArray(form.mediaUrls) ? form.mediaUrls : [],
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      };
      await axios.post("/api/posts", body);
      alert(
        `✅ ${t("common.success")} — ${form.networks.length} ${form.networks.length > 1 ? "plateformes" : "plateforme"} (${form.networks.join(", ")})`
      );
      router.push("/workflow");
    } catch (e: any) {
      const errMsg = e.response?.data?.error || e.message;
      const details = e.response?.data?.details || "";
      let msg = `❌ ${errMsg}`;
      if (details) msg += `\n\n${details}`;
      alert(msg);
    } finally {
      setCreating(false);
    }
  };

  const networks = [
    { value: "instagram", label: "Instagram", icon: Instagram, color: "#e4405f" },
    { value: "facebook", label: "Facebook", icon: Facebook, color: "#1877f2" },
    { value: "tiktok", label: "TikTok", icon: Music, color: "#000" },
    { value: "threads", label: "Threads", icon: MessageCircle, color: "#101010" },
  ];

  const postTypes = [
    { value: "post", label: "Post", icon: FileText },
    { value: "story", label: "Story", icon: Film },
    { value: "reel", label: "Reel", icon: Video },
    { value: "carousel", label: "Carousel", icon: Layers },
  ];

  return (
    <div className="page-container">
      <div className="page-content dash post-new-page">
        <div className="page-hero">
          <div className="page-hero-inner">
            <div className="page-hero-text">
              <div className="page-hero-breadcrumbs">
                <Breadcrumbs
                  items={[
                    { label: t("menu.posts") || "Posts", href: "/posts" },
                    { label: t("posts.new") },
                  ]}
                />
              </div>
              <h1 className="page-hero-title">{t("posts.new")}</h1>
              <p className="page-hero-subtitle">{t("dashboard.quickAction.createPostDesc")}</p>
            </div>
            <div className="page-hero-actions">
              <span className="post-new-badge">
                <Sparkles size={16} />
                {form.networks.length} {form.networks.length > 1 ? "plateformes" : "plateforme"}
              </span>
              <Link href="/" className="page-hero-btn">
                {t("common.back")}
              </Link>
            </div>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); createPost(); }}>
          <div className="post-new-grid">
            {/* Colonne gauche – configuration */}
            <div className="dash-section" style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-5)" }}>
              <div className="post-new-card">
                <h3 className="post-new-label">
                  <Briefcase size={14} />
                  {t("common.project")} ({form.projectIds.length})
                </h3>
                {projects.length === 0 ? (
                  <p className="dash-calendar-overlay-empty">{t("posts.createFirst")}</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)", maxHeight: "200px", overflowY: "auto" }}>
                    {projects.map((project) => {
                      const isSelected = form.projectIds.includes(project._id);
                      return (
                        <div
                          key={project._id}
                          className={`post-new-select-item ${isSelected ? "is-selected" : ""}`}
                          onClick={() => {
                            const next = isSelected
                              ? form.projectIds.filter((id) => id !== project._id)
                              : [...form.projectIds, project._id];
                            setForm((prev) => ({
                              ...prev,
                              projectIds: next,
                              projectId: next[0] || project._id,
                            }));
                          }}
                        >
                          <div className="post-new-select-item-check">
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
                              {project.name}
                            </div>
                            {project.client && (
                              <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>{project.client}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="post-new-card">
                <h3 className="post-new-label">{t("posts.assignedTo")}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
                  {[
                    { value: "infographiste" as const, label: "Infographiste", desc: "Design graphique, visuels", icon: Palette, color: "#ec4899" },
                    { value: "video_motion" as const, label: "Vidéo Motion", desc: "Vidéos, animations", icon: Monitor, color: "#8b5cf6" },
                  ].map(({ value, label, desc, icon: Icon, color }) => {
                    const isSelected = form.assignedTo === value;
                    return (
                      <div
                        key={value}
                        className={`post-new-select-item ${isSelected ? "is-selected" : ""}`}
                        onClick={() => setForm((prev) => ({ ...prev, assignedTo: value }))}
                        style={isSelected ? { borderColor: color, background: `${color}12` } : undefined}
                      >
                        <div
                          className="post-new-select-item-check"
                          style={isSelected ? { background: color, borderColor: color } : undefined}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: isSelected ? color : "var(--color-gray-100)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon size={20} style={{ color: isSelected ? "white" : "var(--color-text-secondary)" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: isSelected ? color : "var(--color-text-primary)" }}>
                            {label}
                          </div>
                          <div style={{ fontSize: "0.6875rem", color: "var(--color-text-secondary)" }}>{desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="post-new-card">
                <h3 className="post-new-label">{t("posts.socialNetworks")}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
                  {networks.map((n) => {
                    const Icon = n.icon;
                    const isSelected = form.networks.includes(n.value);
                    return (
                      <div
                        key={n.value}
                        className={`post-new-select-item ${isSelected ? "is-selected" : ""}`}
                        onClick={() => toggleNetwork(n.value)}
                        style={isSelected ? { borderColor: n.color, background: `${n.color}12` } : undefined}
                      >
                        <div
                          className="post-new-select-item-check"
                          style={isSelected ? { background: n.color, borderColor: n.color } : undefined}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                        <Icon size={18} style={{ color: isSelected ? n.color : "var(--color-text-secondary)" }} />
                        <span style={{ fontSize: "0.875rem", fontWeight: isSelected ? 600 : 500, color: isSelected ? n.color : "var(--color-text-primary)" }}>
                          {n.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="post-new-card">
                <h3 className="post-new-label">{t("posts.contentType")}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--spacing-2)" }}>
                  {postTypes.map((pt) => {
                    const Icon = pt.icon;
                    const isSelected = form.type === pt.value;
                    return (
                      <div
                        key={pt.value}
                        className={`post-new-select-item ${isSelected ? "is-selected" : ""}`}
                        onClick={() => setForm((prev) => ({ ...prev, type: pt.value as Post["type"] }))}
                        style={{ flexDirection: "column", textAlign: "center" }}
                      >
                        <Icon size={20} style={{ margin: "0 auto", color: isSelected ? "var(--color-primary)" : "var(--color-text-secondary)" }} />
                        <span style={{ fontSize: "0.75rem", fontWeight: isSelected ? 700 : 500 }}>{pt.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="post-new-card">
                <h3 className="post-new-label">
                  <Calendar size={14} />
                  {t("posts.scheduledAt")}
                </h3>
                <input
                  type="datetime-local"
                  className="post-new-input"
                  value={form.scheduledAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, scheduledAt: e.target.value }))}
                />
              </div>
            </div>

            {/* Colonne droite – contenu */}
            <div className="dash-section" style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-5)" }}>
              <div className="post-new-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-3)" }}>
                  <label className="post-new-label" style={{ marginBottom: 0 }}>
                    <AlignLeft size={14} />
                    {t("posts.description")}
                  </label>
                  <EmojiPicker onSelect={(emoji) => insertEmoji("description", emoji)} />
                </div>
                <input
                  ref={descriptionRef}
                  type="text"
                  className="post-new-input"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder={`${t("posts.description")} (non publié)…`}
                />
              </div>

              {/* Description (italien) */}
              <div className="post-new-card">
                <label className="post-new-label" style={{ marginBottom: "var(--spacing-3)" }}>
                  <AlignLeft size={14} />
                  {t("posts.descriptionIt")}
                </label>
                <input
                  type="text"
                  className="post-new-input"
                  value={form.descriptionIt}
                  onChange={(e) => setForm((prev) => ({ ...prev, descriptionIt: e.target.value }))}
                  placeholder={t("posts.descriptionItPlaceholder")}
                />
              </div>

              <div className="post-new-card" style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-3)" }}>
                  <label className="post-new-label" style={{ marginBottom: 0 }}>
                    <FileText size={14} />
                    {t("posts.caption")}
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)" }}>
                    <span style={{ fontSize: "0.6875rem", color: "var(--color-text-secondary)", fontWeight: 600 }}>
                      {form.caption?.length ?? 0} / 2200
                    </span>
                    <EmojiPicker onSelect={(emoji) => insertEmoji("caption", emoji)} />
                  </div>
                </div>
                <textarea
                  ref={captionRef}
                  className="post-new-textarea"
                  value={form.caption}
                  onChange={(e) => setForm((prev) => ({ ...prev, caption: e.target.value }))}
                  placeholder="Écrivez la légende… @mentions #hashtags"
                  rows={6}
                />
              </div>

              {/* Caption (italien) */}
              <div className="post-new-card" style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-3)" }}>
                  <label className="post-new-label" style={{ marginBottom: 0 }}>
                    <FileText size={14} />
                    {t("posts.captionIt")}
                  </label>
                  <span style={{ fontSize: "0.6875rem", color: "var(--color-text-secondary)", fontWeight: 600 }}>
                    {form.captionIt?.length ?? 0} / 2200
                  </span>
                </div>
                <textarea
                  className="post-new-textarea"
                  value={form.captionIt}
                  onChange={(e) => setForm((prev) => ({ ...prev, captionIt: e.target.value }))}
                  placeholder={t("posts.captionItPlaceholder")}
                  rows={6}
                />
              </div>

              <div className="post-new-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-3)" }}>
                  <label className="post-new-label" style={{ marginBottom: 0 }}>
                    <Hash size={14} />
                    {t("posts.hashtags")}
                  </label>
                  <EmojiPicker onSelect={(emoji) => insertEmoji("hashtags", emoji)} />
                </div>
                <input
                  ref={hashtagsRef}
                  type="text"
                  className="post-new-input"
                  value={form.hashtags}
                  onChange={(e) => setForm((prev) => ({ ...prev, hashtags: e.target.value }))}
                  placeholder="#marketing #socialmedia #content"
                />
              </div>

              <div className="post-new-card">
                <h3 className="post-new-label">{t("posts.media")} ({form.mediaUrls.length})</h3>
                <label className="post-new-upload-zone">
                  <input type="file" multiple accept="image/*,video/*" onChange={onFile} disabled={uploading} style={{ display: "none" }} />
                  {uploading ? (
                    <>
                      <div style={{ width: 56, height: 56, borderRadius: 12, background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--spacing-3)" }}>
                        <Upload size={28} color="white" strokeWidth={2} />
                      </div>
                      <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-primary)" }}>{t("common.loading") || "Chargement…"}</p>
                      {uploadProgress && (
                        <div style={{ width: "100%", maxWidth: 240, margin: "0 auto" }}>
                          {uploadProgress.currentFile && (
                            <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginBottom: 4 }}>
                              {uploadProgress.currentFile.length > 24 ? uploadProgress.currentFile.slice(0, 24) + "…" : uploadProgress.currentFile}
                              {uploadProgress.total && uploadProgress.total > 1 ? ` (${uploadProgress.current}/${uploadProgress.total})` : ""}
                            </p>
                          )}
                          <div style={{ height: 8, borderRadius: 4, background: "var(--color-border)", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${uploadProgress.percent}%`, background: "var(--color-primary)", transition: "width 0.2s ease" }} />
                          </div>
                          <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: 4 }}>{uploadProgress.percent}%</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <Upload size={40} strokeWidth={1.5} style={{ opacity: 0.4, margin: "0 auto var(--spacing-3)", display: "block" }} />
                      <p style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "0.25rem" }}>{t("posts.addMedia")}</p>
                      <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>PNG, JPG, MP4 · max 100 Mo</p>
                    </>
                  )}
                </label>
                {form.mediaUrls.length > 0 && (
                  <div className="post-new-media-grid">
                    {form.mediaUrls.map((url, i) => {
                      const normalizedUrl = normalizeMediaUrl(url);
                      const isVideo = /\.mp4($|\?)/i.test(url);
                      return (
                        <div key={i} className="post-new-media-item">
                          {isVideo ? (
                            <video src={normalizedUrl} controls playsInline style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                          ) : (
                            <img src={normalizedUrl} alt="" />
                          )}
                          <button type="button" className="post-new-media-remove" onClick={() => removeMedia(i)} aria-label={t("common.remove")}>
                            <X size={14} strokeWidth={2.5} />
                          </button>
                          <span className="post-new-media-badge">
                            {isVideo ? <Video size={10} /> : <ImageIcon size={10} />}
                            {isVideo ? "Vidéo" : "Image"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="post-new-actions">
                <Link href="/" style={{ flex: 1 }}>
                  <button type="button" className="btn btn-secondary" style={{ width: "100%" }}>
                    {t("common.cancel")}
                  </button>
                </Link>
                <button
                  type="submit"
                  disabled={creating || uploading || form.networks.length === 0}
                  className="btn btn-primary"
                  style={{
                    opacity: creating || uploading || form.networks.length === 0 ? 0.6 : 1,
                    cursor: creating || uploading || form.networks.length === 0 ? "not-allowed" : "pointer",
                    flex: 2,
                  }}
                >
                  {creating ? (
                    t("common.saving")
                  ) : (
                    <>
                      <Send size={16} strokeWidth={2.5} />
                      {t("posts.create")}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
