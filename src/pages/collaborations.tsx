import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { Users, Plus, TrendingUp, DollarSign, CheckCircle, X as XIcon, Trash2, Eye } from "lucide-react";
import { useTranslation } from "@/i18n/TranslationContext";
import { useAuth } from "@/contexts/AuthContext";
import { getDisplayDescriptionCollab, useTranslateCollabDescriptionsWhenIt } from "@/lib/i18n-content";

type Collaboration = {
  _id: string;
  influencerId: string;
  projectId: string;
  description: string;
  descriptionIt?: string;
  captionFr?: string;
  captionIt?: string;
  contentType?: "reel" | "story";
  platforms?: string[];
  budget: number;
  startDate: string;
  endDate: string;
  status: string;
  createdBy: string;
  createdAt: string;
  contentUploads?: Array<{
    uploadedBy: string;
    role: string;
    urls: string[];
    description: string;
    uploadedAt: string;
    validatedByClient?: boolean;
    scheduledAt?: string;
    publishedAt?: string;
    platform?: string;
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
  }>;
};

type Influencer = {
  _id: string;
  name: string;
  platforms?: any[];
};

type Project = {
  _id: string;
  name: string;
};

export default function CollaborationsPage() {
  const { t, language } = useTranslation();
  const { canSeeBudgetAndTarifs } = useAuth();
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  useTranslateCollabDescriptionsWhenIt(language, collaborations, setCollaborations);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [newCollab, setNewCollab] = useState({
    influencerId: "",
    projectId: "",
    contentType: "reel" as "reel" | "story",
    platforms: [] as string[],
    description: "",
    descriptionIt: "",
    captionFr: "",
    captionIt: "",
    budget: "",
    startDate: "",
    endDate: "",
    createdBy: "Digital Marketer"
  });

  const COLLAB_PLATFORMS = ["instagram", "facebook", "tiktok", "youtube", "x", "snapchat", "linkedin", "threads"] as const;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [collabRes, influencersRes, projectsRes] = await Promise.all([
        axios.get("/api/collaborations"),
        axios.get("/api/influencers"),
        axios.get("/api/projects")
      ]);
      setCollaborations(collabRes.data.collaborations || []);
      setInfluencers(influencersRes.data.influencers || []);
      setProjects(projectsRes.data.projects || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleCreate = async () => {
    try {
      await axios.post("/api/collaborations", {
        ...newCollab,
        descriptionIt: newCollab.descriptionIt?.trim() || undefined,
        captionFr: newCollab.captionFr?.trim() || undefined,
        captionIt: newCollab.captionIt?.trim() || undefined,
        contentType: newCollab.contentType,
        platforms: newCollab.platforms.length > 0 ? newCollab.platforms : undefined,
        budget: canSeeBudgetAndTarifs() ? parseFloat(newCollab.budget) : 0,
        status: "pending"
      });
      setShowModal(false);
      setNewCollab({
        influencerId: "",
        projectId: "",
        contentType: "reel",
        platforms: [],
        description: "",
        descriptionIt: "",
        captionFr: "",
        captionIt: "",
        budget: "",
        startDate: "",
        endDate: "",
        createdBy: "Digital Marketer"
      });
      await loadData();
      alert(t('collaborations.createSuccess'));
    } catch (error) {
      console.error("Error creating collaboration:", error);
      alert(t('collaborations.createError'));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('collaborations.deleteConfirm'))) {
      try {
        await axios.delete(`/api/collaborations/${id}`);
        await loadData();
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  const getInfluencerName = (id: string) => {
    const influencer = influencers.find(i => i._id === id);
    return influencer?.name || t('reports.unknown');
  };

  const getProjectName = (id: string) => {
    const project = projects.find(p => p._id === id);
    return project?.name || t('reports.unknown');
  };

  const filteredCollabs = statusFilter === "all" 
    ? collaborations 
    : collaborations.filter(c => c.status === statusFilter);

  // Statistics
  const stats = {
    total: collaborations.length,
    active: collaborations.filter(c => c.status === "active").length,
    completed: collaborations.filter(c => c.status === "completed").length,
    totalBudget: collaborations.reduce((sum, c) => sum + (c.budget || 0), 0)
  };

  const statusConfig: any = {
    pending: { label: t('collaborations.statuses.pending'), color: "#f59e0b", emoji: "⏳" },
    active: { label: t('collaborations.statuses.active'), color: "#10b981", emoji: "✅" },
    completed: { label: t('collaborations.statuses.completed'), color: "#6366f1", emoji: "🎉" },
    cancelled: { label: t('collaborations.statuses.cancelled'), color: "#ef4444", emoji: "❌" }
  };

  return (
    <div className="page-container">
      <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
        {/* Header - Style Meta Moderne */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#666", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.25rem" }}>
                🤝 {t('collaborations.badge') || 'Collaborations'}
              </div>
              <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "#111", marginBottom: "0.25rem" }}>
                {t('menu.collaborations')}
              </h1>
              <p style={{ fontSize: "0.9375rem", color: "#666" }}>
                {t('collaborations.subtitle')}
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <Link href="/collab">
                <button className="btn-meta btn-meta-secondary">
                  <Eye size={18} strokeWidth={2} />
                  {t('collaborations.viewWorkflow')}
                </button>
              </Link>
              <button 
                onClick={() => setShowModal(true)}
                className="btn-meta btn-meta-primary"
              >
                <Plus size={18} strokeWidth={2.5} />
                {t('collaborations.newCollaboration')}
              </button>
            </div>
          </div>
        </div>

          {/* Statistics Cards */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem"
          }}>
            <div className="card" style={{ 
              padding: "1.5rem",
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #667eea, #764ba2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white"
                }}>
                  <Users size={24} />
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#666", fontWeight: "700", textTransform: "uppercase" }}>
                    {t('common.all')}
                  </div>
                  <div style={{ fontSize: "2rem", fontWeight: "800", color: "#111" }}>
                    {stats.total}
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ 
              padding: "1.5rem",
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white"
                }}>
                  <CheckCircle size={24} />
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#666", fontWeight: "700", textTransform: "uppercase" }}>
                    {t('reports.active')}
                  </div>
                  <div style={{ fontSize: "2rem", fontWeight: "800", color: "#111" }}>
                    {stats.active}
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ 
              padding: "1.5rem",
              background: "linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.1))"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white"
                }}>
                  <TrendingUp size={24} />
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#666", fontWeight: "700", textTransform: "uppercase" }}>
                    {t('reports.completed')}
                  </div>
                  <div style={{ fontSize: "2rem", fontWeight: "800", color: "#111" }}>
                    {stats.completed}
                  </div>
                </div>
              </div>
            </div>

            {canSeeBudgetAndTarifs() && (
            <div className="card" style={{ 
              padding: "1.5rem",
              background: "linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(219, 39, 119, 0.1))"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #ec4899, #db2777)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white"
                }}>
                  <DollarSign size={24} />
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#666", fontWeight: "700", textTransform: "uppercase" }}>
                    {t('reports.totalBudget')}
                  </div>
                  <div style={{ fontSize: "2rem", fontWeight: "800", color: "#111" }}>
                    {stats.totalBudget.toLocaleString()}€
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>

          {/* Filter */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {["all", "pending", "active", "completed", "cancelled"].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  borderRadius: "8px",
                  border: "2px solid",
                  borderColor: statusFilter === status ? "#6366f1" : "#e5e5e5",
                  background: statusFilter === status ? "#6366f1" : "white",
                  color: statusFilter === status ? "white" : "#666",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {status === "all" ? t('common.all') : statusConfig[status]?.label || status}
              </button>
            ))}
          </div>

          {/* Collaborations List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filteredCollabs.length === 0 ? (
            <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
              <Users size={64} strokeWidth={1} style={{ opacity: 0.2, margin: "0 auto 1rem" }} />
              <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "0.5rem" }}>
                {t('collaborations.noCollaborations')}
              </h3>
              <p style={{ color: "#666", marginBottom: "1.5rem" }}>
                {t('collaborations.createFirst')}
              </p>
              <button 
                onClick={() => setShowModal(true)}
                className="btn"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
              >
                <Plus size={18} />
                {t('collaborations.newCollaboration')}
              </button>
            </div>
          ) : (
            filteredCollabs.map(collab => {
              const config = statusConfig[collab.status] || statusConfig.pending;
              
              return (
                <div 
                  key={collab._id}
                  className="card"
                  style={{
                    padding: "1.5rem",
                    borderLeft: `4px solid ${config.color}`
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                        <h3 style={{ fontSize: "1.125rem", fontWeight: "700", margin: 0 }}>
                          {getInfluencerName(collab.influencerId)}
                        </h3>
                        <span style={{
                          padding: "0.25rem 0.75rem",
                          background: config.color + "20",
                          color: config.color,
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: "700"
                        }}>
                          {config.emoji} {config.label}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "#666", marginBottom: "0.75rem" }}>
                        💼 {t('common.project')}: <strong>{getProjectName(collab.projectId)}</strong>
                      </div>
                      <p style={{ fontSize: "0.875rem", color: "#111", marginBottom: "1rem", lineHeight: "1.6" }}>
                        {getDisplayDescriptionCollab(collab, language)}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <Link href="/collab">
                        <button
                          style={{
                            padding: "0.5rem 0.75rem",
                            background: "#e0e7ff",
                            color: "#6366f1",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.375rem"
                          }}
                        >
                          <Eye size={14} />
                          {t('common.workflow')}
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDelete(collab._id)}
                        style={{
                          padding: "0.5rem",
                          background: "#fee",
                          color: "#e11d48",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer"
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div style={{ 
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "1rem",
                    padding: "1rem",
                    background: "#f8f9fa",
                    borderRadius: "8px"
                  }}>
                    {canSeeBudgetAndTarifs() && (
                    <div>
                      <div style={{ fontSize: "0.6875rem", color: "#999", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.25rem" }}>
                        💰 {t('collaborations.budget')}
                      </div>
                      <div style={{ fontSize: "1.25rem", fontWeight: "800", color: "#111" }}>
                        {collab.budget?.toLocaleString()}€
                      </div>
                    </div>
                    )}
                    <div>
                      <div style={{ fontSize: "0.6875rem", color: "#999", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.25rem" }}>
                        📅 {t('collaborations.start')}
                      </div>
                      <div style={{ fontSize: "0.875rem", fontWeight: "600", color: "#111" }}>
                        {new Date(collab.startDate).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.6875rem", color: "#999", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.25rem" }}>
                        📅 {t('collaborations.end')}
                      </div>
                      <div style={{ fontSize: "0.875rem", fontWeight: "600", color: "#111" }}>
                        {new Date(collab.endDate).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.6875rem", color: "#999", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.25rem" }}>
                        👤 {t('posts.createdBy')}
                      </div>
                      <div style={{ fontSize: "0.875rem", fontWeight: "600", color: "#111" }}>
                        {collab.createdBy}
                      </div>
                    </div>
                  </div>

                  {/* Published Content Stats */}
                  {collab.contentUploads && collab.contentUploads.some(c => c.publishedAt) && (
                    <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "2px solid #e5e5e5" }}>
                      <div style={{ fontSize: "0.875rem", fontWeight: "700", marginBottom: "1rem", color: "#111" }}>
                        📊 {t('collaborations.publishedContent')}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {collab.contentUploads
                          .filter(content => content.publishedAt)
                          .map((content, idx) => (
                            <div 
                              key={idx}
                              style={{
                                padding: "1rem",
                                background: "#f8f9fa",
                                borderRadius: "8px",
                                borderLeft: `4px solid ${
                                  content.sentiment === "positive" ? "#10b981" :
                                  content.sentiment === "negative" ? "#ef4444" :
                                  content.sentiment ? "#6366f1" : "#999"
                                }`
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                  {content.platform && (
                                    <span style={{
                                      padding: "0.25rem 0.5rem",
                                      background: "white",
                                      borderRadius: "4px",
                                      fontSize: "0.75rem",
                                      fontWeight: "700",
                                      textTransform: "capitalize"
                                    }}>
                                      {content.platform === "instagram" ? "📷" :
                                       content.platform === "facebook" ? "📘" :
                                       content.platform === "tiktok" ? "🎵" :
                                       content.platform === "youtube" ? "▶️" :
                                       content.platform === "x" ? "🐦" :
                                       content.platform === "linkedin" ? "💼" : "📱"} {content.platform}
                                    </span>
                                  )}
                                  {content.sentiment && (
                                    <span style={{
                                      padding: "0.25rem 0.5rem",
                                      background: content.sentiment === "positive" ? "#d1fae5" :
                                                 content.sentiment === "negative" ? "#fee2e2" : "#e0e7ff",
                                      color: content.sentiment === "positive" ? "#065f46" :
                                             content.sentiment === "negative" ? "#dc2626" : "#6366f1",
                                      borderRadius: "4px",
                                      fontSize: "0.75rem",
                                      fontWeight: "700"
                                    }}>
                                      {content.sentiment === "positive" ? `😊 ${t('common.positive')}` :
                                       content.sentiment === "negative" ? `😞 ${t('common.negative')}` : `😐 ${t('common.neutral')}`}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: "0.625rem", color: "#999" }}>
                                  {new Date(content.publishedAt).toLocaleDateString('fr-FR')}
                                </div>
                              </div>

                              {content.insights && (
                                <div style={{
                                  display: "grid",
                                  gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                                  gap: "0.5rem"
                                }}>
                                  {content.insights.reach !== undefined && (
                                    <div style={{ textAlign: "center", padding: "0.5rem", background: "white", borderRadius: "4px" }}>
                                      <div style={{ fontSize: "0.875rem", fontWeight: "800", color: "#111" }}>
                                        {content.insights.reach >= 1000 
                                          ? `${(content.insights.reach / 1000).toFixed(1)}K` 
                                          : content.insights.reach}
                                      </div>
                                      <div style={{ fontSize: "0.625rem", color: "#999", fontWeight: "700" }}>{t('reports.reach')}</div>
                                    </div>
                                  )}
                                  {content.insights.likes !== undefined && (
                                    <div style={{ textAlign: "center", padding: "0.5rem", background: "white", borderRadius: "4px" }}>
                                      <div style={{ fontSize: "0.875rem", fontWeight: "800", color: "#111" }}>
                                        {content.insights.likes >= 1000 
                                          ? `${(content.insights.likes / 1000).toFixed(1)}K` 
                                          : content.insights.likes}
                                      </div>
                                      <div style={{ fontSize: "0.625rem", color: "#999", fontWeight: "700" }}>{t('reports.totalLikes')}</div>
                                    </div>
                                  )}
                                  {content.insights.engagement !== undefined && (
                                    <div style={{ textAlign: "center", padding: "0.5rem", background: "white", borderRadius: "4px" }}>
                                      <div style={{ fontSize: "0.875rem", fontWeight: "800", color: "#111" }}>
                                        {content.insights.engagement >= 1000 
                                          ? `${(content.insights.engagement / 1000).toFixed(1)}K` 
                                          : content.insights.engagement}
                                      </div>
                                      <div style={{ fontSize: "0.625rem", color: "#999", fontWeight: "700" }}>{t('reports.engagement')}</div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
          </div>
        </div>

        {/* Create Modal */}
        {showModal && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "2rem"
          }}>
          <div className="card" style={{
            maxWidth: "600px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "2rem",
            position: "relative"
          }}>
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                padding: "0.5rem",
                background: "#fee",
                color: "#e11d48",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              <XIcon size={20} />
            </button>

            <h2 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "1.5rem" }}>
              ✨ {t('collaborations.newCollaboration')}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Influencer */}
              <div>
                <label style={{ 
                  display: "block",
                  fontSize: "0.6875rem",
                  color: "#999",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  marginBottom: "0.5rem"
                }}>
                  {t('common.influencer')} *
                </label>
                <select
                  value={newCollab.influencerId}
                  onChange={(e) => setNewCollab({ ...newCollab, influencerId: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    fontSize: "0.875rem",
                    border: "2px solid #e5e5e5",
                    borderRadius: "8px"
                  }}
                >
                  <option value="">{t('collaborations.selectInfluencer')}</option>
                  {influencers.map(inf => (
                    <option key={inf._id} value={inf._id}>
                      {(inf.name || "").toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Project */}
              <div>
                <label style={{ 
                  display: "block",
                  fontSize: "0.6875rem",
                  color: "#999",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  marginBottom: "0.5rem"
                }}>
                  {t('common.project')} *
                </label>
                <select
                  value={newCollab.projectId}
                  onChange={(e) => setNewCollab({ ...newCollab, projectId: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    fontSize: "0.875rem",
                    border: "2px solid #e5e5e5",
                    borderRadius: "8px"
                  }}
                >
                  <option value="">{t('posts.selectProject')}</option>
                  {projects.map(proj => (
                    <option key={proj._id} value={proj._id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type de contenu */}
              <div>
                <label style={{ 
                  display: "block",
                  fontSize: "0.6875rem",
                  color: "#999",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  marginBottom: "0.5rem"
                }}>
                  {t('collaborations.contentType')} *
                </label>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem" }}>
                    <input
                      type="radio"
                      name="contentType"
                      checked={newCollab.contentType === "reel"}
                      onChange={() => setNewCollab({ ...newCollab, contentType: "reel" })}
                    />
                    🎬 {t('collaborations.contentTypeReel')}
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem" }}>
                    <input
                      type="radio"
                      name="contentType"
                      checked={newCollab.contentType === "story"}
                      onChange={() => setNewCollab({ ...newCollab, contentType: "story" })}
                    />
                    📱 {t('collaborations.contentTypeStory')}
                  </label>
                </div>
              </div>

              {/* Plateformes */}
              <div>
                <label style={{ 
                  display: "block",
                  fontSize: "0.6875rem",
                  color: "#999",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  marginBottom: "0.5rem"
                }}>
                  {t('collaborations.platforms')}
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {COLLAB_PLATFORMS.map(platform => (
                    <label
                      key={platform}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        padding: "0.375rem 0.75rem",
                        background: newCollab.platforms.includes(platform) ? "#e0e7ff" : "#f1f5f9",
                        border: `2px solid ${newCollab.platforms.includes(platform) ? "#6366f1" : "#e2e8f0"}`,
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "0.8125rem",
                        fontWeight: "600"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={newCollab.platforms.includes(platform)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewCollab({ ...newCollab, platforms: [...newCollab.platforms, platform] });
                          } else {
                            setNewCollab({ ...newCollab, platforms: newCollab.platforms.filter(p => p !== platform) });
                          }
                        }}
                      />
                      {platform === "instagram" ? "📷" : platform === "facebook" ? "📘" : platform === "tiktok" ? "🎵" : platform === "youtube" ? "▶️" : platform === "x" ? "🐦" : platform === "linkedin" ? "💼" : platform === "threads" ? "🧵" : "📱"} {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              {/* Description (français) */}
              <div>
                <label style={{ 
                  display: "block",
                  fontSize: "0.6875rem",
                  color: "#999",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  marginBottom: "0.5rem"
                }}>
                  {t('collaborations.descriptionFr')} *
                </label>
                <textarea
                  value={newCollab.description}
                  onChange={(e) => setNewCollab({ ...newCollab, description: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    fontSize: "0.875rem",
                    border: "2px solid #e5e5e5",
                    borderRadius: "8px",
                    minHeight: "100px",
                    resize: "vertical",
                    fontFamily: "inherit"
                  }}
                  placeholder={t('collaborations.descriptionPlaceholder')}
                />
              </div>

              {/* Description (italien) */}
              <div>
                <label style={{ 
                  display: "block",
                  fontSize: "0.6875rem",
                  color: "#999",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  marginBottom: "0.5rem"
                }}>
                  {t('collaborations.descriptionItLabel')}
                </label>
                <textarea
                  value={newCollab.descriptionIt}
                  onChange={(e) => setNewCollab({ ...newCollab, descriptionIt: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    fontSize: "0.875rem",
                    border: "2px solid #e5e5e5",
                    borderRadius: "8px",
                    minHeight: "100px",
                    resize: "vertical",
                    fontFamily: "inherit"
                  }}
                  placeholder={t('collaborations.descriptionItPlaceholder')}
                />
              </div>

              {/* Caption (français) */}
              <div>
                <label style={{ 
                  display: "block",
                  fontSize: "0.6875rem",
                  color: "#999",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  marginBottom: "0.5rem"
                }}>
                  {t('collaborations.captionFr')}
                </label>
                <textarea
                  value={newCollab.captionFr}
                  onChange={(e) => setNewCollab({ ...newCollab, captionFr: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    fontSize: "0.875rem",
                    border: "2px solid #e5e5e5",
                    borderRadius: "8px",
                    minHeight: "80px",
                    resize: "vertical",
                    fontFamily: "inherit"
                  }}
                  placeholder={t('collaborations.captionFrPlaceholder')}
                />
              </div>

              {/* Caption (italien) */}
              <div>
                <label style={{ 
                  display: "block",
                  fontSize: "0.6875rem",
                  color: "#999",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  marginBottom: "0.5rem"
                }}>
                  {t('collaborations.captionIt')}
                </label>
                <textarea
                  value={newCollab.captionIt}
                  onChange={(e) => setNewCollab({ ...newCollab, captionIt: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    fontSize: "0.875rem",
                    border: "2px solid #e5e5e5",
                    borderRadius: "8px",
                    minHeight: "80px",
                    resize: "vertical",
                    fontFamily: "inherit"
                  }}
                  placeholder={t('collaborations.captionItPlaceholder')}
                />
              </div>

              {/* Budget (visible uniquement si droit budget/tarifs) */}
              {canSeeBudgetAndTarifs() && (
              <div>
                <label style={{ 
                  display: "block",
                  fontSize: "0.6875rem",
                  color: "#999",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  marginBottom: "0.5rem"
                }}>
                  {t('collaborations.budget')} (€) *
                </label>
                <input
                  type="number"
                  value={newCollab.budget}
                  onChange={(e) => setNewCollab({ ...newCollab, budget: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    fontSize: "0.875rem",
                    border: "2px solid #e5e5e5",
                    borderRadius: "8px"
                  }}
                  placeholder="5000"
                />
              </div>
              )}

              {/* Dates */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ 
                    display: "block",
                    fontSize: "0.6875rem",
                    color: "#999",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    marginBottom: "0.5rem"
                  }}>
                    {t('reports.startDate')} *
                  </label>
                  <input
                    type="date"
                    value={newCollab.startDate}
                    onChange={(e) => setNewCollab({ ...newCollab, startDate: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.625rem",
                      fontSize: "0.875rem",
                      border: "2px solid #e5e5e5",
                      borderRadius: "8px"
                    }}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: "block",
                    fontSize: "0.6875rem",
                    color: "#999",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    marginBottom: "0.5rem"
                  }}>
                    {t('reports.endDate')} *
                  </label>
                  <input
                    type="date"
                    value={newCollab.endDate}
                    onChange={(e) => setNewCollab({ ...newCollab, endDate: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.625rem",
                      fontSize: "0.875rem",
                      border: "2px solid #e5e5e5",
                      borderRadius: "8px"
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleCreate}
                className="btn"
                style={{ flex: 1 }}
                disabled={!newCollab.influencerId || !newCollab.projectId || !newCollab.description || (canSeeBudgetAndTarifs() ? !newCollab.budget : false) || !newCollab.startDate || !newCollab.endDate}
              >
                {t('common.create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
