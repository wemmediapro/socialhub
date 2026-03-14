import { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "@/i18n/TranslationContext";
import { useAuth } from "@/contexts/AuthContext";
import { getDisplayTitleIdea, getDisplayDescriptionIdea, useTranslateIdeasWhenIt } from "@/lib/i18n-content";
import Breadcrumbs from "@/components/Breadcrumbs";
import {
  Lightbulb,
  Plus,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  FileText,
  Camera,
  Video,
  Users,
  Calendar,
  DollarSign,
  Clock,
  Filter,
  Send,
  X,
  Folder,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Check
} from "lucide-react";

type Idea = {
  _id: string;
  title: string;
  description: string;
  titleIt?: string;
  descriptionIt?: string;
  type: "post" | "photo_shoot" | "video_shoot" | "collaboration";
  projectIds: string[];
  status: "pending" | "in_discussion" | "validated" | "rejected" | "archived";
  createdBy: {
    userId: string;
    name: string;
    role: string;
  };
  mediaUrls?: string[];
  tags?: string[];
  priority: "low" | "medium" | "high";
  estimatedBudget?: number;
  estimatedDuration?: string;
  targetDate?: string;
  comments?: any[];
  votes?: any[];
  createdAt: string;
};

export default function IdeasPage() {
  const { t, language } = useTranslation();
  const { canSeeBudgetAndTarifs } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  useTranslateIdeasWhenIt(language, ideas, setIdeas as any);
  const [projects, setProjects] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [expandedIdeas, setExpandedIdeas] = useState<{ [key: string]: boolean }>({});
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});

  const [form, setForm] = useState({
    title: "",
    titleIt: "",
    description: "",
    descriptionIt: "",
    type: "post" as Idea["type"],
    projectIds: [] as string[],
    priority: "medium" as Idea["priority"],
    estimatedBudget: "",
    estimatedDuration: "",
    targetDate: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ideasRes, projectsRes] = await Promise.all([
        axios.get("/api/ideas"),
        axios.get("/api/projects")
      ]);
      setIdeas(ideasRes.data.ideas || []);
      setProjects(projectsRes.data.projects || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/api/ideas", {
        ...form,
        titleIt: form.titleIt?.trim() || undefined,
        descriptionIt: form.descriptionIt?.trim() || undefined,
        estimatedBudget: form.estimatedBudget ? Number(form.estimatedBudget) : undefined,
        createdBy: {
          userId: "DEMO_USER",
          name: "Admin User",
          role: "digital_creative"
        }
      });
      alert(t('ideas.addSuccess'));
      setForm({
        title: "",
        titleIt: "",
        description: "",
        descriptionIt: "",
        type: "post",
        projectIds: [],
        priority: "medium",
        estimatedBudget: "",
        estimatedDuration: "",
        targetDate: ""
      });
      setShowForm(false);
      loadData();
    } catch (error) {
      alert(t('ideas.addError'));
    }
  };

  const handleAddComment = async (ideaId: string) => {
    if (!newComment[ideaId]?.trim()) return;
    
    try {
      const idea = ideas.find(i => i._id === ideaId);
      if (!idea) return;

      const updatedComments = [
        ...(idea.comments || []),
        {
          userId: "DEMO_USER",
          userName: "Admin User",
          userRole: "digital_creative",
          text: newComment[ideaId],
          createdAt: new Date()
        }
      ];

      await axios.put(`/api/ideas/${ideaId}`, { comments: updatedComments });
      setNewComment({ ...newComment, [ideaId]: "" });
      loadData();
    } catch (error) {
      alert(t('ideas.commentError'));
    }
  };

  const handleValidate = async (ideaId: string) => {
    try {
      await axios.put(`/api/ideas/${ideaId}`, {
        status: "validated",
        validatedBy: {
          userId: "CLIENT_ID",
          name: "Client",
          validatedAt: new Date()
        }
      });
      alert(t('ideas.validateSuccess'));
      loadData();
    } catch (error) {
      alert(t('ideas.validateError'));
    }
  };

  const handleReject = async (ideaId: string) => {
    if (!confirm(t('ideas.rejectConfirm'))) return;
    try {
      await axios.put(`/api/ideas/${ideaId}`, { status: "rejected" });
      alert(t('ideas.rejectSuccess'));
      loadData();
    } catch (error) {
      alert(t('ideas.rejectError'));
    }
  };

  const handleDelete = async (ideaId: string) => {
    if (!confirm(t('ideas.deleteConfirm'))) return;
    try {
      await axios.delete(`/api/ideas/${ideaId}`);
      alert(t('ideas.deleteSuccess'));
      loadData();
    } catch (error) {
      alert(t('ideas.deleteError'));
    }
  };

  const toggleExpand = (ideaId: string) => {
    setExpandedIdeas({ ...expandedIdeas, [ideaId]: !expandedIdeas[ideaId] });
  };

  const typeConfig = {
    post: { label: t('ideas.types.post'), icon: FileText, color: "#ec4899" },
    photo_shoot: { label: t('ideas.types.photoShoot'), icon: Camera, color: "#f59e0b" },
    video_shoot: { label: t('ideas.types.videoShoot'), icon: Video, color: "#8b5cf6" },
    collaboration: { label: t('ideas.types.collaboration'), icon: Users, color: "#10b981" }
  };

  const statusConfig = {
    pending: { label: t('ideas.statuses.pending'), color: "#999", bg: "#f3f4f6" },
    in_discussion: { label: t('ideas.statuses.inDiscussion'), color: "#f59e0b", bg: "#fef3c7" },
    validated: { label: t('ideas.statuses.validated'), color: "#10b981", bg: "#d1fae5" },
    rejected: { label: t('ideas.statuses.rejected'), color: "#ef4444", bg: "#fee2e2" },
    archived: { label: t('ideas.statuses.archived'), color: "#6b7280", bg: "#e5e7eb" }
  };

  const priorityConfig = {
    low: { label: t('ideas.priorities.low'), color: "#10b981" },
    medium: { label: t('ideas.priorities.medium'), color: "#f59e0b" },
    high: { label: t('ideas.priorities.high'), color: "#ef4444" }
  };

  const getProjectName = (id: string) => {
    const project = projects.find(p => p._id === id);
    return project?.name || t('common.unknown');
  };

  const filteredIdeas = ideas.filter(idea => {
    if (statusFilter !== "all" && idea.status !== statusFilter) return false;
    if (typeFilter !== "all" && idea.type !== typeFilter) return false;
    if (projectFilter !== "all" && !idea.projectIds.includes(projectFilter)) return false;
    return true;
  });

  const stats = {
    total: ideas.length,
    pending: ideas.filter(i => i.status === "pending").length,
    validated: ideas.filter(i => i.status === "validated").length,
    rejected: ideas.filter(i => i.status === "rejected").length
  };

  return (
    <div className="page-content">
      <div className="dash">
        <div className="page-hero">
          <div className="page-hero-inner">
            <div className="page-hero-text">
              <div className="page-hero-breadcrumbs">
                <Breadcrumbs items={[
                  { label: t('menu.dashboard'), href: '/' },
                  { label: t('menu.ideas') }
                ]} />
              </div>
              <h1 className="page-hero-title">{t('menu.ideas')}</h1>
              <p className="page-hero-subtitle">{t('ideas.subtitle')}</p>
            </div>
            <div className="page-hero-actions">
              <button
                type="button"
                onClick={() => setShowForm(!showForm)}
                className="page-hero-btn"
              >
                {showForm ? <X size={18} /> : <Plus size={18} />}
                {showForm ? t('common.cancel') : t('ideas.newIdea')}
              </button>
            </div>
          </div>
        </div>

        <div className="dash-kpis ideas-kpis-refined">
          <div className="dash-kpi">
            <div className="dash-kpi-icon">
              <Lightbulb size={24} strokeWidth={2.5} />
            </div>
            <div className="dash-kpi-body">
              <div className="dash-kpi-value ideas-kpi-total">{stats.total}</div>
              <div className="dash-kpi-label">{t('ideas.stats.total')}</div>
            </div>
          </div>
          <div className="dash-kpi">
            <div className="dash-kpi-icon ideas-kpi-icon-pending">
              <Clock size={24} strokeWidth={2.5} />
            </div>
            <div className="dash-kpi-body">
              <div className="dash-kpi-value ideas-kpi-pending">{stats.pending}</div>
              <div className="dash-kpi-label">{t('ideas.stats.pending')}</div>
            </div>
          </div>
          <div className="dash-kpi">
            <div className="dash-kpi-icon ideas-kpi-icon-validated">
              <CheckCircle size={24} strokeWidth={2.5} />
            </div>
            <div className="dash-kpi-body">
              <div className="dash-kpi-value ideas-kpi-validated">{stats.validated}</div>
              <div className="dash-kpi-label">{t('ideas.stats.validated')}</div>
            </div>
          </div>
          <div className="dash-kpi">
            <div className="dash-kpi-icon ideas-kpi-icon-rejected">
              <XCircle size={24} strokeWidth={2.5} />
            </div>
            <div className="dash-kpi-body">
              <div className="dash-kpi-value ideas-kpi-rejected">{stats.rejected}</div>
              <div className="dash-kpi-label">{t('ideas.stats.rejected')}</div>
            </div>
          </div>
        </div>

        {showForm && (
          <section className="dash-section">
            <div className="dash-calendar-card">
              <div className="dash-calendar-toolbar">
                <h2 className="dash-calendar-title">
                  <Lightbulb size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 'var(--spacing-2)' }} />
                  {t('ideas.newIdea')}
                </h2>
              </div>
              <div className="dash-calendar-body">
            <form onSubmit={handleSubmit}>
              <div className="ideas-form-grid">
                <div className="ideas-form-group full-width">
                  <label className="ideas-form-label">{t('ideas.form.title')} *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder={t('ideas.form.titlePlaceholder')}
                    required
                  />
                </div>

                <div className="ideas-form-group full-width">
                  <label className="ideas-form-label">{t('ideas.form.titleIt')}</label>
                  <input
                    type="text"
                    value={form.titleIt}
                    onChange={(e) => setForm({ ...form, titleIt: e.target.value })}
                    placeholder={t('ideas.form.titleItPlaceholder')}
                  />
                </div>

                <div className="ideas-form-group full-width">
                  <label className="ideas-form-label">{t('ideas.form.description')} *</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder={t('ideas.form.descriptionPlaceholder')}
                    required
                    rows={4}
                  />
                </div>

                <div className="ideas-form-group full-width">
                  <label className="ideas-form-label">{t('ideas.form.descriptionIt')}</label>
                  <textarea
                    value={form.descriptionIt}
                    onChange={(e) => setForm({ ...form, descriptionIt: e.target.value })}
                    placeholder={t('ideas.form.descriptionItPlaceholder')}
                    rows={4}
                  />
                </div>

                <div className="ideas-form-group">
                  <label className="ideas-form-label">{t('ideas.form.type')} *</label>
                  <div className="ideas-form-type-options">
                    {Object.entries(typeConfig).map(([key, config]) => {
                      const Icon = config.icon;
                      const isSelected = form.type === key;
                      return (
                        <div
                          key={key}
                          role="button"
                          tabIndex={0}
                          onClick={() => setForm({ ...form, type: key as Idea["type"] })}
                          onKeyDown={(e) => e.key === "Enter" && setForm({ ...form, type: key as Idea["type"] })}
                          className={`ideas-form-type-option ${isSelected ? "selected" : ""}`}
                        >
                          <Icon size={18} style={{ color: isSelected ? config.color : undefined }} />
                          <span className="ideas-form-type-label">{config.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="ideas-form-group">
                  <label className="ideas-form-label">{t('ideas.form.priority')}</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as Idea["priority"] })}
                  >
                    <option value="low">🟢 {t('ideas.priorities.low')}</option>
                    <option value="medium">🟡 {t('ideas.priorities.medium')}</option>
                    <option value="high">🔴 {t('ideas.priorities.high')}</option>
                  </select>
                </div>

                {canSeeBudgetAndTarifs() && (
                <div className="ideas-form-group">
                  <label className="ideas-form-label">{t('ideas.form.budget')}</label>
                  <input
                    type="number"
                    value={form.estimatedBudget}
                    onChange={(e) => setForm({ ...form, estimatedBudget: e.target.value })}
                    placeholder={t('ideas.form.budgetPlaceholder')}
                  />
                </div>
                )}

                <div className="ideas-form-group">
                  <label className="ideas-form-label">{t('ideas.form.duration')}</label>
                  <input
                    type="text"
                    value={form.estimatedDuration}
                    onChange={(e) => setForm({ ...form, estimatedDuration: e.target.value })}
                    placeholder={t('ideas.form.durationPlaceholder')}
                  />
                </div>

                <div className="ideas-form-group full-width">
                  <label className="ideas-form-label">
                    <Folder size={14} style={{ display: "inline", marginRight: "var(--spacing-2)" }} />
                    {t('ideas.form.projects')} ({form.projectIds.length} {t('ideas.form.selected')}{form.projectIds.length > 1 ? "s" : ""})
                  </label>
                  <div className="ideas-form-projects">
                    {projects.map((project) => {
                      const isSelected = form.projectIds.includes(project._id);
                      return (
                        <div
                          key={project._id}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            const newIds = isSelected
                              ? form.projectIds.filter(id => id !== project._id)
                              : [...form.projectIds, project._id];
                            setForm({ ...form, projectIds: newIds });
                          }}
                          onKeyDown={(e) => {
                            if (e.key !== "Enter") return;
                            const newIds = isSelected
                              ? form.projectIds.filter(id => id !== project._id)
                              : [...form.projectIds, project._id];
                            setForm({ ...form, projectIds: newIds });
                          }}
                          className={`ideas-form-project-chip ${isSelected ? "selected" : ""}`}
                        >
                          <span className="ideas-form-project-name">{project.name}</span>
                          {isSelected && <Check size={14} strokeWidth={3} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="ideas-form-actions">
                <button type="button" onClick={() => setShowForm(false)} className="dash-calendar-overlay-btn">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="ideas-btn-primary">
                  <Send size={18} />
                  {t('ideas.form.submit')}
                </button>
              </div>
            </form>
              </div>
            </div>
          </section>
        )}

        <section className="dash-section">
          <div className="dash-calendar-card">
            <div className="dash-calendar-filters">
              <div className="dash-filter-group">
                <label className="dash-filter-label">{t('common.status')}</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="dash-filter-select"
                >
                  <option value="all">{t('ideas.filters.allStatuses')}</option>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>
              <div className="dash-filter-group">
                <label className="dash-filter-label">{t('common.type')}</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="dash-filter-select"
                >
                  <option value="all">{t('ideas.filters.allTypes')}</option>
                  {Object.entries(typeConfig).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>
              <div className="dash-filter-group">
                <label className="dash-filter-label">{t('common.project')}</label>
                <select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  className="dash-filter-select"
                >
                  <option value="all">{t('workflow.allProjects')}</option>
                  {projects.map(project => (
                    <option key={project._id} value={project._id}>{project.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="dash-calendar-body">
          {filteredIdeas.length === 0 ? (
            <div className="ideas-empty">
              <Lightbulb size={48} strokeWidth={1} className="ideas-empty-icon" />
              <p className="ideas-empty-title">{t('ideas.noIdeas')}</p>
              <p className="ideas-empty-desc">{t('ideas.beFirst')}</p>
            </div>
          ) : (
            <div className="ideas-list">
            {filteredIdeas.map((idea) => {
              const isExpanded = expandedIdeas[idea._id];
              const typeInfo = typeConfig[idea.type];
              const statusInfo = statusConfig[idea.status];
              const TypeIcon = typeInfo.icon;

              return (
                <div key={idea._id} className="ideas-card">
                  <div className="ideas-card-header" onClick={() => toggleExpand(idea._id)}>
                    <div className="ideas-card-title-row">
                      <h3 className="ideas-card-title">{getDisplayTitleIdea(idea, language)}</h3>
                      <span
                        className="ideas-card-tag ideas-card-tag-type"
                        style={{ background: typeInfo.color }}
                      >
                        <TypeIcon size={12} />
                        {typeInfo.label}
                      </span>
                      <span
                        className="ideas-card-tag ideas-card-tag-status"
                        style={{ background: statusInfo.bg, color: statusInfo.color }}
                      >
                        {statusInfo.label}
                      </span>
                      <span
                        className="ideas-card-tag ideas-card-tag-priority"
                        style={{ background: priorityConfig[idea.priority].color }}
                      >
                        {priorityConfig[idea.priority].label}
                      </span>
                    </div>

                    <p className="ideas-card-desc">{getDisplayDescriptionIdea(idea, language)}</p>

                    <div className="ideas-card-meta">
                      <span>👤 {idea.createdBy.name}</span>
                      <span>📅 {new Date(idea.createdAt).toLocaleDateString()}</span>
                      {canSeeBudgetAndTarifs() && idea.estimatedBudget != null && <span>💰 {idea.estimatedBudget}€</span>}
                      {idea.estimatedDuration && <span>⏱️ {idea.estimatedDuration}</span>}
                      <span>💬 {idea.comments?.length || 0} {t('common.comments')}</span>
                      <span>👍 {idea.votes?.filter(v => v.vote === "upvote").length || 0}</span>
                    </div>

                    {idea.projectIds.length > 0 && (
                      <div className="ideas-card-projects">
                        {idea.projectIds.map(projectId => (
                          <span key={projectId} className="ideas-card-project-pill">
                            📁 {getProjectName(projectId)}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: "var(--spacing-2)" }}>
                      {isExpanded ? <ChevronUp size={20} color="var(--color-text-secondary)" /> : <ChevronDown size={20} color="var(--color-text-secondary)" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="ideas-card-expanded">
                      <div className="ideas-card-actions">
                        {idea.status === "pending" && (
                          <>
                            <button type="button" onClick={() => handleValidate(idea._id)} className="ideas-btn-validate">
                              <CheckCircle size={16} />
                              {t('ideas.validateButton')}
                            </button>
                            <button type="button" onClick={() => handleReject(idea._id)} className="ideas-btn-reject">
                              <XCircle size={16} />
                              {t('ideas.rejectButton')}
                            </button>
                          </>
                        )}
                        <button type="button" onClick={() => handleDelete(idea._id)} className="ideas-btn-delete">
                          <Trash2 size={16} />
                          {t('common.delete')}
                        </button>
                      </div>

                      <h4 className="ideas-comments-title">💬 {t('ideas.discussionTitle')} ({idea.comments?.length || 0})</h4>

                      {idea.comments && idea.comments.length > 0 && (
                        <div className="ideas-comments-list">
                          {idea.comments.map((comment, index) => (
                            <div key={index} className="ideas-comment">
                              <div className="ideas-comment-meta">{comment.userName} • {comment.userRole}</div>
                              <div className="ideas-comment-text">{comment.text}</div>
                              <div className="ideas-comment-date">{new Date(comment.createdAt).toLocaleString()}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="ideas-add-comment">
                        <input
                          type="text"
                          value={newComment[idea._id] || ""}
                          onChange={(e) => setNewComment({ ...newComment, [idea._id]: e.target.value })}
                          placeholder={t('workflow.addComment')}
                          onKeyPress={(e) => e.key === "Enter" && handleAddComment(idea._id)}
                        />
                        <button type="button" onClick={() => handleAddComment(idea._id)} className="ideas-btn-primary">
                          <Send size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

