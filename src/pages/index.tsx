import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { 
  Folder, 
  FileText, 
  Users, 
  Star, 
  Plus, 
  Lightbulb,
  TrendingUp,
  ArrowRight,
  Zap,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Instagram,
  Facebook,
  Music,
  Edit,
  Trash2,
  X,
  Eye,
  ExternalLink,
  CheckCircle,
  Briefcase,
  User,
  Building2
} from "lucide-react";
import { getMediaUrlForContext } from "@/lib/utils";
import { VideoPreviewCard } from "@/components/VideoPreviewCard";
import { useTranslation } from "@/i18n/TranslationContext";
import { getDisplayDescriptionCollab, getDisplayCaptionPost, useTranslateCollabDescriptionsWhenIt, useTranslatePostDescriptionsWhenIt } from "@/lib/i18n-content";
import Breadcrumbs from "@/components/Breadcrumbs";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/contexts/AuthContext";

type Post = {
  _id: string;
  projectId: string;
  projectIds?: string[];
  networks?: string[];
  network: string;
  type: string;
  caption?: string;
  captionIt?: string;
  description?: string;
  descriptionIt?: string;
  hashtags?: string;
  mediaUrls?: string[];
  scheduledAt: string;
  status: string;
  sentiment?: string;
  insights?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
    engagement_rate?: number;
  };
  multiPlatformStats?: Array<{
    platform: string;
    sentiment?: "positive" | "neutral" | "negative";
    publishedAt?: Date;
    postUrl?: string;
    insights?: {
      views?: number;
      likes?: number;
      comments?: number;
      shares?: number;
      saves?: number;
      engagement_rate?: number;
    };
    sponsored?: boolean;
  }>;
  publishedAt?: string;
};

type Collaboration = {
  _id: string;
  projectId: string;
  projectIds?: string[];
  influencerId?: string;
  status: string;
  startDate: string;
  endDate: string;
  scheduledAt?: string;
  budget?: number;
  description?: string;
  descriptionIt?: string;
  captionFr?: string;
  captionIt?: string;
  contentType?: "reel" | "story";
  platforms?: string[];
  createdBy?: string;
  contentUploads?: Array<{
    scheduledAt?: string;
    publishedAt?: string;
    platform?: string;
    urls?: string[];
    description?: string;
    uploadedBy?: string;
    postUrl?: string;
    insights?: {
      views?: number;
      likes?: number;
      comments?: number;
      shares?: number;
      saves?: number;
      engagement_rate?: number;
    };
    sentiment?: string;
  }>;
};

