import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { Plus, Clock, CheckCircle, FileText, Eye, Filter, X as XIcon, Edit, Calendar as CalendarIcon, AlertCircle, Trash2, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/i18n/TranslationContext";
import { getDisplayCaptionPost, useTranslatePostDescriptionsWhenIt } from "@/lib/i18n-content";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getMediaUrlForContext } from "@/lib/utils";
import EmptyState from "@/components/EmptyState";

type Post = {
  _id: string;
  projectId: string;
  network?: string;
  networks?: string[];
  type: string;
  description?: string;
  caption?: string;
  captionIt?: string;
  descriptionIt?: string;
  hashtags?: string;
  scheduledAt: string;
  mediaUrls?: string[];
  status: string;
  sentiment?: string;
  insights?: {
    impressions?: number;
    reach?: number;
    engagement?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    video_views?: number;
  };
};

export default function PostsListPage() {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [posts, setPosts] = useState<Post[]>([]);
  useTranslatePostDescriptionsWhenIt(language, posts, setPosts as any);
  const [projects, setProjects] = useState<any[]>([]);
  const [projectFilter, setProjectFilter] = useState("all");
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [deletingPost, setDeletingPost] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [postsRes, projectsRes] = await Promise.all([
        axios.get("/api/posts"),
        axios.get("/api/projects")
      ]);
      setPosts(postsRes.data.posts || []);
      setProjects(projectsRes.data.projects || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user || user.role !== 'admin') return;
    
    if (!confirm(t('posts.deleteConfirm'))) {
      return;
    }

    setDeletingPost(postId);
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setPosts(posts.filter(p => p._id !== postId));
        alert(t('posts.deleteSuccess'));
      } else {
        const error = await response.json();
        alert(`${t('common.error')}: ${error.error || t('posts.deleteError')}`);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert(t('posts.deleteError'));
    } finally {
      setDeletingPost(null);
    }
  };

  const isAdmin = user?.role === 'admin';

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p._id === projectId);
    return project?.name || projectId;
  };

  const filteredPosts = posts.filter(post => 
    projectFilter === "all" || post.projectId === projectFilter
  );

  // Categorize posts
  const publishedPosts = filteredPosts.filter(p => p.status === "PUBLISHED");
  const scheduledPosts = filteredPosts.filter(p => p.status === "SCHEDULED");
  const reviewPosts = filteredPosts.filter(p => p.status === "CLIENT_REVIEW");

  const stats = {
    total: posts.length,
    published: publishedPosts.length,
    scheduled: scheduledPosts.length,
    review: reviewPosts.length,
    draft: posts.filter(p => p.status === "DRAFT").length,
    totalReach: publishedPosts.reduce((sum, p) => sum + (p.insights?.reach || 0), 0),
    totalEngagement: publishedPosts.reduce((sum, p) => sum + (p.insights?.engagement || 0), 0)
  };

  const statusConfig: any = {
    DRAFT: { label: t('workflow.statuses.draft'), color: "#f59e0b", emoji: "📝" },
    PENDING_GRAPHIC: { label: t('workflow.statuses.creation'), color: "#8b5cf6", emoji: "🎨" },
    CLIENT_REVIEW: { label: t('posts.inReview'), color: "#3b82f6", emoji: "👁️" },
    SCHEDULED: { label: t('posts.validatedPlanned'), color: "#10b981", emoji: "📅" },
    PUBLISHED: { label: t('posts.published'), color: "#6366f1", emoji: "✓" },
    FAILED: { label: t('workflow.statuses.failed'), color: "#ef4444", emoji: "❌" }
  };

  const networkColors: any = {
    instagram: "#e4405f",
    facebook: "#1877f2",
    tiktok: "#000000"
  };

  const networkIcons: any = {
    instagram: "📷",
    facebook: "📘",
    tiktok: "🎵"
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const PostCard = ({ post }: { post: Post }) => {
    const networks = post.networks || [post.network];
    const config = statusConfig[post.status] || { label: post.status, color: "#666", emoji: "📝" };
    const isExpanded = expandedPost === post._id;

    return (
      <div
        className={`posts-card ${isExpanded ? "posts-card-expanded" : ""}`}
        style={{ borderLeftWidth: "3px", borderLeftStyle: "solid", borderLeftColor: config.color }}
      >
        <div className="posts-card-inner">
          <div className="posts-card-head">
            <div style={{ flex: 1 }}>
              <div className="posts-card-tags">
                {networks.map((network, idx) => (
                  <span
                    key={idx}
                    className="posts-card-tag"
                    style={{ background: networkColors[network] + "20", color: networkColors[network] }}
                  >
                    {networkIcons[network]} {network}
                  </span>
                ))}
                <span className="posts-card-tag" style={{ background: "#f0f0f0", color: "var(--color-text-primary)" }}>
                  {post.type}
                </span>
                <span className="posts-card-tag" style={{ background: config.color + "20", color: config.color }}>
                  {config.emoji} {config.label}
                </span>
                {post.status === "PUBLISHED" && post.sentiment && (
                  <span
                    className="posts-card-tag"
                    style={{
                      background: post.sentiment === "positive" ? "#d1fae5" : post.sentiment === "negative" ? "#fee2e2" : "#e0e7ff",
                      color: post.sentiment === "positive" ? "#065f46" : post.sentiment === "negative" ? "#dc2626" : "#6366f1"
                    }}
                  >
                    {post.sentiment === "positive" ? "😊" : post.sentiment === "negative" ? "😞" : "😐"}{" "}
                    {post.sentiment === "positive" ? "Positif" : post.sentiment === "negative" ? "Négatif" : "Neutre"}
                  </span>
                )}
              </div>
              <div className="posts-card-meta">
                💼 {getProjectName(post.projectId)} • 📅{" "}
                {new Date(post.scheduledAt).toLocaleString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setExpandedPost(isExpanded ? null : post._id)}
              className={isExpanded ? "posts-btn-primary" : "posts-btn-secondary"}
              style={isExpanded ? { color: "white", background: "var(--color-primary)", borderColor: "var(--color-primary)" } : undefined}
            >
              {isExpanded ? t("common.close") : t("common.details")}
            </button>
          </div>

          <p className="posts-card-caption">{getDisplayCaptionPost(post, language) || t("posts.withoutCaption")}</p>

          {post.hashtags && <div className="posts-card-hashtags">{post.hashtags}</div>}

          {!isExpanded && post.mediaUrls && post.mediaUrls.length > 0 && (
            <div className="posts-card-media-preview">
              {post.mediaUrls.slice(0, 4).map((url, idx) => {
                const previewUrl = getMediaUrlForContext(url, "preview");
                return (
                  <div key={idx} className="posts-card-media-item">
                    {url.match(/\.mp4($|\?)/i) ? (
                      <video src={previewUrl} controls playsInline style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    ) : (
                      <img src={previewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {isExpanded && (
            <div className="posts-card-expanded-block">
              {post.mediaUrls && post.mediaUrls.length > 0 && (
                <div style={{ marginBottom: "var(--spacing-4)" }}>
                  <h4 className="posts-card-expanded-title">📷 Médias ({post.mediaUrls.length})</h4>
                  <div className="posts-card-media-grid">
                    {post.mediaUrls.map((url, idx) => {
                      const normalizedUrl = getMediaUrlForContext(url, "preview");
                      const isVideo = url.match(/\.mp4($|\?)/i);
                      return (
                        <div
                          key={idx}
                          className="posts-card-media-grid-item"
                          onClick={() => window.open(normalizedUrl, "_blank")}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === "Enter" && window.open(normalizedUrl, "_blank")}
                        >
                          {isVideo ? (
                            <video src={normalizedUrl} controls playsInline style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                          ) : (
                            <img src={normalizedUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          )}
                          <span className="posts-card-badge">{isVideo ? "🎥" : "🖼️"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {post.description && (
                <div style={{ marginBottom: "var(--spacing-4)" }}>
                  <h4 className="posts-card-expanded-title">Description interne</h4>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: 1.45, margin: 0 }}>
                    {post.description}
                  </p>
                </div>
              )}

              <div className="posts-card-actions">
                <Link href={`/posts/${post._id}/edit`} className="posts-btn-secondary" style={{ flex: 1 }}>
                  <Edit size={14} />
                  Modifier
                </Link>
                <Link href="/workflow" className="posts-btn-primary" style={{ flex: 1, textAlign: "center" }}>
                  ⚡ Workflow
                </Link>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDeletePost(post._id)}
                    disabled={deletingPost === post._id}
                    className="posts-btn-danger"
                  >
                    <Trash2 size={14} />
                    {deletingPost === post._id ? "Suppression..." : "Supprimer"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="page-content">
      <div className="dash">
        <div className="page-hero">
          <div className="page-hero-inner">
            <div className="page-hero-text">
              <div className="page-hero-breadcrumbs">
                <Breadcrumbs items={[{ label: t("menu.dashboard"), href: "/" }, { label: t("posts.allPosts") }]} />
              </div>
              <h1 className="page-hero-title">{t("posts.allPosts")}</h1>
              <p className="page-hero-subtitle">
                {filteredPosts.length} post{filteredPosts.length !== 1 ? "s" : ""}
                {isAdmin ? ` • ${t("posts.adminAccess")}` : ""}
              </p>
            </div>
            <div className="page-hero-actions">
              <Link href="/posts/new" className="page-hero-btn">
                <Plus size={18} strokeWidth={2.5} />
                {t("posts.newPost")}
              </Link>
            </div>
          </div>
        </div>

        <div className="dash-kpis posts-kpis-refined">
          <div className="dash-kpi">
            <div className="dash-kpi-icon">
              <FileText size={24} strokeWidth={2.5} />
            </div>
            <div className="dash-kpi-body">
              <div className="dash-kpi-value posts-kpi-total">{stats.total}</div>
              <div className="dash-kpi-label">{t("posts.totalPosts")}</div>
            </div>
          </div>
          <div className="dash-kpi">
            <div className="dash-kpi-icon" style={{ background: "#e0e7ff", color: "#6366f1" }}>
              <CheckCircle size={24} strokeWidth={2.5} />
            </div>
            <div className="dash-kpi-body">
              <div className="dash-kpi-value posts-kpi-published">{stats.published}</div>
              <div className="dash-kpi-label">✓ {t("posts.published")}</div>
            </div>
          </div>
          <div className="dash-kpi">
            <div className="dash-kpi-icon" style={{ background: "#d1fae5", color: "#059669" }}>
              <CalendarIcon size={24} strokeWidth={2.5} />
            </div>
            <div className="dash-kpi-body">
              <div className="dash-kpi-value posts-kpi-scheduled">{stats.scheduled}</div>
              <div className="dash-kpi-label">📅 {t("posts.validated")}</div>
            </div>
          </div>
          <div className="dash-kpi">
            <div className="dash-kpi-icon" style={{ background: "#dbeafe", color: "#3b82f6" }}>
              <Eye size={24} strokeWidth={2.5} />
            </div>
            <div className="dash-kpi-body">
              <div className="dash-kpi-value posts-kpi-review">{stats.review}</div>
              <div className="dash-kpi-label">👁️ {t("posts.inReview")}</div>
            </div>
          </div>
          <div className="dash-kpi">
            <div className="dash-kpi-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
              <FileText size={24} strokeWidth={2.5} />
            </div>
            <div className="dash-kpi-body">
              <div className="dash-kpi-value posts-kpi-draft">{stats.draft}</div>
              <div className="dash-kpi-label">📝 {t("posts.draft")}</div>
            </div>
          </div>
        </div>

        <section className="dash-section posts-section">
          <div className="dash-calendar-card">
            <div className="dash-calendar-filters">
              <div className="dash-filter-group">
                <label className="dash-filter-label">{t("common.project")}</label>
                <select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  className="dash-filter-select"
                >
                  <option value="all">{t("workflow.allProjects")}</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="dash-calendar-body">
              {filteredPosts.length === 0 ? (
                <div className="empty-state-wrapper">
                  <EmptyState
                  icon={FileText}
                  title={t("posts.noPosts") || "Aucun post"}
                  description={t("posts.createFirst") || "Créez votre premier post"}
                  action={
                    <Link href="/posts/new" className="posts-btn-primary">
                      <Plus size={18} />
                      Nouveau post
                    </Link>
                  }
                />
                </div>
              ) : (
                <>
                  {publishedPosts.length > 0 && (
                    <div style={{ marginBottom: "var(--spacing-6)" }}>
                      <h2 className="dash-section-title" style={{ marginBottom: "var(--spacing-3)" }}>
                        ✓ {t("posts.published")}
                      </h2>
                      <div className="posts-list">
                        {publishedPosts.map((post) => (
                          <PostCard key={post._id} post={post} />
                        ))}
                      </div>
                    </div>
                  )}
                  {scheduledPosts.length > 0 && (
                    <div style={{ marginBottom: "var(--spacing-6)" }}>
                      <h2 className="dash-section-title" style={{ marginBottom: "var(--spacing-3)" }}>
                        📅 {t("posts.validatedPostsAwaiting")}
                      </h2>
                      <div className="posts-list">
                        {scheduledPosts.map((post) => (
                          <PostCard key={post._id} post={post} />
                        ))}
                      </div>
                    </div>
                  )}
                  {reviewPosts.length > 0 && (
                    <div style={{ marginBottom: "var(--spacing-6)" }}>
                      <h2 className="dash-section-title" style={{ marginBottom: "var(--spacing-3)" }}>
                        👁️ {t("posts.postsUnderReview")}
                      </h2>
                      <div className="posts-list">
                        {reviewPosts.map((post) => (
                          <PostCard key={post._id} post={post} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
