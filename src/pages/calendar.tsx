import React, { useEffect, useState } from "react";
import { Calendar, Clock, Instagram, Facebook, Music, ChevronLeft, ChevronRight, Edit, Trash2, CheckCircle, FileText, X as XIcon, Eye, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getMediaUrlForContext } from "@/lib/utils";
import { useTranslation } from "@/i18n/TranslationContext";
import { getDisplayCaptionPost, useTranslatePostDescriptionsWhenIt } from "@/lib/i18n-content";
import Breadcrumbs from "@/components/Breadcrumbs";

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
  mediaUrls: string[];
  scheduledAt: string;
  createdAt?: string;
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
};


export default function CalendarPage(): React.JSX.Element {
  const { t, language } = useTranslation();
  const [posts, setPosts] = useState<Post[]>([]);
  useTranslatePostDescriptionsWhenIt(language, posts, setPosts as any);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [projectFilter, setProjectFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [draggedPost, setDraggedPost] = useState<Post | null>(null);
  const [selectedPublishedPost, setSelectedPublishedPost] = useState<Post | null>(null);
  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'year'>('month');

  const translateOrDefault = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/posts').then(r => r.json()),
      fetch('/api/projects').then(r => r.json())
    ])
      .then(([postsData, projectsData]) => {
        const calendarPosts = (postsData.posts || []).filter((p: Post) =>
          ['DRAFT', 'PENDING_GRAPHIC', 'CLIENT_REVIEW', 'PENDING_CORRECTION', 'SCHEDULED', 'PUBLISHED'].includes(p.status)
        );
        setPosts(calendarPosts);
        setProjects(projectsData.projects || []);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedPublishedPost) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPublishedPost(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedPublishedPost]);

  useEffect(() => {
    if (!selectedDay) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedDay(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedDay]);

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p._id === projectId);
    return project?.name || projectId;
  };

  const getProjectNames = (post: Post): string[] => {
    const ids = (post.projectIds && post.projectIds.length > 0)
      ? post.projectIds
      : (post.projectId ? [post.projectId] : []);
    return ids.map(id => getProjectName(id));
  };


  const formatNumber = (value?: number) => {
    if (value === undefined || value === null) return null;
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString('fr-FR');
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

  const getPostsForDate = (y: number, m: number, d: number) => {
    return posts.filter(post => {
      const dateStr = post.scheduledAt || post.createdAt;
      if (!dateStr) return false;
      const postDate = new Date(dateStr);
      const networks = post.networks || [post.network];
      const matchesDate = postDate.getDate() === d && postDate.getMonth() === m && postDate.getFullYear() === y;
      const postProjectIds = (post.projectIds && post.projectIds.length > 0) ? post.projectIds : (post.projectId ? [post.projectId] : []);
      const matchesProject = projectFilter === "all" || postProjectIds.includes(projectFilter);
      const matchesPlatform = platformFilter === "all" || networks.includes(platformFilter);
      const matchesStatus = statusFilter === "all" || post.status === statusFilter;
      return matchesDate && matchesProject && matchesPlatform && matchesStatus;
    });
  };

  const getPostsForDay = (day: number) => {
    const { year, month } = getDaysInMonth(currentDate);
    return posts.filter(post => {
      const dateStr = post.scheduledAt || post.createdAt;
      if (!dateStr) return false;
      const postDate = new Date(dateStr);
      const networks = post.networks || [post.network];
      
      // Date filter
      const matchesDate = postDate.getDate() === day && 
                         postDate.getMonth() === month && 
                         postDate.getFullYear() === year;
      
      // Project filter (support single projectId and multiple projectIds)
      const postProjectIds = (post.projectIds && post.projectIds.length > 0)
        ? post.projectIds
        : (post.projectId ? [post.projectId] : []);
      const matchesProject = projectFilter === "all" || postProjectIds.includes(projectFilter);
      
      // Platform filter
      const matchesPlatform = platformFilter === "all" || networks.includes(platformFilter);
      
      // Status filter
      const matchesStatus = statusFilter === "all" || post.status === statusFilter;
      
      return matchesDate && matchesProject && matchesPlatform && matchesStatus;
    });
  };

  const handleDrop = async (day: number) => {
    if (!draggedPost) return;
    
    const { year, month } = getDaysInMonth(currentDate);
    const oldDate = new Date(draggedPost.scheduledAt);
    const newDate = new Date(year, month, day, oldDate.getHours(), oldDate.getMinutes());
    
    try {
      await fetch(`/api/posts/${draggedPost._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt: newDate.toISOString() })
      });
      
      setPosts(posts.map(p => 
        p._id === draggedPost._id 
          ? { ...p, scheduledAt: newDate.toISOString() }
          : p
      ));
      
      setDraggedPost(null);
      alert(t('calendar.postMovedSuccess'));
    } catch (error) {
      alert(t('calendar.postMovedError'));
    }
  };

  const handleDelete = async (postId: string) => {
    if (confirm(t('calendar.deleteConfirm'))) {
      try {
        await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
        setPosts(posts.filter(p => p._id !== postId));
        alert(t('calendar.postDeletedSuccess'));
      } catch (error) {
        alert(t('calendar.postDeletedError'));
      }
    }
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
  const monthNames = [
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
  ];
  const dayNames = [
    t('calendar.days.sunday'),
    t('calendar.days.monday'),
    t('calendar.days.tuesday'),
    t('calendar.days.wednesday'),
    t('calendar.days.thursday'),
    t('calendar.days.friday'),
    t('calendar.days.saturday')
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const prevYear = () => {
    setCurrentDate(new Date(year - 1, month, 1));
  };

  const nextYear = () => {
    setCurrentDate(new Date(year + 1, month, 1));
  };

  const getPostsCountForMonth = (m: number, y: number) => {
    return posts.filter(post => {
      const dateStr = post.scheduledAt || post.createdAt;
      if (!dateStr) return false;
      const postDate = new Date(dateStr);
      const networks = post.networks || [post.network];
      const postProjectIds = (post.projectIds && post.projectIds.length > 0) ? post.projectIds : (post.projectId ? [post.projectId] : []);
      const matchesProject = projectFilter === "all" || postProjectIds.includes(projectFilter);
      const matchesPlatform = platformFilter === "all" || networks.includes(platformFilter);
      const matchesStatus = statusFilter === "all" || post.status === statusFilter;
      return postDate.getMonth() === m && postDate.getFullYear() === y && matchesProject && matchesPlatform && matchesStatus;
    }).length;
  };

  const networkColors: any = {
    instagram: "#e4405f",
    facebook: "#1877f2",
    tiktok: "#000000",
    threads: "#101010"
  };

  const networkIcons: any = {
    instagram: Instagram,
    facebook: Facebook,
    tiktok: Music
  };

  // Configuration des statuts avec les mêmes couleurs que le workflow (révision ≠ correction)
  const statusConfig: any = {
    DRAFT: { label: t('workflow.statuses.draft') || 'Draft', color: "#64748b", tint: "#64748b18", icon: FileText },
    PENDING_GRAPHIC: { label: t('workflow.statuses.creation') || 'En création', color: "#8b5cf6", tint: "#8b5cf618", icon: FileText },
    CLIENT_REVIEW: { label: t('workflow.statuses.revision') || 'En révision', color: "#f59e0b", tint: "#f59e0b18", icon: Eye },
    PENDING_CORRECTION: { label: t('workflow.statuses.corrections') || 'En correction', color: "#f97316", tint: "#f9731618", icon: Eye },
    SCHEDULED: { label: t('workflow.statuses.planned') || 'Planifié', color: "#0284c7", tint: "#0284c718", icon: Calendar },
    PUBLISHED: { label: t('workflow.statuses.published') || 'Publié', color: "#059669", tint: "#05966918", icon: CheckCircle }
  };

  const selectedDayPosts = selectedDay
    ? getPostsForDate(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate())
    : [];
  const scheduledPostsCount = posts.filter(p => {
    const networks = p.networks || [p.network];
    const postProjectIds = (p.projectIds && p.projectIds.length > 0) ? p.projectIds : (p.projectId ? [p.projectId] : []);
    const matchesProject = projectFilter === "all" || postProjectIds.includes(projectFilter);
    const matchesPlatform = platformFilter === "all" || networks.includes(platformFilter);
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesProject && matchesPlatform && matchesStatus;
  }).length;

  return (
    <div className="page-container">
      <div className="page-content dash">
        <div className="page-hero">
          <div className="page-hero-inner">
            <div className="page-hero-text">
              <div className="page-hero-breadcrumbs">
                <Breadcrumbs items={[
                  { label: t('menu.dashboard'), href: '/' },
                  { label: t('calendar.title') }
                ]} />
              </div>
              <h1 className="page-hero-title">{t('calendar.title')}</h1>
              <p className="page-hero-subtitle">
                {scheduledPostsCount} {t('calendar.scheduledPosts')}
              </p>
            </div>
          </div>
        </div>

        <div className="dash-section calendar-section">
          <div className="calendar-filters-bar">
            <div className="calendar-filter-group">
              <label className="calendar-filter-label">{t('common.project')}</label>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="calendar-filter-select"
              >
                <option value="all">{t('workflow.allProjects')}</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>{project.name}</option>
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
                <option value="PENDING_GRAPHIC">{t('workflow.statuses.creation') || 'En création'}</option>
                <option value="CLIENT_REVIEW">{t('workflow.statuses.revision') || 'En révision'}</option>
                <option value="PENDING_CORRECTION">{t('workflow.statuses.corrections') || 'En correction'}</option>
                <option value="SCHEDULED">{t('workflow.statuses.planned') || 'Planifié'}</option>
                <option value="PUBLISHED">{t('workflow.statuses.published') || 'Publié'}</option>
              </select>
            </div>
          </div>

        <div className="calendar-layout calendar-layout-full">
          <div className="calendar-card">
            <div className="calendar-nav">
              <div className="calendar-nav-left">
                <h2 className="calendar-month-title">
                  {calendarViewMode === 'year' ? year : `${monthNames[month]} ${year}`}
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
                    <button type="button" onClick={prevYear} className="calendar-nav-btn" aria-label={t('calendar.prevYear') || 'Année précédente'}>
                      <ChevronLeft size={20} />
                    </button>
                    <button type="button" onClick={nextYear} className="calendar-nav-btn" aria-label={t('calendar.nextYear') || 'Année suivante'}>
                      <ChevronRight size={20} />
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={prevMonth} className="calendar-nav-btn" aria-label={t('calendar.prevMonth') || 'Mois précédent'}>
                      <ChevronLeft size={20} />
                    </button>
                    <button type="button" onClick={nextMonth} className="calendar-nav-btn" aria-label={t('calendar.nextMonth') || 'Mois suivant'}>
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {calendarViewMode === 'year' ? (
              <div className="calendar-year-grid-days">
                {monthNames.map((name, m) => {
                  const firstDay = new Date(year, m, 1);
                  const daysInThisMonth = new Date(year, m + 1, 0).getDate();
                  const startOffset = firstDay.getDay();
                  const totalCells = startOffset + daysInThisMonth;
                  const rows = Math.ceil(totalCells / 7);
                  const isCurrentMonth = new Date().getMonth() === m && new Date().getFullYear() === year;
                  return (
                    <div
                      key={m}
                      className={`calendar-year-month-block ${isCurrentMonth ? 'is-current-month' : ''}`}
                    >
                      <div className="calendar-year-month-block-title">{name}</div>
                      <div className="calendar-year-mini-weekdays">
                        {dayNames.map(dayName => (
                          <div key={dayName} className="calendar-year-mini-weekday">{dayName}</div>
                        ))}
                      </div>
                      <div className="calendar-year-mini-days" style={{ gridTemplateRows: `repeat(${rows}, minmax(28px, 1fr))` }}>
                        {Array.from({ length: startOffset }).map((_, i) => (
                          <div key={`empty-${m}-${i}`} className="calendar-year-mini-day calendar-year-mini-day-empty" aria-hidden="true" />
                        ))}
                        {Array.from({ length: daysInThisMonth }).map((_, i) => {
                          const day = i + 1;
                          const dayPosts = getPostsForDate(year, m, day);
                          const hasItems = dayPosts.length > 0;
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
              {dayNames.map(day => (
                <div key={day} className="calendar-weekday">{day}</div>
              ))}
            </div>

            <div className="calendar-days">
              {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="calendar-day-empty" aria-hidden="true" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayPosts = getPostsForDay(day);
                const hasItems = dayPosts.length > 0;
                const isToday = new Date().getDate() === day &&
                  new Date().getMonth() === month &&
                  new Date().getFullYear() === year;
                const isSelected = selectedDay?.getDate() === day && selectedDay?.getMonth() === month && selectedDay?.getFullYear() === year;

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
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.background = 'var(--color-primary-100)';
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.style.background = hasItems ? 'var(--color-primary-50)' : 'var(--color-white)';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.background = hasItems ? 'var(--color-primary-50)' : 'var(--color-white)';
                      handleDrop(day);
                    }}
                    className={`calendar-day ${isToday ? 'is-today' : ''} ${hasItems ? 'has-events' : ''} ${isSelected ? 'is-selected' : ''}`}
                  >
                    <span className="calendar-day-num">{day}</span>
                    {dayPosts.length > 0 && (
                      <div className="calendar-day-bars">
                        {dayPosts.slice(0, 3).map((post, idx) => {
                          const statusInfo = statusConfig[post.status] || statusConfig.SCHEDULED;
                          return (
                            <div
                              key={`post-${post._id}-${idx}`}
                              draggable
                              onDragStart={(e) => {
                                e.stopPropagation();
                                setDraggedPost(post);
                              }}
                              onDragEnd={() => setDraggedPost(null)}
                              className="calendar-day-bar"
                              style={{ background: statusInfo.color }}
                            />
                          );
                        })}
                        {dayPosts.length > 3 && (
                          <span className="calendar-day-more">+{dayPosts.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="calendar-legend">
              {['DRAFT', 'PENDING_GRAPHIC', 'CLIENT_REVIEW', 'PENDING_CORRECTION', 'SCHEDULED', 'PUBLISHED'].map((status) => {
                const config = statusConfig[status] || statusConfig.SCHEDULED;
                return (
                  <div key={status} className="calendar-legend-item">
                    <span className="calendar-legend-dot" style={{ background: config.color }} />
                    <span>{config.label}</span>
                  </div>
                );
              })}
            </div>
              </>
            )}
          </div>

          {/* Overlay Détails de la date (au clic sur un jour) */}
          {selectedDay && (
            <div
              className="calendar-date-detail-overlay"
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedDay(null);
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="calendar-date-detail-title"
            >
              <div
                className="calendar-sidebar-panel calendar-date-detail-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="calendar-sidebar-day-header">
                  <h3 id="calendar-date-detail-title" className="calendar-sidebar-day-title">
                    {selectedDay.getDate()} {monthNames[selectedDay.getMonth()]}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedDay(null)}
                    className="calendar-sidebar-close"
                    aria-label={t('common.close')}
                  >
                    <XIcon size={20} />
                  </button>
                </div>

                {selectedDayPosts.length === 0 ? (
                  <div className="calendar-sidebar-empty">
                    <Calendar size={48} strokeWidth={1} className="calendar-sidebar-empty-icon" style={{ margin: "0 auto", display: "block" }} />
                    <p className="calendar-sidebar-empty-text">
                      {t('calendar.noPost') || "Aucun post programmé pour cette date."}
                    </p>
                  </div>
                ) : (
                  <div>
                    <h4 className="calendar-sidebar-section-title">
                          {(() => {
                            const hasPublished = selectedDayPosts.some(p => p.status === 'PUBLISHED');
                            const hasScheduled = selectedDayPosts.some(p => p.status === 'SCHEDULED');
                            if (hasPublished && hasScheduled) return "Posts";
                            if (hasPublished) return "Posts publiés";
                            return translateOrDefault('calendar.scheduledPosts', "Posts planifiés");
                          })()}
                        </h4>
                        <div className="calendar-sidebar-list">
                          {selectedDayPosts.map(post => {
                            const networks = post.networks || [post.network];
                            const statusInfo = statusConfig[post.status] || statusConfig.SCHEDULED;
                            return (
                              <div 
                                key={post._id}
                                draggable
                                onDragStart={() => setDraggedPost(post)}
                                onDragEnd={() => setDraggedPost(null)}
                                className="card-meta"
                                style={{
                                  padding: "1rem",
                                  borderLeft: `4px solid ${statusInfo.color}`,
                                  background: statusInfo.tint || `${statusInfo.color}18`,
                                  cursor: "grab",
                                  opacity: draggedPost?._id === post._id ? 0.5 : 1
                                }}
                              >
                                <div style={{ display: "flex", gap: "0.375rem", marginBottom: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                                  <span style={{
                                    padding: "0.25rem 0.5rem",
                                    background: statusInfo.color,
                                    color: "white",
                                    borderRadius: "4px",
                                    fontSize: "0.6875rem",
                                    fontWeight: "700",
                                    textTransform: "uppercase"
                                  }}>
                                    {statusInfo.label}
                                  </span>
                                  {networks.map((network, idx) => {
                                    const NetworkIcon = networkIcons[network];
                                    return (
                                      <span 
                                        key={idx}
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "0.25rem",
                                          padding: "0.25rem 0.5rem",
                                          background: `${networkColors[network]}15`,
                                          color: networkColors[network],
                                          borderRadius: "4px",
                                          fontSize: "0.6875rem",
                                          fontWeight: "600"
                                        }}
                                      >
                                        <NetworkIcon size={11} strokeWidth={2} />
                                        {network}
                                      </span>
                                    );
                                  })}
                                  <span style={{
                                    padding: "0.25rem 0.5rem",
                                    background: "#f0f0f0",
                                    borderRadius: "4px",
                                    fontSize: "0.6875rem",
                                    fontWeight: "600",
                                    color: "#666"
                                  }}>
                                    {post.type}
                                  </span>
                                  {post.status === 'PUBLISHED' && (
                                    <span style={{
                                      padding: "0.25rem 0.5rem",
                                      background: "#10b98115",
                                      color: "#10b981",
                                      borderRadius: "4px",
                                      fontSize: "0.6875rem",
                                      fontWeight: "700"
                                    }}>
                                      ✓ Publié
                                    </span>
                                  )}
                                </div>

                                <div style={{ 
                                  display: "flex", 
                                  alignItems: "center", 
                                  gap: "0.5rem",
                                  fontSize: "0.75rem",
                                  color: "#999",
                                  marginBottom: "1rem",
                                  flexWrap: "wrap"
                                }}>
                                  <Clock size={12} />
                                  {new Date(post.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  {getProjectNames(post).map((name, idx) => (
                                    <span
                                      key={idx}
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        padding: "0.15rem 0.35rem",
                                        background: "rgba(99, 102, 241, 0.12)",
                                        color: "#4f46e5",
                                        borderRadius: "4px",
                                        fontSize: "0.625rem",
                                        fontWeight: "600"
                                      }}
                                    >
                                      💼 {name}
                                    </span>
                                  ))}
                                </div>

                                {/* Pour les posts PUBLISHED, afficher uniquement caption + médias + statistiques */}
                                {post.status === 'PUBLISHED' ? (
                                  <>
                                    {getDisplayCaptionPost(post, language) && (
                                      <div style={{ marginBottom: "1rem" }}>
                                        <div style={{ 
                                          fontSize: "0.6875rem", 
                                          color: "var(--color-text-tertiary)", 
                                          fontWeight: "700", 
                                          textTransform: "uppercase",
                                          marginBottom: "0.5rem"
                                        }}>
                                          ✍️ Caption
                                        </div>
                                        <p style={{ fontSize: "0.8125rem", color: "#334155", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                                          {getDisplayCaptionPost(post, language)}
                                        </p>
                                      </div>
                                    )}

                                {post.mediaUrls && post.mediaUrls.length > 0 && (
                                  <div style={{ marginBottom: "1rem" }}>
                                    <div style={{ 
                                      fontSize: "0.6875rem", 
                                          color: "var(--color-text-tertiary)", 
                                      fontWeight: "700", 
                                      textTransform: "uppercase",
                                      marginBottom: "0.75rem"
                                    }}>
                                      📷 Media ({post.mediaUrls.length})
                                    </div>
                                    <div style={{ 
                                      display: "grid", 
                                      gridTemplateColumns: post.mediaUrls.length === 1 ? "1fr" : "repeat(2, minmax(140px, 1fr))", 
                                      gap: "0.75rem",
                                      marginBottom: "1rem"
                                    }}>
                                      {post.mediaUrls.map((url, idx) => {
                                        const normalizedUrl = getMediaUrlForContext(url, "calendar");
                                        return (
                                          <div 
                                            key={idx}
                                            onClick={() => window.open(normalizedUrl, '_blank')}
                                            style={{
                                              aspectRatio: "1",
                                              borderRadius: "6px",
                                              overflow: "hidden",
                                                  border: "2px solid var(--color-border)",
                                                  cursor: "pointer",
                                                  position: "relative"
                                                }}
                                              >
                                                {normalizedUrl.match(/\.mp4($|\?)/i) ? (
                                                  <video src={normalizedUrl} controls playsInline style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                                ) : (
                                                  <img src={normalizedUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                )}
                                                <div style={{
                                                  position: "absolute",
                                                  bottom: "0.375rem",
                                                  left: "0.375rem",
                                                  padding: "0.25rem 0.5rem",
                                                  background: "rgba(0,0,0,0.7)",
                                                  backdropFilter: "blur(10px)",
                                                  borderRadius: "4px",
                                                  fontSize: "0.625rem",
                                                  color: "white",
                                                  fontWeight: "700"
                                                }}>
                                                  {normalizedUrl.match(/\.mp4($|\?)/i) ? "🎥 Video" : "🖼️ Image"}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {/* Statistiques multi-plateformes si PUBLISHED */}
                                    {post.multiPlatformStats && post.multiPlatformStats.length > 0 && (
                                      <div style={{ marginBottom: "1rem" }}>
                                        <div style={{ 
                                          fontSize: "0.6875rem", 
                                          color: "var(--color-text-tertiary)", 
                                          fontWeight: "700", 
                                          textTransform: "uppercase",
                                          marginBottom: "0.75rem"
                                        }}>
                                          📊 Statistiques multi-plateformes
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                          {post.multiPlatformStats.slice(0, 2).map((stat, idx) => (
                                            <div
                                              key={idx}
                                              style={{
                                                padding: "0.75rem",
                                                background: "var(--color-gray-50)",
                                                borderRadius: "6px",
                                                border: "1px solid var(--color-border)"
                                              }}
                                            >
                                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                                <div style={{ 
                                                  fontSize: "0.8125rem", 
                                                  fontWeight: "700",
                                                  textTransform: "capitalize"
                                                }}>
                                                  {stat.platform}
                                                </div>
                                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                                  {stat.sentiment && (
                                                    <span style={{
                                                      fontSize: "0.625rem",
                                                      background: stat.sentiment === "positive" ? "#dcfce7" : stat.sentiment === "negative" ? "#fee2e2" : "#f3f4f6",
                                                      color: stat.sentiment === "positive" ? "#047857" : stat.sentiment === "negative" ? "#b91c1c" : "#374151",
                                                      padding: "0.125rem 0.5rem",
                                                      borderRadius: "4px",
                                                      fontWeight: "600"
                                                    }}>
                                                      {stat.sentiment === "positive" ? "Positif" : stat.sentiment === "negative" ? "Négatif" : "Neutre"}
                                                    </span>
                                                  )}
                                                  {stat.sponsored && (
                                                    <span style={{
                                                      fontSize: "0.625rem",
                                                      background: "#fef3c7",
                                                      color: "#92400e",
                                                      padding: "0.125rem 0.5rem",
                                                      borderRadius: "4px",
                                                      fontWeight: "600"
                                                    }}>
                                                      Sponsored
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                              {stat.insights && (
                                                <div style={{ 
                                                  display: "flex", 
                                                  gap: "0.5rem",
                                                  flexWrap: "wrap"
                                                }}>
                                                  {stat.insights.views !== undefined && <span style={{ fontSize: "0.75rem" }}>👁️ {stat.insights.views}</span>}
                                                  {stat.insights.likes !== undefined && <span style={{ fontSize: "0.75rem" }}>❤️ {stat.insights.likes}</span>}
                                                  {stat.insights.comments !== undefined && <span style={{ fontSize: "0.75rem" }}>💬 {stat.insights.comments}</span>}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Bouton Voir détails */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setSelectedPublishedPost(post);
                                      }}
                                      className="btn-meta btn-meta-primary"
                                      style={{
                                        width: "100%",
                                        marginTop: "0.75rem",
                                        padding: "var(--spacing-2) var(--spacing-3)",
                                        fontSize: "12px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "var(--spacing-2)"
                                      }}
                                    >
                                      <Eye size={14} />
                                      Voir détails
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    {post.mediaUrls && post.mediaUrls.length > 0 && (
                                      <div style={{ marginBottom: "1rem" }}>
                                        <div style={{ 
                                          fontSize: "0.6875rem", 
                                          color: "var(--color-text-tertiary)", 
                                          fontWeight: "700", 
                                          textTransform: "uppercase",
                                          marginBottom: "0.75rem"
                                        }}>
                                          📷 Media ({post.mediaUrls.length})
                                        </div>
                                        <div style={{ 
                                          display: "grid", 
                                          gridTemplateColumns: post.mediaUrls.length === 1 ? "1fr" : "repeat(2, minmax(140px, 1fr))", 
                                          gap: "0.75rem",
                                          marginBottom: "1rem"
                                        }}>
                                          {post.mediaUrls.map((url, idx) => {
                                            const normalizedUrl = getMediaUrlForContext(url, "calendar");
                                            return (
                                              <div 
                                                key={idx}
                                                onClick={() => window.open(normalizedUrl, '_blank')}
                                                style={{
                                                  aspectRatio: "1",
                                                  borderRadius: "6px",
                                                  overflow: "hidden",
                                                  border: "2px solid var(--color-border)",
                                              cursor: "pointer",
                                              position: "relative"
                                            }}
                                          >
                                            {normalizedUrl.match(/\.mp4($|\?)/i) ? (
                                              <video src={normalizedUrl} controls playsInline style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                            ) : (
                                              <img src={normalizedUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            )}
                                            <div style={{
                                              position: "absolute",
                                              bottom: "0.375rem",
                                              left: "0.375rem",
                                              padding: "0.25rem 0.5rem",
                                              background: "rgba(0,0,0,0.7)",
                                              backdropFilter: "blur(10px)",
                                              borderRadius: "4px",
                                              fontSize: "0.625rem",
                                              color: "white",
                                              fontWeight: "700"
                                            }}>
                                              {normalizedUrl.match(/\.mp4($|\?)/i) ? "🎥 Video" : "🖼️ Image"}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {getDisplayCaptionPost(post, language) && (
                                  <div style={{ marginBottom: "1rem" }}>
                                    <div style={{ 
                                      fontSize: "0.6875rem", 
                                          color: "var(--color-text-tertiary)", 
                                      fontWeight: "700", 
                                      textTransform: "uppercase",
                                      marginBottom: "0.5rem"
                                    }}>
                                      ✍️ Caption
                                    </div>
                                    <p style={{ fontSize: "0.8125rem", color: "#334155", lineHeight: 1.6 }}>
                                      {getDisplayCaptionPost(post, language)}
                                    </p>
                                  </div>
                                )}

                                {post.hashtags && (
                                  <div style={{ marginBottom: "1rem" }}>
                                    <div style={{ 
                                      fontSize: "0.6875rem", 
                                          color: "var(--color-text-tertiary)", 
                                      fontWeight: "700", 
                                      textTransform: "uppercase",
                                      marginBottom: "0.5rem"
                                    }}>
                                      # Hashtags
                                    </div>
                                    <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                                      {post.hashtags.split(/\s+/).map((tag, idx) => (
                                        <span key={idx} style={{
                                          padding: "0.25rem 0.5rem",
                                          background: "#eef2ff",
                                          color: "#4f46e5",
                                          borderRadius: "999px",
                                          fontSize: "0.6875rem",
                                          fontWeight: "600"
                                        }}>
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {post.sentiment && (
                                  <div style={{ marginBottom: "1rem" }}>
                                    <div style={{ 
                                      fontSize: "0.6875rem", 
                                          color: "var(--color-text-tertiary)", 
                                      fontWeight: "700", 
                                      textTransform: "uppercase",
                                      marginBottom: "0.5rem"
                                    }}>
                                      😊 Sentiment
                                    </div>
                                    <span style={{
                                      padding: "0.25rem 0.5rem",
                                      background: post.sentiment === 'positive' ? "#dcfce7" : post.sentiment === 'negative' ? "#fee2e2" : "#e0f2fe",
                                      color: post.sentiment === 'positive' ? "#15803d" : post.sentiment === 'negative' ? "#b91c1c" : "#0284c7",
                                      borderRadius: "4px",
                                      fontSize: "0.75rem",
                                      fontWeight: "600"
                                    }}>
                                      {post.sentiment}
                                    </span>
                                  </div>
                                )}

                                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setSelectedPublishedPost(post);
                                    }}
                                    className="btn-meta btn-meta-primary"
                                    style={{
                                      padding: "0.4rem 0.75rem",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.4rem",
                                      fontSize: "0.75rem",
                                      fontWeight: "600"
                                    }}
                                  >
                                    <Eye size={14} />
                                    Voir détails
                                  </button>
                                  <Link href={`/posts/${post._id}/edit`}>
                                    <button 
                                      style={{
                                        padding: "0.4rem 0.75rem",
                                        background: "#f3f4f6",
                                        border: "none",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.4rem",
                                        fontSize: "0.75rem",
                                        fontWeight: "600"
                                      }}
                                    >
                                      <Edit size={14} />
                                      {t('common.edit')}
                                    </button>
                                  </Link>
                                  <button 
                                    onClick={() => {
                                      if (confirm(t('calendar.deleteConfirm'))) {
                                        handleDelete(post._id);
                                      }
                                    }}
                                    style={{
                                      padding: "0.4rem 0.75rem",
                                      background: "#fee2e2",
                                      color: "#b91c1c",
                                      border: "none",
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.4rem",
                                      fontSize: "0.75rem",
                                      fontWeight: "600"
                                    }}
                                  >
                                    <Trash2 size={14} />
                                    {t('common.delete')}
                                  </button>
                                </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                )}
                </div>
              </div>
          )}
        </div>

      {/* Overlay Détails Post (Voir détails) */}
      {selectedPublishedPost && (
        <div
          className="calendar-detail-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPublishedPost(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="calendar-detail-title"
        >
          <div
            className="card-meta calendar-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="calendar-detail-modal-header">
              <div style={{ flex: 1 }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--spacing-3)",
                  marginBottom: "var(--spacing-2)"
                }}>
                  {(() => {
                    const statusInfo = statusConfig[selectedPublishedPost.status] || statusConfig.PUBLISHED;
                    return (
                      <span style={{
                        padding: "4px 12px",
                        background: statusInfo.color,
                        color: "white",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "var(--font-weight-bold)",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}>
                        {selectedPublishedPost.status === 'PUBLISHED' ? '✓ ' : ''}{statusInfo.label}
                      </span>
                    );
                  })()}
                  {(selectedPublishedPost.networks || [selectedPublishedPost.network]).map((network, idx) => {
                    const NetworkIcon = networkIcons[network];
                    return (
                      <span
                        key={idx}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          padding: "0.25rem 0.5rem",
                          background: `${networkColors[network]}15`,
                          color: networkColors[network],
                          borderRadius: "4px",
                          fontSize: "0.6875rem",
                          fontWeight: "600"
                        }}
                      >
                        <NetworkIcon size={11} strokeWidth={2} />
                        {network}
                      </span>
                    );
                  })}
                </div>
                <h2 id="calendar-detail-title" style={{
                  fontSize: "var(--font-size-2xl)",
                  fontWeight: "var(--font-weight-bold)",
                  margin: "var(--spacing-2) 0 0 0",
                  color: "var(--color-text-primary)"
                }}>
                  {getProjectNames(selectedPublishedPost).join(' • ')}
                </h2>
                <p style={{
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-text-secondary)",
                  margin: "var(--spacing-1) 0 0 0"
                }}>
                  {new Date(selectedPublishedPost.scheduledAt).toLocaleString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <button
                type="button"
                className="calendar-detail-modal-close"
                onClick={() => setSelectedPublishedPost(null)}
                aria-label={t('common.close')}
              >
                <XIcon size={20} />
              </button>
            </div>

            {/* Contenu du modal */}
            <div className="calendar-detail-modal-body">
              {/* Caption */}
              {getDisplayCaptionPost(selectedPublishedPost, language) && (
                <div className="card-meta" style={{ marginBottom: "var(--spacing-6)" }}>
                  <div style={{
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-text-tertiary)",
                    fontWeight: "var(--font-weight-bold)",
                    textTransform: "uppercase",
                    letterSpacing: "var(--letter-spacing-wide)",
                    marginBottom: "var(--spacing-3)"
                  }}>
                    📝 Légende
                  </div>
                  <p style={{
                    fontSize: "var(--font-size-base)",
                    color: "var(--color-text-primary)",
                    lineHeight: "var(--line-height-relaxed)",
                    margin: 0,
                    whiteSpace: "pre-wrap"
                  }}>
                    {getDisplayCaptionPost(selectedPublishedPost, language)}
                  </p>
                </div>
              )}

              {/* Media */}
              {selectedPublishedPost.mediaUrls && selectedPublishedPost.mediaUrls.length > 0 && (
                <div className="card-meta" style={{ marginBottom: "var(--spacing-6)" }}>
                  <div style={{
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-text-tertiary)",
                    fontWeight: "var(--font-weight-bold)",
                    textTransform: "uppercase",
                    letterSpacing: "var(--letter-spacing-wide)",
                    marginBottom: "var(--spacing-3)"
                  }}>
                    📷 Media ({selectedPublishedPost.mediaUrls.length})
                  </div>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                    gap: "var(--spacing-4)"
                  }}>
                    {selectedPublishedPost.mediaUrls.map((url, idx) => {
                      const normalizedUrl = getMediaUrlForContext(url, "calendar");
                      return (
                        <div
                          key={idx}
                          onClick={() => window.open(normalizedUrl, '_blank')}
                          style={{
                            aspectRatio: "1",
                            borderRadius: "var(--border-radius-base)",
                            overflow: "hidden",
                            border: "2px solid var(--color-border)",
                            cursor: "pointer",
                            position: "relative",
                            transition: "all var(--transition-fast)"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.05)";
                            e.currentTarget.style.boxShadow = "var(--shadow-md)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          {normalizedUrl.match(/\.mp4($|\?)/i) ? (
                            <video src={normalizedUrl} controls playsInline style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                          ) : (
                            <img src={normalizedUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          )}
                          <div style={{
                            position: "absolute",
                            bottom: "0.375rem",
                            left: "0.375rem",
                            padding: "0.25rem 0.5rem",
                            background: "rgba(0,0,0,0.7)",
                            backdropFilter: "blur(10px)",
                            borderRadius: "4px",
                            fontSize: "0.625rem",
                            color: "white",
                            fontWeight: "700"
                          }}>
                            {normalizedUrl.match(/\.mp4($|\?)/i) ? "🎥" : "🖼️"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Hashtags */}
              {selectedPublishedPost.hashtags && (
                <div className="card-meta" style={{ marginBottom: "var(--spacing-6)" }}>
                  <div style={{
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-text-tertiary)",
                    fontWeight: "var(--font-weight-bold)",
                    textTransform: "uppercase",
                    letterSpacing: "var(--letter-spacing-wide)",
                    marginBottom: "var(--spacing-3)"
                  }}>
                    # {t('common.hashtags')}
                  </div>
                  <p style={{
                    fontSize: "var(--font-size-base)",
                    color: "var(--color-primary)",
                    lineHeight: "var(--line-height-relaxed)",
                    margin: 0,
                    whiteSpace: "pre-wrap"
                  }}>
                    {selectedPublishedPost.hashtags}
                  </p>
                </div>
              )}

              {/* Statistiques multi-plateformes */}
              {selectedPublishedPost.multiPlatformStats && selectedPublishedPost.multiPlatformStats.length > 0 && (
                <div>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--spacing-3)",
                    marginBottom: "var(--spacing-5)",
                    paddingBottom: "var(--spacing-4)",
                    borderBottom: "2px solid var(--color-border)"
                  }}>
                    <div style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "var(--border-radius-lg)",
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "var(--font-size-xl)",
                      boxShadow: "var(--shadow-md)"
                    }}>
                      📊
                    </div>
                    <div>
                      <h3 style={{
                        fontSize: "var(--font-size-2xl)",
                        fontWeight: "var(--font-weight-bold)",
                        margin: 0,
                        color: "var(--color-text-primary)"
                      }}>
                        Statistiques
                      </h3>
                      <p style={{
                        fontSize: "var(--font-size-sm)",
                        color: "var(--color-text-secondary)",
                        margin: "var(--spacing-1) 0 0 0"
                      }}>
                        {selectedPublishedPost.multiPlatformStats.length} plateforme(s)
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-4)" }}>
                    {selectedPublishedPost.multiPlatformStats.map((stat, idx) => (
                      <div
                        key={idx}
                        className="card-meta"
                        style={{
                          padding: "var(--spacing-4)",
                          borderLeft: "3px solid var(--color-success)",
                          background: "var(--color-white)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "var(--border-radius-base)"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-3)" }}>
                          <div style={{
                            fontSize: "var(--font-size-base)",
                            fontWeight: "var(--font-weight-bold)",
                            textTransform: "capitalize"
                          }}>
                            {stat.platform}
                          </div>
                          <div style={{ display: "flex", gap: "var(--spacing-2)" }}>
                            {stat.sentiment && (
                              <span style={{
                                fontSize: "0.625rem",
                                background: stat.sentiment === "positive" ? "#dcfce7" : stat.sentiment === "negative" ? "#fee2e2" : "#f3f4f6",
                                color: stat.sentiment === "positive" ? "#047857" : stat.sentiment === "negative" ? "#b91c1c" : "#374151",
                                padding: "0.125rem 0.5rem",
                                borderRadius: "4px",
                                fontWeight: "600"
                              }}>
                                {stat.sentiment === "positive" ? "Positif" : stat.sentiment === "negative" ? "Négatif" : "Neutre"}
                              </span>
                            )}
                            {stat.sponsored && (
                              <span style={{
                                fontSize: "0.625rem",
                                background: "#fef3c7",
                                color: "#92400e",
                                padding: "0.125rem 0.5rem",
                                borderRadius: "4px",
                                fontWeight: "600"
                              }}>
                                Sponsored
                              </span>
                            )}
                          </div>
                        </div>

                        {stat.postUrl && (
                          <div style={{ marginBottom: "var(--spacing-3)" }}>
                            <a
                              href={stat.postUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "var(--spacing-2)",
                                padding: "var(--spacing-3) var(--spacing-4)",
                                background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
                                color: "white",
                                borderRadius: "var(--border-radius-base)",
                                textDecoration: "none",
                                fontSize: "13px",
                                fontWeight: "var(--font-weight-semibold)",
                                transition: "all var(--transition-fast)",
                                boxShadow: "var(--shadow-sm)"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)";
                                e.currentTarget.style.transform = "translateY(-2px)";
                                e.currentTarget.style.boxShadow = "var(--shadow-md)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)";
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                              }}
                            >
                              <div style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "6px",
                                background: "rgba(255, 255, 255, 0.2)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "16px"
                              }}>
                                {stat.platform === "instagram" ? "📷" :
                                 stat.platform === "facebook" ? "📘" :
                                 stat.platform === "tiktok" ? "🎵" :
                                 stat.platform === "youtube" ? "▶️" :
                                 stat.platform === "x" ? "🐦" :
                                 stat.platform === "linkedin" ? "💼" : "📱"}
                              </div>
                              <span style={{ flex: 1 }}>
                                {stat.platform.charAt(0).toUpperCase() + stat.platform.slice(1)}
                              </span>
                              <ExternalLink size={16} strokeWidth={2.5} />
                            </a>
                          </div>
                        )}

                        {stat.insights && (
                          <div style={{
                            display: "flex",
                            gap: "var(--spacing-2)",
                            flexWrap: "nowrap",
                            overflowX: "auto",
                            paddingBottom: "var(--spacing-2)"
                          }}>
                            {stat.insights.views !== undefined && (
                              <div className="card-meta" style={{
                                padding: "var(--spacing-2) var(--spacing-3)",
                                minWidth: "80px",
                                textAlign: "center",
                                background: "var(--color-gray-50)",
                                border: "1px solid var(--color-border)",
                                transition: "all var(--transition-fast)"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-2px)";
                                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "none";
                              }}
                              >
                                <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "4px" }}>VUES</div>
                                <div style={{ fontSize: "16px", fontWeight: "700" }}>{formatNumber(stat.insights.views)}</div>
                              </div>
                            )}
                            {stat.insights.saves !== undefined && (
                              <div className="card-meta" style={{
                                padding: "var(--spacing-2) var(--spacing-3)",
                                minWidth: "80px",
                                textAlign: "center",
                                background: "var(--color-gray-50)",
                                border: "1px solid var(--color-border)",
                                transition: "all var(--transition-fast)"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-2px)";
                                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "none";
                              }}
                              >
                                <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "4px" }}>ENREG.</div>
                                <div style={{ fontSize: "16px", fontWeight: "700" }}>{formatNumber(stat.insights.saves)}</div>
                              </div>
                            )}
                            {stat.insights.likes !== undefined && (
                              <div className="card-meta" style={{
                                padding: "var(--spacing-2) var(--spacing-3)",
                                minWidth: "80px",
                                textAlign: "center",
                                background: "var(--color-gray-50)",
                                border: "1px solid var(--color-border)",
                                transition: "all var(--transition-fast)"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-2px)";
                                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "none";
                              }}
                              >
                                <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "4px" }}>LIKES</div>
                                <div style={{ fontSize: "16px", fontWeight: "700" }}>{formatNumber(stat.insights.likes)}</div>
                              </div>
                            )}
                            {stat.insights.comments !== undefined && (
                              <div className="card-meta" style={{
                                padding: "var(--spacing-2) var(--spacing-3)",
                                minWidth: "80px",
                                textAlign: "center",
                                background: "var(--color-gray-50)",
                                border: "1px solid var(--color-border)",
                                transition: "all var(--transition-fast)"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-2px)";
                                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "none";
                              }}
                              >
                                <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "4px" }}>COMM.</div>
                                <div style={{ fontSize: "16px", fontWeight: "700" }}>{formatNumber(stat.insights.comments)}</div>
                              </div>
                            )}
                            {stat.insights.shares !== undefined && (
                              <div className="card-meta" style={{
                                padding: "var(--spacing-2) var(--spacing-3)",
                                minWidth: "80px",
                                textAlign: "center",
                                background: "var(--color-gray-50)",
                                border: "1px solid var(--color-border)",
                                transition: "all var(--transition-fast)"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-2px)";
                                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "none";
                              }}
                              >
                                <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "4px" }}>PART.</div>
                                <div style={{ fontSize: "16px", fontWeight: "700" }}>{formatNumber(stat.insights.shares)}</div>
                              </div>
                            )}
                            {stat.insights.engagement_rate !== undefined && (
                              <div className="card-meta" style={{
                                padding: "var(--spacing-2) var(--spacing-3)",
                                minWidth: "80px",
                                textAlign: "center",
                                background: "var(--color-gray-50)",
                                border: "1px solid var(--color-border)",
                                transition: "all var(--transition-fast)"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-2px)";
                                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "none";
                              }}
                              >
                                <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "4px" }}>RER%</div>
                                <div style={{ fontSize: "16px", fontWeight: "700" }}>{stat.insights.engagement_rate.toFixed(2)}%</div>
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
          </div>
        </div>
      )}
    </div>
    </div>
      </div>
  );
}