export default function Home() {
  const { t, language } = useTranslation();
  const { canSeeBudgetAndTarifs } = useAuth();
  const { success, ToastContainer } = useToast();
  
  // Network colors and icons
  const networkColors: { [key: string]: string } = {
    instagram: "#e4405f",
    facebook: "#1877f2",
    tiktok: "#000000",
    threads: "#101010"
  };
  
  const networkIcons: { [key: string]: any } = {
    instagram: Instagram,
    facebook: Facebook,
    tiktok: Music
  };
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    posts: 0, 
    collabs: 0, 
    influencers: 0,
    projects: 0 
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  useTranslateCollabDescriptionsWhenIt(language, collaborations, setCollaborations);
  useTranslatePostDescriptionsWhenIt(language, posts, setPosts);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState<"all" | "posts" | "collabs">("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'year'>('month');
  const [selectedPublishedPost, setSelectedPublishedPost] = useState<Post | null>(null);
  const [selectedCollabInCalendar, setSelectedCollabInCalendar] = useState<{ collab: Collaboration, kind: "COLLAB_SCHEDULED" | "COLLAB_PUBLISHED" | "COLLAB_REVIEW" | "COLLAB_DRAFT" } | null>(null);

  const fetchDashboardData = useCallback(() => {
    setLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => setLoading(false), 15000);

    const toJson = (r: Response) => r.json().then((data: unknown) => ({ ok: r.ok, data })).catch(() => ({ ok: false, data: null }));

    Promise.allSettled([
      fetch('/api/posts', { signal: controller.signal }).then(toJson),
      fetch('/api/collaborations', { signal: controller.signal }).then(toJson),
      fetch('/api/influencers', { signal: controller.signal }).then(toJson),
      fetch('/api/projects', { signal: controller.signal }).then(toJson),
    ]).then(([postsRes, collabsRes, influencersRes, projectsRes]) => {
      clearTimeout(timeoutId);

      const getData = (result: PromiseSettledResult<{ ok: boolean; data: unknown }>) =>
        result.status === 'fulfilled' ? result.value : { ok: false, data: null };

      const postsVal = getData(postsRes);
      const collabsVal = getData(collabsRes);
      const influencersVal = getData(influencersRes);
      const projectsVal = getData(projectsRes);

      const postsData = postsVal.ok && postsVal.data && typeof postsVal.data === 'object' && 'posts' in postsVal.data
        ? (postsVal.data as { posts?: Post[] }).posts ?? []
        : [];
      const collabsData = collabsVal.ok && collabsVal.data && typeof collabsVal.data === 'object' && 'collaborations' in collabsVal.data
        ? (collabsVal.data as { collaborations?: Collaboration[] }).collaborations ?? []
        : [];
      const influencersData = influencersVal.ok && influencersVal.data && typeof influencersVal.data === 'object' && 'influencers' in influencersVal.data
        ? (influencersVal.data as { influencers?: unknown[] }).influencers ?? []
        : [];
      const projectsData = projectsVal.ok && projectsVal.data && typeof projectsVal.data === 'object' && 'projects' in projectsVal.data
        ? (projectsVal.data as { projects?: unknown[] }).projects ?? []
        : [];

      setStats({
        posts: Array.isArray(postsData) ? postsData.length : 0,
        collabs: Array.isArray(collabsData) ? collabsData.length : 0,
        influencers: Array.isArray(influencersData) ? influencersData.length : 0,
        projects: Array.isArray(projectsData) ? projectsData.length : 0,
      });

      const calendarPostStatuses = ['DRAFT', 'PENDING_GRAPHIC', 'CLIENT_REVIEW', 'PENDING_CORRECTION', 'SCHEDULED', 'PUBLISHED'];
      const relevantPosts = Array.isArray(postsData) ? postsData.filter((p: Post) => calendarPostStatuses.includes(p.status)) : [];
      setPosts(relevantPosts);
      setCollaborations(Array.isArray(collabsData) ? collabsData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setInfluencers(Array.isArray(influencersData) ? influencersData : []);
      setLoading(false);
    }).catch(() => {
      clearTimeout(timeoutId);
      setStats({ posts: 0, collabs: 0, influencers: 0, projects: 0 });
      setPosts([]);
      setCollaborations([]);
      setProjects([]);
      setInfluencers([]);
      setLoading(false);
    });

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    return fetchDashboardData();
  }, [fetchDashboardData]);

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p._id === projectId);
    return project?.name || projectId;
  };

  const getProjectNamesForPost = (post: any): string[] => {
    // Projets déjà populés par l'API (objet ou tableau)
    if (post.projects && Array.isArray(post.projects) && post.projects.length > 0) {
      return post.projects.map((p: any) => (typeof p === 'string' ? getProjectName(p) : (p?.name || p?._id))).filter(Boolean);
    }
    if (post.project && typeof post.project === 'object' && post.project.name) {
      return [post.project.name];
    }
    if (post.project && typeof post.project === 'string') {
      return [getProjectName(post.project)].filter(Boolean);
    }
    const ids = (post.projectIds && post.projectIds.length) ? post.projectIds : (post.projectId ? [post.projectId] : []);
    return ids.map((id: string) => getProjectName(id)).filter(Boolean);
  };

  const getInfluencerName = (influencerId: string) => {
    const influencer = influencers.find(i => i._id === influencerId);
    return influencer?.name || "Inconnu";
  };

  const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|ogg|ogv|m3u8)(\?|$)/i;
  const getVideoUrlsFromCollab = (collab: Collaboration): string[] => {
    const urls: string[] = [];
    (collab.contentUploads || []).forEach((upload: any) => {
      (upload.urls || []).forEach((url: string) => {
        if (VIDEO_EXTENSIONS.test(url) || url.includes('video') || url.includes('reel')) {
          urls.push(url);
        }
      });
    });
    return urls;
  };

  // Configuration des statuts du calendrier (alignée avec workflow / calendar)
  const statusConfig: Record<string, { label: string; color: string; tint: string }> = {
    DRAFT: { label: t('workflow.statuses.draft') || 'Draft', color: "#64748b", tint: "#64748b18" },
    PENDING_GRAPHIC: { label: t('workflow.statuses.creation') || 'Création', color: "#8b5cf6", tint: "#8b5cf618" },
    CLIENT_REVIEW: { label: t('workflow.statuses.revision') || 'Révision', color: "#f59e0b", tint: "#f59e0b18" },
    PENDING_CORRECTION: { label: t('workflow.statuses.corrections') || 'En correction', color: "#f97316", tint: "#f9731618" },
    SCHEDULED: { label: t('workflow.statuses.planned') || 'Planifié', color: "#0284c7", tint: "#0284c718" },
    PUBLISHED: { label: t('workflow.statuses.published') || 'Publié', color: "#059669", tint: "#05966918" },
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  /** Retourne une chaîne YYYY-MM-DD en heure locale pour comparaison fiable. */
  const toLocalDateString = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getEventsForDay = (day: number) => {
    const { year, month } = getDaysInMonth(currentDate);
    return getEventsForDate(year, month, day);
  };

  /** Événements (posts + collabs) pour une date donnée. Utilisé par la vue mois et la vue annuelle (365 jours). */
  const getEventsForDate = (year: number, month: number, day: number) => {
    const currentDayStr = toLocalDateString(new Date(year, month, day));
    
    const events: Array<{ type: 'post' | 'collab', data: any }> = [];
    
    if (typeFilter === "all" || typeFilter === "posts") {
      posts.forEach(post => {
        const rawDate = post.scheduledAt || post.publishedAt || (post as any).createdAt;
        if (!rawDate) return;
        const postDate = new Date(rawDate);
        if (isNaN(postDate.getTime())) return;
        const postDayStr = toLocalDateString(postDate);
        
        const networks = post.networks || [post.network];
        const projectIdsToCheck = (post.projectIds && post.projectIds.length > 0)
          ? post.projectIds
          : (post.projectId ? [post.projectId] : []);
        const matchesProject = projectFilter === "all" || projectIdsToCheck.includes(projectFilter);
        const matchesPlatform = platformFilter === "all" || networks.includes(platformFilter);
        const matchesStatus = statusFilter === "all" || post.status === statusFilter;
        
        if (postDayStr === currentDayStr && matchesProject && matchesPlatform && matchesStatus) {
          events.push({ type: 'post', data: post });
        }
      });
    }
    
    if (typeFilter === "all" || typeFilter === "collabs") {
      collaborations.forEach(collab => {
        if (projectFilter !== "all") {
          const projectIdsToCheck = (collab.projectIds && collab.projectIds.length > 0) 
            ? collab.projectIds 
            : [collab.projectId];
          if (!projectIdsToCheck.includes(projectFilter)) return;
        }
        
        if (collab.status === 'SCHEDULED') {
          if (collab.scheduledAt) {
            const scheduledDate = new Date(collab.scheduledAt);
            if (!isNaN(scheduledDate.getTime()) && toLocalDateString(scheduledDate) === currentDayStr) {
              events.push({ type: 'collab', data: { collab, kind: "COLLAB_SCHEDULED" } });
            }
          } else if (collab.startDate) {
            const startDate = new Date(collab.startDate);
            if (!isNaN(startDate.getTime()) && toLocalDateString(startDate) === currentDayStr) {
              events.push({ type: 'collab', data: { collab, kind: "COLLAB_SCHEDULED" } });
            }
          }
        }
        
        if (collab.status === 'DRAFT') {
          const draftReference = collab.scheduledAt || collab.startDate || collab.endDate;
          if (draftReference) {
            const draftDate = new Date(draftReference);
            if (!isNaN(draftDate.getTime()) && toLocalDateString(draftDate) === currentDayStr) {
              events.push({ type: 'collab', data: { collab, kind: "COLLAB_DRAFT" } });
            }
          }
        }
        
        if (collab.status === 'PUBLISHED') {
          const publishReference = collab.scheduledAt || collab.endDate || collab.startDate;
          if (publishReference) {
            const publishDate = new Date(publishReference);
            if (!isNaN(publishDate.getTime()) && toLocalDateString(publishDate) === currentDayStr) {
              events.push({ type: 'collab', data: { collab, kind: "COLLAB_PUBLISHED" } });
            }
          }
        }
        
        if (collab.status === 'CLIENT_REVIEW') {
          const reviewReference = collab.scheduledAt || collab.startDate || collab.endDate;
          if (reviewReference) {
            const reviewDate = new Date(reviewReference);
            if (!isNaN(reviewDate.getTime()) && toLocalDateString(reviewDate) === currentDayStr) {
              events.push({ type: 'collab', data: { collab, kind: "COLLAB_REVIEW" } });
            }
          }
        }
        
        collab.contentUploads?.forEach(content => {
          if (content.scheduledAt) {
            const scheduledDate = new Date(content.scheduledAt);
            if (!isNaN(scheduledDate.getTime()) && toLocalDateString(scheduledDate) === currentDayStr) {
              if (platformFilter === "all" || content.platform === platformFilter) {
                events.push({ type: 'collab', data: { collab, content, kind: "COLLAB_SCHEDULED" } });
              }
            }
          }
        });
      });
    }
    
    return events;
  };

  const prevMonth = () => {
    const { year, month } = getDaysInMonth(currentDate);
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    const { year, month } = getDaysInMonth(currentDate);
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const prevYear = () => {
    const { year, month } = getDaysInMonth(currentDate);
    setCurrentDate(new Date(year - 1, month, 1));
  };

  const nextYear = () => {
    const { year, month } = getDaysInMonth(currentDate);
    setCurrentDate(new Date(year + 1, month, 1));
  };

  // Définir les données réactives qui dépendent de la traduction
  const statsData = [
    { label: t('dashboard.stats.projects'), value: stats.projects, icon: Folder, gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
    { label: t('dashboard.stats.posts'), value: stats.posts, icon: FileText, gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
    { label: t('dashboard.stats.collaborations'), value: stats.collabs, icon: Users, gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
    { label: t('dashboard.stats.influencers'), value: stats.influencers, icon: Star, gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" },
  ];

  const quickActions = [
    { 
      title: t('dashboard.quickAction.newIdea'), 
      description: t('dashboard.quickAction.newIdeaDesc'), 
      href: "/ideas", 
      icon: Lightbulb,
      gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
    },
    { 
      title: t('dashboard.quickAction.createPost'), 
      description: t('dashboard.quickAction.createPostDesc'), 
      href: "/posts/new", 
      icon: FileText,
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
    },
    { 
      title: t('dashboard.quickAction.newProject'), 
      description: t('dashboard.quickAction.newProjectDesc'), 
      href: "/projects/new", 
      icon: Plus,
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    { 
      title: t('dashboard.quickAction.workflow'), 
      description: t('dashboard.quickAction.workflowDesc'), 
      href: "/workflow", 
      icon: Zap,
      gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
    },
  ];

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-content dashboard-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-content dash">
        <div className="page-hero">
          <div className="page-hero-inner">
            <div className="page-hero-text">
              <div className="page-hero-breadcrumbs">
                <Breadcrumbs items={[{ label: t('dashboard.title') }]} />
              </div>
              <h1 className="page-hero-title">{t('dashboard.title')}</h1>
              <p className="page-hero-subtitle">{t('dashboard.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="dash-kpis">
          {statsData.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="dash-kpi">
                <div className="dash-kpi-icon">
                  <Icon size={24} strokeWidth={2.5} />
                </div>
                <div className="dash-kpi-body">
                  <div className="dash-kpi-value">{stat.value}</div>
                  <div className="dash-kpi-label">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions rapides */}
        <section className="dash-section">
          <div className="dash-section-head">
            <h2 className="dash-section-title">{t('dashboard.quickActions')}</h2>
          </div>
          <div className="dash-actions">
            {quickActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <Link key={i} href={action.href} className="dash-action">
                  <div
                    className="dash-action-icon"
                    style={{ background: action.gradient }}
                  >
                    <Icon size={24} color="white" strokeWidth={2.5} />
                  </div>
                  <h3 className="dash-action-title">{action.title}</h3>
                  <p className="dash-action-desc">{action.description}</p>
                  <span className="dash-action-cta">
                    {t('dashboard.start') || 'Démarrer'}
                    <ArrowRight size={16} strokeWidth={3} />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Calendrier unifié – même style que Calendar Posts */}
        <section className="dash-section calendar-section">
          <div className="dash-section-head">
            <h2 className="dash-section-title">{t('dashboard.unifiedCalendar')}</h2>
          </div>
          <div className="calendar-filters-bar">
            <div className="calendar-filter-group">
              <label className="calendar-filter-label">{t('common.type')}</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as "all" | "posts" | "collabs")}
                className="calendar-filter-select"
              >
                <option value="all">{t('common.all')}</option>
                <option value="posts">📝 {t('dashboard.calendarFilterPosts')}</option>
                <option value="collabs">🤝 {t('dashboard.calendarFilterCollabs')}</option>
              </select>
            </div>
            <div className="calendar-filter-group">
              <label className="calendar-filter-label">{t('common.project')}</label>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="calendar-filter-select"
                style={{ minWidth: "200px" }}
              >
                <option value="all">{t('workflow.allProjects')}</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="calendar-filter-group">
              <label className="calendar-filter-label">{t('common.platform')}</label>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="calendar-filter-select"
              >
                <option value="all">{t('common.all')}</option>
                <option value="instagram">📷 Instagram</option>
                <option value="facebook">📘 Facebook</option>
                <option value="tiktok">🎵 TikTok</option>
                <option value="threads">🧵 Threads</option>
              </select>
            </div>
            <div className="calendar-filter-group">
              <label className="calendar-filter-label">{t('common.status')}</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="calendar-filter-select"
              >
                <option value="all">{t('common.all')}</option>
                <option value="DRAFT">{t('workflow.statuses.draft') || 'Draft'}</option>
                <option value="PENDING_GRAPHIC">{t('workflow.statuses.creation') || 'Création'}</option>
                <option value="CLIENT_REVIEW">{t('workflow.statuses.revision') || 'Révision'}</option>
                <option value="PENDING_CORRECTION">{t('workflow.statuses.corrections') || 'En correction'}</option>
                <option value="SCHEDULED">{t('workflow.statuses.planned') || 'Planifié'}</option>
                <option value="PUBLISHED">{t('workflow.statuses.published') || 'Publié'}</option>
              </select>
            </div>
          </div>

          <div className="calendar-card">
            <div className="calendar-nav">
              <div className="calendar-nav-left">
                <h2 className="calendar-month-title">
                  {calendarViewMode === 'year'
                    ? getDaysInMonth(currentDate).year
                    : [
                        t('calendar.months.january'),
                        t('calendar.months.february'),
                        t('calendar.months.march'),
                        t('calendar.months.april'),
                        t('calendar.months.may'),
                        t('calendar.months.june'),
                        t('calendar.months.july'),
                        t('calendar.months.august'),
                        t('calendar.months.september'),
                        t('calendar.months.october'),
                        t('calendar.months.november'),
                        t('calendar.months.december')
                      ][getDaysInMonth(currentDate).month] + ' ' + getDaysInMonth(currentDate).year}
                </h2>
                <div className="calendar-view-tabs">
                  <button
                    type="button"
                    className={`calendar-view-tab ${calendarViewMode === 'month' ? 'is-active' : ''}`}
                    onClick={() => setCalendarViewMode('month')}
                  >
                    {t('calendar.viewMonth') || 'Mois'}
                  </button>
                  <button
                    type="button"
                    className={`calendar-view-tab ${calendarViewMode === 'year' ? 'is-active' : ''}`}
                    onClick={() => setCalendarViewMode('year')}
                  >
                    {t('calendar.viewYear') || 'Année'}
                  </button>
                </div>
              </div>
              <div className="calendar-nav-btns">
                {calendarViewMode === 'year' ? (
                  <>
                    <button
                      type="button"
                      onClick={prevYear}
                      className="calendar-nav-btn"
                      aria-label={t('calendar.prevYear') || 'Année précédente'}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={nextYear}
                      className="calendar-nav-btn"
                      aria-label={t('calendar.nextYear') || 'Année suivante'}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={prevMonth}
                      className="calendar-nav-btn"
                      aria-label={t('calendar.prevMonth') || 'Mois précédent'}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={nextMonth}
                      className="calendar-nav-btn"
                      aria-label={t('calendar.nextMonth') || 'Mois suivant'}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {calendarViewMode === 'year' ? (
              <div className="calendar-year-grid-days">
                {[
                  t('calendar.months.january'),
                  t('calendar.months.february'),
                  t('calendar.months.march'),
                  t('calendar.months.april'),
                  t('calendar.months.may'),
                  t('calendar.months.june'),
                  t('calendar.months.july'),
                  t('calendar.months.august'),
                  t('calendar.months.september'),
                  t('calendar.months.october'),
                  t('calendar.months.november'),
                  t('calendar.months.december')
                ].map((monthName, m) => {
                  const year = getDaysInMonth(currentDate).year;
                  const firstDay = new Date(year, m, 1);
                  const daysInThisMonth = new Date(year, m + 1, 0).getDate();
                  const startOffset = firstDay.getDay();
                  const totalCells = startOffset + daysInThisMonth;
                  const rows = Math.ceil(totalCells / 7);
                  const isCurrentMonth = new Date().getMonth() === m && new Date().getFullYear() === year;
                  const dayNames = [
                    t('calendar.days.sunday'),
                    t('calendar.days.monday'),
                    t('calendar.days.tuesday'),
                    t('calendar.days.wednesday'),
                    t('calendar.days.thursday'),
                    t('calendar.days.friday'),
                    t('calendar.days.saturday')
                  ];
                  return (
                    <div
                      key={m}
                      className={`calendar-year-month-block ${isCurrentMonth ? 'is-current-month' : ''}`}
                    >
                      <div className="calendar-year-month-block-title">{monthName}</div>
                      <div className="calendar-year-mini-weekdays">
                        {dayNames.map((d) => (
                          <div key={d} className="calendar-year-mini-weekday">{d}</div>
                        ))}
                      </div>
                      <div className="calendar-year-mini-days" style={{ gridTemplateRows: `repeat(${rows}, minmax(28px, 1fr))` }}>
                        {Array.from({ length: startOffset }).map((_, i) => (
                          <div key={`empty-${m}-${i}`} className="calendar-year-mini-day calendar-year-mini-day-empty" aria-hidden="true" />
                        ))}
                        {Array.from({ length: daysInThisMonth }).map((_, i) => {
                          const day = i + 1;
                          const events = getEventsForDate(year, m, day);
                          const hasItems = events.length > 0;
                          const isToday = new Date().getDate() === day && new Date().getMonth() === m && new Date().getFullYear() === year;
                          const isSelected = selectedDay?.getDate() === day && selectedDay?.getMonth() === m && selectedDay?.getFullYear() === year;
                          return (
                            <button
                              key={day}
                              type="button"
                              className={`calendar-year-mini-day ${hasItems ? 'has-events' : ''} ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`}
                              onClick={() => {
                                const clickedDate = new Date(year, m, day);
                                setSelectedDay(clickedDate);
                              }}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
            <div className="calendar-weekdays">
              {[
                t('calendar.days.sunday'),
                t('calendar.days.monday'),
                t('calendar.days.tuesday'),
                t('calendar.days.wednesday'),
                t('calendar.days.thursday'),
                t('calendar.days.friday'),
                t('calendar.days.saturday')
              ].map((day) => (
                <div key={day} className="calendar-weekday">{day}</div>
              ))}
            </div>

            <div className="calendar-days">
              {(() => {
                const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
                return (
                  <>
                    {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} className="calendar-day-empty" aria-hidden="true" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const events = getEventsForDay(day);
                      const hasItems = events.length > 0;
                      const isToday = new Date().getDate() === day &&
                        new Date().getMonth() === month &&
                        new Date().getFullYear() === year;
                      const isSelected = selectedDay?.getDate() === day && selectedDay?.getMonth() === month && selectedDay?.getFullYear() === year;
                      const postCount = events.filter(e => e.type === 'post').length;
                      const collabCount = events.filter(e => e.type === 'collab').length;

                      return (
                        <div
                          key={day}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            const clickedDate = new Date(year, month, day);
                            setSelectedDay(selectedDay?.getTime() === clickedDate.getTime() ? null : clickedDate);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              const clickedDate = new Date(year, month, day);
                              setSelectedDay(selectedDay?.getTime() === clickedDate.getTime() ? null : clickedDate);
                            }
                          }}
                          className={`calendar-day ${isToday ? 'is-today' : ''} ${hasItems ? 'has-events' : ''} ${isSelected ? 'is-selected' : ''}`}
                        >
                          <span className="calendar-day-num">{day}</span>
                          {events.length > 0 && (
                            <>
                              <div className="calendar-day-bars">
                                {events.slice(0, 3).map((event, idx) => {
                                  let color = "#0284c7";
                                  if (event.type === "post") {
                                    const cfg = statusConfig[event.data.status];
                                    color = cfg?.color ?? "#0284c7";
                                  } else if (event.type === "collab" && (event.data.kind === "COLLAB_SCHEDULED" || !event.data.kind)) color = "#0284c7";
                                  else if (event.type === "collab" && event.data.kind === "COLLAB_DRAFT") color = "#64748b";
                                  else if (event.type === "collab" && event.data.kind === "COLLAB_PUBLISHED") color = "#059669";
                                  else if (event.type === "collab" && event.data.kind === "COLLAB_REVIEW") color = "#f59e0b";
                                  return (
                                    <div key={idx} className="calendar-day-bar" style={{ background: color }} />
                                  );
                                })}
                                {events.length > 3 && (
                                  <span className="calendar-day-more">+{events.length - 3}</span>
                                )}
                              </div>
                              <div className="calendar-day-content-labels" aria-hidden="true">
                                {postCount > 0 && (
                                  <span className="calendar-day-label calendar-day-label-post">
                                    {postCount} {postCount === 1 ? t('dashboard.calendarPost') || 'post' : t('dashboard.calendarPosts') || 'posts'}
                                  </span>
                                )}
                                {collabCount > 0 && (
                                  <span className="calendar-day-label calendar-day-label-collab">
                                    {collabCount} {collabCount === 1 ? t('dashboard.calendarCollab') || 'collab' : t('dashboard.calendarCollabs') || 'collabs'}
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </div>

            <div className="calendar-legend">
              {['DRAFT', 'PENDING_GRAPHIC', 'CLIENT_REVIEW', 'PENDING_CORRECTION', 'SCHEDULED', 'PUBLISHED'].map((status) => {
                const cfg = statusConfig[status];
                if (!cfg) return null;
                return (
                  <div key={status} className="calendar-legend-item">
                    <span className="calendar-legend-dot" style={{ background: cfg.color }} />
                    <span>{cfg.label}</span>
                  </div>
                );
              })}
              <div className="calendar-legend-item">
                <span className="calendar-legend-dot" style={{ background: "#8b5cf6" }} />
                <span>Collab planifiées</span>
              </div>
              <div className="calendar-legend-item">
                <span className="calendar-legend-dot" style={{ background: "#64748b" }} />
                <span>Collab brouillon</span>
              </div>
              <div className="calendar-legend-item">
                <span className="calendar-legend-dot" style={{ background: "#f59e0b" }} />
                <span>Collab en révision</span>
              </div>
              <div className="calendar-legend-item">
                <span className="calendar-legend-dot" style={{ background: "#059669" }} />
                <span>Collab publiées</span>
              </div>
            </div>
              </>
            )}
          </div>

        {/* Overlay : détails du jour sélectionné (style sidebar Calendar Posts) */}
        {selectedDay && selectedDay instanceof Date && !isNaN(selectedDay.getTime()) && (
          <div
            className="dash-calendar-day-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedDay(null); }}
            role="dialog"
            aria-modal="true"
            aria-label="Détails du jour"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "var(--spacing-4)",
              animation: "fadeIn 0.2s ease-out"
            }}
          >
            <div
              className="calendar-sidebar-panel dash-calendar-day-panel"
              style={{
                maxWidth: "500px",
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "var(--shadow-xl)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="calendar-sidebar-day-header dash-calendar-day-header">
                <h3 className="calendar-sidebar-day-title">
                  {selectedDay.getDate()} {[
                    t('calendar.months.january'),
                    t('calendar.months.february'),
                    t('calendar.months.march'),
                    t('calendar.months.april'),
                    t('calendar.months.may'),
                    t('calendar.months.june'),
                    t('calendar.months.july'),
                    t('calendar.months.august'),
                    t('calendar.months.september'),
                    t('calendar.months.october'),
                    t('calendar.months.november'),
                    t('calendar.months.december')
                  ][selectedDay.getMonth()].charAt(0).toUpperCase() + [
                    t('calendar.months.january'),
                    t('calendar.months.february'),
                    t('calendar.months.march'),
                    t('calendar.months.april'),
                    t('calendar.months.may'),
                    t('calendar.months.june'),
                    t('calendar.months.july'),
                    t('calendar.months.august'),
                    t('calendar.months.september'),
                    t('calendar.months.october'),
                    t('calendar.months.november'),
                    t('calendar.months.december')
                  ][selectedDay.getMonth()].slice(1)}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="calendar-sidebar-close dash-calendar-day-close"
                  aria-label={t('common.close')}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="calendar-sidebar-list" style={{ padding: "0 var(--spacing-6) var(--spacing-6)" }}>
            {(() => {
              const selectedDayNum = selectedDay.getDate();
              const dayEvents = getEventsForDay(selectedDayNum);
              const dayPosts = dayEvents.filter(e => e.type === 'post').map(e => e.data);
              const dayCollabs = dayEvents.filter(e => e.type === 'collab').map(e => e.data);

              if (dayEvents.length === 0) {
                return (
                  <div className="calendar-sidebar-empty">
                    <Calendar size={48} strokeWidth={1} className="calendar-sidebar-empty-icon" style={{ margin: "0 auto", display: "block" }} />
                    <p className="calendar-sidebar-empty-text">{t('calendar.noPost')}</p>
                  </div>
                );
              }

              const networkColorsLocal: { [key: string]: string } = {
                instagram: "#e4405f",
                facebook: "#1877f2",
                tiktok: "#000000",
                threads: "#101010"
              };
              const networkIconsLocal: { [key: string]: any } = {
                instagram: Instagram,
                facebook: Facebook,
                tiktok: Music
              };

              return (
                <>
                  {dayPosts.map((post: Post) => {
                    const networks = post.networks || [post.network];
                    const statusInfo = statusConfig[post.status] || statusConfig.SCHEDULED;
                    const statusColor = statusInfo.color;
                    const statusLabel = statusInfo.label;
                    const scheduledDate = post.scheduledAt || post.publishedAt || (post as any).createdAt || '';
                    const dateObj = scheduledDate ? new Date(scheduledDate) : null;
                    const projectNames = getProjectNamesForPost(post);
                    const mediaUrls = post.mediaUrls || [];
                    return (
                      <div
                        key={post._id}
                        className="card-meta"
                        style={{
                          padding: "1.25rem",
                          borderLeft: `4px solid ${statusColor}`,
                          background: statusInfo.tint || `${statusColor}18`,
                          marginBottom: "var(--spacing-4)",
                          borderRadius: "var(--border-radius-base)",
                          border: "1px solid var(--color-border)"
                        }}
                      >
                        {/* En-tête : Date + Fermeture visuelle */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: "700", color: "var(--color-text-primary)" }}>
                            <Calendar size={16} style={{ color: "var(--color-primary)" }} />
                            {dateObj ? dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '—'}
                          </div>
                          <span style={{
                            padding: "0.25rem 0.625rem",
                            background: statusInfo.tint,
                            color: statusColor,
                            borderRadius: "6px",
                            fontSize: "0.6875rem",
                            fontWeight: "700",
                            textTransform: "uppercase",
                            letterSpacing: "0.03em"
                          }}>
                            {statusLabel}
                          </span>
                        </div>

                        {/* Projet(s) */}
                        <div style={{ marginBottom: "0.75rem" }}>
                          <div style={{ fontSize: "0.6875rem", fontWeight: "600", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.25rem" }}>
                            {t('common.project')}{projectNames.length > 1 ? "s" : ""}
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                            {projectNames.length > 0 ? projectNames.map((name, i) => (
                              <span key={i} style={{ padding: "0.25rem 0.5rem", background: "var(--color-primary-50)", color: "var(--color-primary)", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "600" }}>
                                {name}
                              </span>
                            )) : <span style={{ fontSize: "0.75rem", color: "#999" }}>—</span>}
                          </div>
                        </div>

                        {/* Plateforme(s) */}
                        <div style={{ marginBottom: "0.75rem" }}>
                          <div style={{ fontSize: "0.6875rem", fontWeight: "600", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.25rem" }}>
                            {t('common.platform')}{networks.length > 1 ? "s" : ""}
                          </div>
                          <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                            {networks.map((network: string, idx: number) => {
                              const NetworkIcon = networkIconsLocal[network];
                              return (
                                <span
                                  key={idx}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.25rem",
                                    padding: "0.25rem 0.5rem",
                                    background: `${networkColorsLocal[network] || "#4f46e5"}15`,
                                    color: networkColorsLocal[network] || "#4f46e5",
                                    borderRadius: "4px",
                                    fontSize: "0.75rem",
                                    fontWeight: "600"
                                  }}
                                >
                                  {NetworkIcon && <NetworkIcon size={12} strokeWidth={2} />}
                                  {network}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* État + Type */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.6875rem", fontWeight: "600", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>{t('common.status')}</span>
                          <span style={{ padding: "0.2rem 0.5rem", background: `${statusColor}18`, color: statusColor, borderRadius: "4px", fontSize: "0.75rem", fontWeight: "600" }}>
                            {statusLabel}
                          </span>
                          <span style={{ padding: "0.2rem 0.5rem", background: "#f0f0f0", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "600", color: "#555" }}>
                            {post.type}
                          </span>
                        </div>

                        {/* Date et heure */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginBottom: "0.75rem" }}>
                          <Clock size={14} />
                          {dateObj ? (
                            <>
                              {dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                              <span style={{ color: "var(--color-border)" }}>·</span>
                              {dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </>
                          ) : '—'}
                        </div>

                        {/* Média */}
                        {mediaUrls.length > 0 && (
                          <div style={{ marginBottom: "0.75rem" }}>
                            <div style={{ fontSize: "0.6875rem", fontWeight: "600", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.375rem" }}>
                              {t('common.media')} ({mediaUrls.length})
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                              {mediaUrls.slice(0, 4).map((url: string, idx: number) => {
                                const normalizedUrl = getMediaUrlForContext(url, "preview");
                                const isVideo = url.match(/\.(mp4|webm)($|\?)/i);
                                const size = mediaUrls.length === 1 ? 260 : 160;
                                return (
                                  <div
                                    key={idx}
                                    style={{
                                      width: `${size}px`,
                                      height: `${size}px`,
                                      borderRadius: "8px",
                                      overflow: "hidden",
                                      border: "2px solid var(--color-border)",
                                      flexShrink: 0,
                                      background: "#f5f5f5"
                                    }}
                                  >
                                    {isVideo ? (
                                      <video src={normalizedUrl} controls playsInline style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                    ) : (
                                      <img src={normalizedUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    )}
                                  </div>
                                );
                              })}
                              {mediaUrls.length > 4 && (
                                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "160px", height: "160px", background: "var(--color-gray-100)", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "700", color: "#666" }}>
                                  +{mediaUrls.length - 4}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Caption complète */}
                        {getDisplayCaptionPost(post, language) && (
                          <p style={{ fontSize: "0.8125rem", color: "#334155", lineHeight: 1.55, marginBottom: "0.5rem", whiteSpace: "pre-wrap" }}>
                            {getDisplayCaptionPost(post, language)}
                          </p>
                        )}

                        {/* Hashtags */}
                        {post.hashtags && (
                          <div style={{ marginBottom: "1rem" }}>
                            <div style={{ fontSize: "0.6875rem", fontWeight: "600", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.25rem" }}>
                              #{t('common.hashtags')}
                            </div>
                            <p style={{ fontSize: "0.8125rem", color: "var(--color-primary)", fontWeight: "500", margin: 0 }}>{post.hashtags}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          {post.status === 'PUBLISHED' ? (
                            <button
                              type="button"
                              onClick={() => setSelectedPublishedPost(post)}
                              className="btn-meta btn-meta-primary"
                              style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem" }}
                            >
                              <Eye size={14} /> Voir détails
                            </button>
                          ) : (
                            <Link href={`/posts/${post._id}/edit`} style={{ textDecoration: "none" }}>
                              <button type="button" className="btn-meta" style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem", background: "#f3f4f6", border: "none", borderRadius: "6px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                                <Edit size={14} /> {t('common.edit')}
                              </button>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {dayCollabs.length > 0 && (
                    <>
                      <h4 className="dash-calendar-section-title">COLLABORATIONS</h4>
                      {dayCollabs.map((item: any, idx: number) => {
                        const collab = item.collab || item;
                        const kind = item.kind;
                        const isPublished = kind === 'COLLAB_PUBLISHED' || collab.status === 'PUBLISHED';
                        const isReview = kind === 'COLLAB_REVIEW' || collab.status === 'CLIENT_REVIEW';
                        const isDraft = kind === 'COLLAB_DRAFT' || collab.status === 'DRAFT';
                        const statusColor = isPublished ? "#059669" : isReview ? "#f59e0b" : isDraft ? "#64748b" : "#8b5cf6";
                        const statusLabel = isPublished ? (t('workflow.statuses.published') || 'Collaboration publiée') : isReview ? (t('workflow.statuses.revision') || 'Collaboration en révision') : isDraft ? (t('workflow.statuses.draft') || 'Brouillon') : (t('workflow.statuses.planned') || 'Collaboration planifiée');
                        const videoUrls = getVideoUrlsFromCollab(collab);
                        const publishedAt = collab.contentUploads?.find((u: any) => u.publishedAt)?.publishedAt;
                        const displayDate = publishedAt || collab.startDate || collab.endDate;
                        const caption = (language === 'it' && collab.captionIt) ? collab.captionIt : (collab.captionFr || collab.captionIt || '');
                        const platforms = collab.platforms?.length ? collab.platforms : [...new Set((collab.contentUploads || []).map((u: any) => u.platform).filter(Boolean))];
                        return (
                          <div
                            key={`collab-${idx}`}
                            className="dash-calendar-collab-card"
                            style={{
                              borderLeftColor: statusColor
                            }}
                          >
                            <span
                              className="dash-calendar-collab-badge"
                              style={{ background: statusColor }}
                            >
                              <Eye size={12} />
                              {(isReview ? 'RÉVISION' : isDraft ? (t('workflow.statuses.draft') || 'BROUILLON').toUpperCase() : statusLabel.toUpperCase())}
                            </span>
                            <h4 className="dash-calendar-collab-name">
                              <User size={16} />
                              {getInfluencerName(collab.influencerId || '')}
                            </h4>
                            <div className="dash-calendar-collab-project">
                              <Building2 size={14} />
                              {getProjectName(collab.projectId)}
                            </div>
                            {/* Date de publication / date – toujours affichée */}
                            <div className="dash-calendar-collab-meta">
                              <span className="dash-calendar-collab-meta-label">Date de publication</span>
                              <span className="dash-calendar-collab-meta-value">
                                {displayDate
                                  ? new Date(displayDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                                  : '—'}
                              </span>
                            </div>
                            {/* Plateforme(s) – toujours affichée */}
                            <div className="dash-calendar-collab-platforms">
                              <span className="dash-calendar-collab-meta-label">Plateforme(s)</span>
                              <div className="dash-calendar-collab-platforms-list">
                                {platforms.length > 0
                                  ? platforms.map((platform: string) => {
                                      const NetworkIcon = networkIcons[platform.toLowerCase()];
                                      const color = networkColors[platform.toLowerCase()] || "#4f46e5";
                                      return (
                                        <span
                                          key={platform}
                                          className="dash-calendar-collab-platform-tag"
                                          style={{ background: `${color}18`, color }}
                                        >
                                          {NetworkIcon && <NetworkIcon size={12} strokeWidth={2} />}
                                          {platform}
                                        </span>
                                      );
                                    })
                                  : <span className="dash-calendar-collab-platform-empty">—</span>}
                              </div>
                            </div>
                            {(getDisplayDescriptionCollab(collab, language) || item.content?.description) && (
                              <p className="dash-calendar-collab-desc">
                                {(getDisplayDescriptionCollab(collab, language) || item.content?.description || '').substring(0, 200)}
                                {(getDisplayDescriptionCollab(collab, language) || item.content?.description || '').length > 200 ? '...' : ''}
                              </p>
                            )}
                            {videoUrls.length > 0 && (
                              <div className="dash-calendar-collab-video">
                                <div className="dash-calendar-collab-video-label">APERÇU VIDÉO</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
                                  {videoUrls.map((url, i) => (
                                    <video
                                      key={i}
                                      src={getMediaUrlForContext(url, "preview")}
                                      controls
                                      playsInline
                                      className="dash-calendar-collab-video-player"
                                      style={{ width: '100%', borderRadius: '8px' }}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                            {caption && (
                              <div className="dash-calendar-collab-caption">
                                <span className="dash-calendar-collab-meta-label">Caption</span>
                                <p className="dash-calendar-collab-caption-text">{caption.length > 150 ? caption.substring(0, 150) + '...' : caption}</p>
                              </div>
                            )}
                            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border, #e5e5e5)' }}>
                              <Link
                                href={`/collab?expand=${collab._id}`}
                                className="dash-calendar-collab-edit-btn"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.375rem',
                                  padding: '0.5rem 1rem',
                                  background: statusColor,
                                  color: 'white',
                                  borderRadius: '8px',
                                  fontSize: '0.875rem',
                                  fontWeight: 600,
                                  textDecoration: 'none',
                                  transition: 'opacity 0.2s'
                                }}
                              >
                                {isPublished ? (
                                  <>
                                    <Eye size={14} strokeWidth={2} />
                                    {t('calendarCollab.viewDetails') || t('common.details') || 'Voir détails'}
                                  </>
                                ) : (
                                  <>
                                    <Edit size={14} strokeWidth={2} />
                                    {t('common.edit') || 'Modifier'}
                                  </>
                                )}
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </>
              );
            })()}
              </div>
            </div>
          </div>
        )}
        </section>

      {/* Recent Activity */}
      <div className="slide-in-up">
        <h2 style={{ 
          fontSize: "1.5rem", 
          fontWeight: "700",
          marginBottom: "1.5rem",
          letterSpacing: "-0.02em",
          color: "#111111",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Roboto', sans-serif"
        }}>
          {t('dashboard.recentActivity')}
        </h2>
        
        <div style={{
          padding: "2.5rem",
          textAlign: "center",
          background: "white",
          border: "1px solid #e5e5e5",
          borderRadius: "16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
        }}>
          <div className="float" style={{
            width: "80px",
            height: "80px",
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem",
            boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)"
          }}>
            <TrendingUp size={40} color="white" strokeWidth={2} />
          </div>
          <p style={{ 
            fontSize: "1.125rem", 
            fontWeight: "700", 
            marginBottom: "0.5rem", 
            color: "#111111",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Roboto', sans-serif"
          }}>
            {t('dashboard.noRecentActivity')}
          </p>
          <p style={{ fontSize: "0.9375rem", color: "#666" }}>
            {t('dashboard.recentActivityDescription')}
          </p>
        </div>
      </div>

        {/* Modal Détails Post Publié – style carte crème (date, plateformes, statut, médias, caption, Modifier) */}
        {selectedPublishedPost && (
          <div
            className="collab-detail-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedPublishedPost(null);
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="post-detail-title"
          >
            <div
              className="post-detail-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="post-detail-modal-header">
                <h2 id="post-detail-title" className="post-detail-modal-title">
                  {selectedPublishedPost.publishedAt
                    ? (() => {
                        const d = new Date(selectedPublishedPost.publishedAt);
                        const month = [t('calendar.months.january'), t('calendar.months.february'), t('calendar.months.march'), t('calendar.months.april'), t('calendar.months.may'), t('calendar.months.june'), t('calendar.months.july'), t('calendar.months.august'), t('calendar.months.september'), t('calendar.months.october'), t('calendar.months.november'), t('calendar.months.december')][d.getMonth()];
                        return `${d.getDate()} ${month.charAt(0).toUpperCase() + month.slice(1)}`;
                      })()
                    : selectedPublishedPost.scheduledAt
                    ? (() => {
                        const d = new Date(selectedPublishedPost.scheduledAt);
                        const month = [t('calendar.months.january'), t('calendar.months.february'), t('calendar.months.march'), t('calendar.months.april'), t('calendar.months.may'), t('calendar.months.june'), t('calendar.months.july'), t('calendar.months.august'), t('calendar.months.september'), t('calendar.months.october'), t('calendar.months.november'), t('calendar.months.december')][d.getMonth()];
                        return `${d.getDate()} ${month.charAt(0).toUpperCase() + month.slice(1)}`;
                      })()
                    : t('dashboard.postDetails') || 'Détails du post'}
                </h2>
                <button
                  type="button"
                  className="dash-calendar-day-close"
                  onClick={() => setSelectedPublishedPost(null)}
                  aria-label={t('common.close')}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="post-detail-card">
                {(() => {
                  const statusInfo = statusConfig[selectedPublishedPost.status] || statusConfig.PUBLISHED;
                  const networks = selectedPublishedPost.networks || [selectedPublishedPost.network];
                  const projectNames = getProjectNamesForPost(selectedPublishedPost);
                  const dateObj = selectedPublishedPost.publishedAt ? new Date(selectedPublishedPost.publishedAt) : selectedPublishedPost.scheduledAt ? new Date(selectedPublishedPost.scheduledAt) : null;
                  return (
                    <>
                      <div className="post-detail-row post-detail-row-head">
                        <span className="post-detail-date">
                          <Calendar size={18} />
                          {dateObj ? dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '—'}
                        </span>
                        <span
                          className="post-detail-badge"
                          style={{ background: statusInfo.tint || `${statusInfo.color}18`, color: statusInfo.color }}
                        >
                          {(statusInfo.label || '').toUpperCase()}
                        </span>
                      </div>

                      {projectNames.length > 0 && (
                        <div className="post-detail-block">
                          <div className="post-detail-block-label">PROJET</div>
                          <div className="post-detail-tags">
                            {projectNames.map((name: string, i: number) => (
                              <span key={i} className="post-detail-tag post-detail-tag-project">{name}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {networks.length > 0 && (
                        <div className="post-detail-block">
                          <div className="post-detail-block-label">PLATEFORMES</div>
                          <div className="post-detail-tags">
                            {networks.map((network: string, idx: number) => {
                              const net = (network || '').toLowerCase();
                              const NetworkIcon = networkIcons[net];
                              const color = networkColors[net] || "#4f46e5";
                              return (
                                <span key={idx} className="post-detail-tag" style={{ background: `${color}18`, color }}>
                                  {NetworkIcon && <NetworkIcon size={14} strokeWidth={2} />}
                                  {network}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="post-detail-block">
                        <div className="post-detail-block-label">STATUT</div>
                        <div className="post-detail-tags">
                          <span className="post-detail-tag" style={{ background: statusInfo.tint || `${statusInfo.color}18`, color: statusInfo.color }}>
                            {statusInfo.label}
                          </span>
                          <span className="post-detail-tag post-detail-tag-type">post</span>
                        </div>
                      </div>

                      {dateObj && (
                        <div className="post-detail-meta">
                          <Clock size={16} />
                          <span>
                            {dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            {selectedPublishedPost.publishedAt && (
                              <> · {dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</>
                            )}
                          </span>
                        </div>
                      )}

                      {selectedPublishedPost.mediaUrls && selectedPublishedPost.mediaUrls.length > 0 && (
                        <div className="post-detail-block">
                          <div className="post-detail-block-label">MÉDIAS ({selectedPublishedPost.mediaUrls.length})</div>
                          <div className="post-detail-media-grid">
                            {selectedPublishedPost.mediaUrls.map((url: string, idx: number) => {
                              const normalizedUrl = getMediaUrlForContext(url, "preview");
                              const isVideo = url.match(/\.(mp4|webm)($|\?)/i);
                              return (
                                <div key={idx} className="post-detail-media-item" onClick={() => window.open(normalizedUrl, "_blank")}>
                                  {isVideo ? (
                                    <video src={normalizedUrl} controls playsInline />
                                  ) : (
                                    <img src={normalizedUrl} alt="" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {getDisplayCaptionPost(selectedPublishedPost, language) && (
                        <div className="post-detail-block post-detail-caption-block">
                          <div className="post-detail-block-label">LÉGENDE</div>
                          <p className="post-detail-caption-text">
                            {getDisplayCaptionPost(selectedPublishedPost, language)}
                          </p>
                        </div>
                      )}

                      <Link href={`/posts/${selectedPublishedPost._id}/edit`} className="post-detail-edit-btn">
                        <Edit size={18} />
                        Modifier
                      </Link>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Modal Détails Collaboration Publiée */}
        {selectedCollabInCalendar && (
          <div
            className="collab-detail-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedCollabInCalendar(null);
              }
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="collab-detail-title"
          >
            <div
              className="collab-detail-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="collab-detail-modal-header">
                <div style={{ flex: 1 }}>
                  {selectedCollabInCalendar.kind === 'COLLAB_REVIEW' ? (
                    <span className="collab-detail-badge" style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "white" }}>
                      <Eye size={12} />
                      Collaboration en révision
                    </span>
                  ) : selectedCollabInCalendar.kind === 'COLLAB_DRAFT' ? (
                    <span className="collab-detail-badge" style={{ background: "#64748b", color: "white" }}>
                      <FileText size={12} />
                      {t('workflow.statuses.draft') || 'Brouillon'}
                    </span>
                  ) : (
                    <span className="collab-detail-badge collab-detail-badge--published">
                      <CheckCircle size={12} />
                      Collaboration publiée
                    </span>
                  )}
                  <h2 id="collab-detail-title" className="collab-detail-modal-title">
                    Détails de la collaboration
                  </h2>
                </div>
                <button
                  type="button"
                  className="collab-detail-modal-close"
                  onClick={() => setSelectedCollabInCalendar(null)}
                  aria-label="Fermer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="collab-detail-modal-body">
                {(() => {
                  const collab = selectedCollabInCalendar.collab;
                  const getProjectNamesLocal = (p: Collaboration) => {
                    if (p.projectIds && p.projectIds.length > 0) {
                      return p.projectIds.map(id => {
                        const project = projects.find(proj => proj._id === id);
                        return project?.name || id;
                      });
                    }
                    const project = projects.find(proj => proj._id === p.projectId);
                    return project ? [project.name] : [p.projectId];
                  };

                  const publishedUploads = collab.contentUploads?.filter((upload: any) => upload.publishedAt) || [];

                  return (
                    <>
                      {/* Informations principales en grille compacte */}
                      <div className="collab-detail-cards">
                        <div className="collab-detail-card">
                          <div className="collab-detail-card-label">Influenceur</div>
                          <div className="collab-detail-card-value">
                            {getInfluencerName(collab.influencerId || '')}
                          </div>
                        </div>
                        <div className="collab-detail-card">
                          <div className="collab-detail-card-label">Projets</div>
                          <div className="collab-detail-card-value">
                            {getProjectNamesLocal(collab).map((name, idx) => (
                              <span key={idx}>
                                {idx > 0 && <span style={{ margin: "0 4px", color: "var(--color-text-tertiary)" }}>·</span>}
                                {name}
                              </span>
                            ))}
                          </div>
                        </div>
                        {(collab as any).contentType === "reel" || (collab as any).contentType === "story" ? (
                          <div className="collab-detail-card">
                            <div className="collab-detail-card-label">Type de contenu</div>
                            <div className="collab-detail-card-value">{(collab as any).contentType === "reel" ? "🎬 Reel" : "📱 Story"}</div>
                          </div>
                        ) : null}
                        {(collab as any).platforms && (collab as any).platforms.length > 0 ? (
                          <div className="collab-detail-card" style={{ gridColumn: "1 / -1" }}>
                            <div className="collab-detail-card-label">Plateformes</div>
                            <div className="collab-detail-card-value" style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                              {((collab as any).platforms as string[]).map((p: string, i: number) => (
                                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 8px", background: "var(--color-primary-50)", color: "var(--color-primary)", borderRadius: "6px", fontSize: "12px", fontWeight: 600 }}>
                                  {p === "instagram" ? "📷" : p === "facebook" ? "📘" : p === "tiktok" ? "🎵" : p === "youtube" ? "▶️" : p === "x" ? "🐦" : p === "linkedin" ? "💼" : p === "threads" ? "🧵" : "📱"} {p.charAt(0).toUpperCase() + p.slice(1)}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {canSeeBudgetAndTarifs() && collab.budget != null && collab.budget > 0 && (
                          <div className="collab-detail-card">
                            <div className="collab-detail-card-label">Budget</div>
                            <div className="collab-detail-card-value" style={{ fontWeight: 600, color: "var(--color-primary)" }}>
                              {collab.budget.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </div>
                          </div>
                        )}
                        <div className="collab-detail-card">
                          <div className="collab-detail-card-label">Dates</div>
                          <div className="collab-detail-card-value" style={{ fontSize: "12px" }}>
                            {new Date(collab.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {collab.startDate !== collab.endDate && (
                              <> → {new Date(collab.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                            )}
                          </div>
                        </div>
                        {(collab as any).createdBy && (
                          <div className="collab-detail-card">
                            <div className="collab-detail-card-label">Créé par</div>
                            <div className="collab-detail-card-value" style={{ fontSize: "12px" }}>{(collab as any).createdBy}</div>
                          </div>
                        )}
                        <div className="collab-detail-card">
                          <div className="collab-detail-card-label">Statut</div>
                          <div className="collab-detail-card-value" style={{ fontSize: "12px", textTransform: "capitalize" }}>
                            {(collab.status || "").replace(/_/g, " ")}
                          </div>
                        </div>
                      </div>

                      {/* Description (français) */}
                      {(collab as any).description && (
                        <div className="collab-detail-section">
                          <div className="collab-detail-section-title">Description (français)</div>
                          <p className="collab-detail-description" style={{ whiteSpace: "pre-wrap" }}>{(collab as any).description}</p>
                        </div>
                      )}
                      {/* Description (italien) */}
                      {(collab as any).descriptionIt && (
                        <div className="collab-detail-section">
                          <div className="collab-detail-section-title">Description (italien)</div>
                          <p className="collab-detail-description" style={{ whiteSpace: "pre-wrap" }}>{(collab as any).descriptionIt}</p>
                        </div>
                      )}
                      {/* Caption (français) */}
                      {(collab as any).captionFr && (
                        <div className="collab-detail-section">
                          <div className="collab-detail-section-title">Caption (français)</div>
                          <p className="collab-detail-description" style={{ whiteSpace: "pre-wrap" }}>{(collab as any).captionFr}</p>
                        </div>
                      )}
                      {/* Caption (italien) */}
                      {(collab as any).captionIt && (
                        <div className="collab-detail-section">
                          <div className="collab-detail-section-title">Caption (italien)</div>
                          <p className="collab-detail-description" style={{ whiteSpace: "pre-wrap" }}>{(collab as any).captionIt}</p>
                        </div>
                      )}
                      {/* Description (fallback) */}
                      {!(collab as any).description && !(collab as any).descriptionIt && getDisplayDescriptionCollab(collab, language) ? (
                        <div className="collab-detail-section">
                          <div className="collab-detail-section-title">Description</div>
                          <p className="collab-detail-description">
                            {getDisplayDescriptionCollab(collab, language)}
                          </p>
                        </div>
                      ) : null}

                      {/* Aperçu vidéo */}
                      {(() => {
                        const videoUrls = getVideoUrlsFromCollab(collab);
                        if (videoUrls.length === 0) return null;
                        return (
                          <div className="collab-detail-section">
                            <div className="collab-detail-section-title">🎬 Aperçu vidéo</div>
                            <div style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                              gap: "var(--spacing-3)"
                            }}>
                              {videoUrls.slice(0, 3).map((url, idx) => (
                                <VideoPreviewCard key={idx} url={url} maxHeight={280} minHeight={160} />
                              ))}
                            </div>
                            {videoUrls.length > 3 && (
                              <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginTop: "var(--spacing-2)", marginBottom: 0 }}>
                                +{videoUrls.length - 3} vidéo(s) supplémentaire(s)
                              </p>
                            )}
                          </div>
                        );
                      })()}

                      {/* Performance - Contenus publiés */}
                      {publishedUploads.length > 0 && (
                        <div className="collab-detail-section">
                          <div className="collab-detail-perf-header">
                            <h3 className="collab-detail-perf-title">Performance</h3>
                            <span className="collab-detail-perf-sub">{publishedUploads.length} contenu(s) publié(s)</span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
                            {publishedUploads.map((upload: any, idx: number) => (
                              <div key={idx} className="collab-detail-upload-card">
                                <div style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                  gap: "var(--spacing-2)",
                                  marginBottom: "var(--spacing-2)",
                                  paddingBottom: "var(--spacing-2)",
                                  borderBottom: "1px solid var(--color-border-light)"
                                }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)", flexWrap: "wrap" }}>
                                    <span style={{
                                      padding: "2px 6px",
                                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                      color: "white",
                                      borderRadius: "4px",
                                      fontSize: "9px",
                                      fontWeight: 600,
                                      textTransform: "uppercase"
                                    }}>
                                      Publié
                                    </span>
                                    {upload.platform && (
                                      <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>{upload.platform}</span>
                                    )}
                                  </div>
                                  {upload.publishedAt && (
                                    <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
                                      {new Date(upload.publishedAt).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                </div>

                                {upload.postUrl && (
                                  <div style={{ marginBottom: "var(--spacing-2)" }}>
                                    <a
                                      href={upload.postUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        padding: "var(--spacing-2) var(--spacing-3)",
                                        background: "var(--color-primary)",
                                        color: "white",
                                        borderRadius: "8px",
                                        textDecoration: "none",
                                        fontSize: "12px",
                                        fontWeight: 600
                                      }}
                                    >
                                      <ExternalLink size={14} strokeWidth={2.5} />
                                      Voir la publication
                                    </a>
                                  </div>
                                )}

                                {upload.insights && Object.values(upload.insights).some(Boolean) && (
                                  <div className="collab-detail-metrics">
                                    {upload.insights.views !== undefined && (
                                      <div className="collab-detail-metric">
                                        <div className="collab-detail-metric-label">Vues</div>
                                        <div className="collab-detail-metric-value">{upload.insights.views.toLocaleString()}</div>
                                      </div>
                                    )}
                                    {upload.insights.likes !== undefined && (
                                      <div className="collab-detail-metric">
                                        <div className="collab-detail-metric-label">Likes</div>
                                        <div className="collab-detail-metric-value">{upload.insights.likes.toLocaleString()}</div>
                                      </div>
                                    )}
                                    {upload.insights.comments !== undefined && (
                                      <div className="collab-detail-metric">
                                        <div className="collab-detail-metric-label">Comm.</div>
                                        <div className="collab-detail-metric-value">{upload.insights.comments.toLocaleString()}</div>
                                      </div>
                                    )}
                                    {upload.insights.shares !== undefined && (
                                      <div className="collab-detail-metric">
                                        <div className="collab-detail-metric-label">Part.</div>
                                        <div className="collab-detail-metric-value">{upload.insights.shares.toLocaleString()}</div>
                                      </div>
                                    )}
                                    {upload.insights.saves !== undefined && (
                                      <div className="collab-detail-metric">
                                        <div className="collab-detail-metric-label">Enreg.</div>
                                        <div className="collab-detail-metric-value">{upload.insights.saves.toLocaleString()}</div>
                                      </div>
                                    )}
                                    {upload.insights.engagement_rate !== undefined && (
                                      <div className="collab-detail-metric">
                                        <div className="collab-detail-metric-label">Taux</div>
                                        <div className="collab-detail-metric-value">{upload.insights.engagement_rate.toFixed(2)}%</div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        <ToastContainer />
      </div>
    </div>
  );
}
