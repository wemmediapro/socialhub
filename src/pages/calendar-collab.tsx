import { useEffect, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, X as XIcon, ExternalLink } from "lucide-react";
import { useTranslation } from "@/i18n/TranslationContext";
import { useAuth } from "@/contexts/AuthContext";
import { getDisplayDescriptionCollab, useTranslateCollabDescriptionsWhenIt } from "@/lib/i18n-content";
import Breadcrumbs from "@/components/Breadcrumbs";
import { VideoPreviewCard } from "@/components/VideoPreviewCard";

type ContentUpload = {
  uploadedBy: string;
  role: string;
  urls: string[];
  description: string;
  uploadedAt: string;
  validatedByClient?: boolean;
  publishedAt?: string;
  scheduledAt?: string;
  platform?: string;
  sentiment?: string;
  postUrl?: string; // Rétrocompatibilité
  insights?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
    engagement_rate?: number;
  };
  statistics?: Array<{
    platform: string;
    publishedAt?: string;
    postUrl?: string;
    sentiment?: string;
    insights?: {
      views?: number;
      likes?: number;
      comments?: number;
      shares?: number;
      saves?: number;
      engagement_rate?: number;
    };
  }>;
  platformStats?: Array<{
    platform: string;
    sentiment?: "positive" | "neutral" | "negative";
    publishedAt?: string;
    postUrl?: string;
    insights?: {
      views?: number;
      likes?: number;
      comments?: number;
      shares?: number;
      saves?: number;
      engagement_rate?: number;
    };
  }>;
};

type Collaboration = {
  _id: string;
  influencerId: string;
  projectId: string;
  projectIds?: string[];
  description: string;
  descriptionIt?: string;
  budget: number;
  startDate: string;
  endDate: string;
  status: string;
  scheduledAt?: string; // Date de planification de la collaboration
  contentUploads?: ContentUpload[];
};

type DayEntry = {
  collab: Collaboration;
  kind: "COLLAB_DRAFT" | "COLLAB_PENDING_GRAPHIC" | "COLLAB_REVIEW" | "COLLAB_PENDING_CORRECTION" | "COLLAB_SCHEDULED" | "COLLAB_PUBLISHED";
};

export default function CalendarCollabPage() {
  const { t, language } = useTranslation();
  const { canSeeBudgetAndTarifs } = useAuth();
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  useTranslateCollabDescriptionsWhenIt(language, collaborations, setCollaborations);
  const [projects, setProjects] = useState<any[]>([]);
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [projectFilter, setProjectFilter] = useState("all");
  const [selectedEntry, setSelectedEntry] = useState<DayEntry | null>(null);
  const [calendarView, setCalendarView] = useState<"month" | "year">("month");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [collabData, projectsData, influencersData] = await Promise.all([
        fetch('/api/collaborations').then(r => r.json()),
        fetch('/api/projects').then(r => r.json()),
        fetch('/api/influencers').then(r => r.json())
      ]);
      
      setCollaborations(collabData.collaborations || []);
      setProjects(projectsData.projects || []);
      setInfluencers(influencersData.influencers || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p._id === projectId);
    return project?.name || projectId;
  };

  const getProjectNames = (collab: Collaboration) => {
    const projectIdsToCheck = (collab.projectIds && collab.projectIds.length > 0) 
      ? collab.projectIds 
      : [collab.projectId];
    return projectIdsToCheck.map(id => getProjectName(id));
  };

  const getInfluencerName = (influencerId: string) => {
    const influencer = influencers.find(i => i._id === influencerId);
    return influencer?.name || t('calendarCollab.unknown');
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

  const getContentsForDay = (day: number): DayEntry[] => {
    const { year, month } = getDaysInMonth(currentDate);
    return getContentsForDate(year, month, day);
  };

  /** Contenus pour une date quelconque (année, mois, jour). */
  const getContentsForDate = (y: number, m: number, day: number): DayEntry[] => {
    const currentDay = new Date(y, m, day);
    const contents: DayEntry[] = [];
    const toDateStr = (d: Date) => d.toDateString();

    collaborations.forEach(collab => {
      if (projectFilter !== "all") {
        const projectIdsToCheck = (collab.projectIds && collab.projectIds.length > 0)
          ? collab.projectIds
          : [collab.projectId];
        if (!projectIdsToCheck.includes(projectFilter)) return;
      }

      const getRefDate = () => {
        const ref = collab.scheduledAt || collab.startDate || collab.endDate;
        return ref ? new Date(ref) : null;
      };

      const refDate = getRefDate();
      if (!refDate || isNaN(refDate.getTime())) return;
      if (toDateStr(refDate) !== currentDay.toDateString()) return;

      if (collab.status === 'DRAFT') {
        contents.push({ collab, kind: "COLLAB_DRAFT" });
        return;
      }
      if (collab.status === 'PENDING_GRAPHIC') {
        contents.push({ collab, kind: "COLLAB_PENDING_GRAPHIC" });
        return;
      }
      if (collab.status === 'CLIENT_REVIEW') {
        contents.push({ collab, kind: "COLLAB_REVIEW" });
        return;
      }
      if (collab.status === 'PENDING_CORRECTION') {
        contents.push({ collab, kind: "COLLAB_PENDING_CORRECTION" });
        return;
      }
      if (collab.status === 'SCHEDULED') {
        contents.push({ collab, kind: "COLLAB_SCHEDULED" });
        return;
      }
      if (collab.status === 'PUBLISHED') {
        contents.push({ collab, kind: "COLLAB_PUBLISHED" });
      }
    });
    return contents;
  };

  /** Nombre total de collaborations (tous statuts affichés) pour un mois donné, avec filtre projet. */
  const getCountForMonth = (y: number, m: number): number => {
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    const displayedStatuses = ['DRAFT', 'PENDING_GRAPHIC', 'CLIENT_REVIEW', 'PENDING_CORRECTION', 'SCHEDULED', 'PUBLISHED'];
    let count = 0;
    collaborations.forEach(collab => {
      if (projectFilter !== "all") {
        const projectIdsToCheck = (collab.projectIds && collab.projectIds.length > 0)
          ? collab.projectIds
          : [collab.projectId];
        if (!projectIdsToCheck.includes(projectFilter)) return;
      }
      if (!displayedStatuses.includes(collab.status)) return;
      const ref = collab.scheduledAt || collab.startDate || collab.endDate;
      if (!ref) return;
      const d = new Date(ref);
      if (d >= firstDay && d <= lastDay) count += 1;
    });
    return count;
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

  // Get statistics (tous statuts affichés au calendrier)
  const displayedStatuses = ['DRAFT', 'PENDING_GRAPHIC', 'CLIENT_REVIEW', 'PENDING_CORRECTION', 'SCHEDULED', 'PUBLISHED'];
  const totalCollaborations = collaborations.filter(c => {
    if (projectFilter !== "all") {
      const projectIdsToCheck = (c.projectIds && c.projectIds.length > 0)
        ? c.projectIds
        : [c.projectId];
      if (!projectIdsToCheck.includes(projectFilter)) return false;
    }
    return displayedStatuses.includes(c.status);
  }).length;

  const scheduledCollaborations = collaborations.filter(c => {
    if (projectFilter !== "all") {
      const projectIdsToCheck = (c.projectIds && c.projectIds.length > 0)
        ? c.projectIds
        : [c.projectId];
      if (!projectIdsToCheck.includes(projectFilter)) return false;
    }
    return c.status === 'SCHEDULED';
  }).length;
  const publishedCollaborations = collaborations.filter(c => {
    if (projectFilter !== "all") {
      const projectIdsToCheck = (c.projectIds && c.projectIds.length > 0)
        ? c.projectIds
        : [c.projectId];
      if (!projectIdsToCheck.includes(projectFilter)) return false;
    }
    return c.status === 'PUBLISHED';
  }).length;

  const formatNumber = (num: number) => {
    if (!num) return "0";
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
    return num.toString();
  };

  const metricKeys: Array<keyof NonNullable<ContentUpload["insights"]>> = [
    "views",
    "likes",
    "comments",
    "shares",
    "saves",
    "engagement_rate"
  ];

  const getMetricLabel = (key: keyof NonNullable<ContentUpload["insights"]>) => {
    switch (key) {
      case "views":
        return t('collab.statsLabels.views');
      case "likes":
        return t('collab.statsLabels.likes');
      case "comments":
        return t('collab.statsLabels.comments');
      case "shares":
        return t('collab.statsLabels.shares');
      case "saves":
        return t('collab.statsLabels.saves');
      case "engagement_rate":
        return t('collab.statsLabels.engagementRate');
      default:
        return key;
    }
  };

  const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|ogg|ogv|m3u8)(\?|$)/i;
  const getVideoUrlsFromCollab = (collab: Collaboration): string[] => {
    const urls: string[] = [];
    (collab.contentUploads || []).forEach((upload) => {
      (upload.urls || []).forEach((url) => {
        if (VIDEO_EXTENSIONS.test(url) || url.includes('video') || url.includes('reel')) {
          urls.push(url);
        }
      });
    });
    return urls;
  };

  // Créer une liste des uploads publiés incluant les platformStats
  const selectedEntryPublishedUploads = selectedEntry?.kind === "COLLAB_PUBLISHED"
    ? (() => {
        const uploads: Array<ContentUpload & { isFromPlatformStats?: boolean; originalUploadIndex?: number }> = [];
        const contentUploads = selectedEntry.collab.contentUploads || [];
        
        contentUploads.forEach((upload, uploadIndex) => {
          // Ajouter l'upload s'il a un publishedAt
          if (upload.publishedAt) {
            uploads.push(upload);
          }
          
          // Ajouter aussi les platformStats comme des entrées séparées
          if (upload.platformStats && Array.isArray(upload.platformStats) && upload.platformStats.length > 0) {
            upload.platformStats.forEach((platformStat: any) => {
              if (platformStat.platform || platformStat.insights) {
                // Créer une entrée virtuelle depuis platformStats
                uploads.push({
                  ...upload,
                  platform: platformStat.platform || upload.platform,
                  publishedAt: platformStat.publishedAt || upload.publishedAt,
                  postUrl: platformStat.postUrl || upload.postUrl,
                  sentiment: platformStat.sentiment || upload.sentiment,
                  insights: platformStat.insights || upload.insights,
                  isFromPlatformStats: true,
                  originalUploadIndex: uploadIndex
                } as any);
              }
            });
          }
        });
        
        return uploads;
      })()
    : [];

  const aggregatedStats = metricKeys.reduce<(Record<string, number>)>((acc, key) => {
    acc[key] = selectedEntryPublishedUploads.reduce((sum, upload) => sum + (upload.insights?.[key] || 0), 0);
    return acc;
  }, {});

  const hasAggregatedStats = selectedEntryPublishedUploads.length > 0 && Object.values(aggregatedStats).some(value => value > 0);

  const statusConfigCollab: Record<string, { label: string; color: string }> = {
    COLLAB_DRAFT: { label: t('workflow.statuses.draft') || 'Brouillon', color: "#94a3b8" },
    COLLAB_PENDING_GRAPHIC: { label: t('workflow.statuses.creation') || 'Création', color: "#8b5cf6" },
    COLLAB_REVIEW: { label: t('workflow.statuses.revision') || 'Révision', color: "#f59e0b" },
    COLLAB_PENDING_CORRECTION: { label: t('workflow.statuses.corrections') || 'Corrections', color: "#f97316" },
    COLLAB_SCHEDULED: { label: t('calendarCollab.scheduledCollab'), color: "#0284c7" },
    COLLAB_PUBLISHED: { label: t('calendarCollab.publishedCollab'), color: "#059669" }
  };

  return (
    <div className="page-container">
      <div className="page-content dash">
        <div className="page-hero">
          <div className="page-hero-inner">
            <div className="page-hero-text">
              <div className="page-hero-breadcrumbs">
                <Breadcrumbs items={[
                  { label: t('menu.dashboard'), href: '/' },
                  { label: t('calendarCollab.title') }
                ]} />
              </div>
              <h1 className="page-hero-title">{t('calendarCollab.title')}</h1>
              <p className="page-hero-subtitle">
                {totalCollaborations} {t('calendarCollab.totalCollaborations')}
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
                <option value="all">{t('calendarCollab.allProjects')}</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>{project.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="calendar-layout calendar-layout-full">
            <div className="calendar-card">
              <div className="calendar-nav">
                <div className="calendar-nav-left">
                  <div className="calendar-view-tabs" role="tablist">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={calendarView === "month"}
                      className={`calendar-view-tab ${calendarView === "month" ? "is-active" : ""}`}
                      onClick={() => setCalendarView("month")}
                    >
                      {t("calendar.viewMonth")}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={calendarView === "year"}
                      className={`calendar-view-tab ${calendarView === "year" ? "is-active" : ""}`}
                      onClick={() => setCalendarView("year")}
                    >
                      {t("calendar.viewYear")}
                    </button>
                  </div>
                  <h2 className="calendar-month-title">
                    {calendarView === "month"
                      ? `${monthNames[month]} ${year}`
                      : String(year)}
                  </h2>
                </div>
                <div className="calendar-nav-btns">
                  {calendarView === "month" ? (
                    <>
                      <button type="button" onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="calendar-nav-btn" aria-label={t("calendar.prevMonth")}>
                        <ChevronLeft size={20} />
                      </button>
                      <button type="button" onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="calendar-nav-btn" aria-label={t("calendar.nextMonth")}>
                        <ChevronRight size={20} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => setCurrentDate(new Date(year - 1, 0, 1))} className="calendar-nav-btn" aria-label={t("calendar.prevYear")}>
                        <ChevronLeft size={20} />
                      </button>
                      <button type="button" onClick={() => setCurrentDate(new Date(year + 1, 0, 1))} className="calendar-nav-btn" aria-label={t("calendar.nextYear")}>
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {calendarView === "year" ? (
                <div className="calendar-year-grid calendar-year-grid-days">
                  {monthNames.map((name, m) => {
                    const firstDay = new Date(year, m, 1);
                    const lastDay = new Date(year, m + 1, 0);
                    const daysInMonth = lastDay.getDate();
                    const startingDayOfWeek = firstDay.getDay();
                    const isCurrentMonth =
                      new Date().getFullYear() === year && new Date().getMonth() === m;
                    return (
                      <div
                        key={m}
                        className={`calendar-year-month-block ${isCurrentMonth ? "is-current-month" : ""}`}
                      >
                        <div className="calendar-year-month-block-title">{name}</div>
                        <div className="calendar-year-mini-weekdays">
                          {dayNames.map(d => (
                            <span key={d} className="calendar-year-mini-weekday">{d.slice(0, 1)}</span>
                          ))}
                        </div>
                        <div className="calendar-year-mini-days">
                          {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                            <span key={`e-${i}`} className="calendar-year-mini-day calendar-year-mini-day-empty" />
                          ))}
                          {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const contents = getContentsForDate(year, m, day);
                            const hasEvents = contents.length > 0;
                            const isToday =
                              new Date().getFullYear() === year &&
                              new Date().getMonth() === m &&
                              new Date().getDate() === day;
                            return (
                              <button
                                key={day}
                                type="button"
                                className={`calendar-year-mini-day ${hasEvents ? "has-events" : ""} ${isToday ? "is-today" : ""}`}
                                onClick={() => {
                                  setCurrentDate(new Date(year, m, day));
                                  setCalendarView("month");
                                  if (contents.length > 0) {
                                    setSelectedDay(new Date(year, m, day));
                                    setSelectedEntry(contents[0]);
                                  } else {
                                    setSelectedDay(null);
                                    setSelectedEntry(null);
                                  }
                                }}
                                title={hasEvents ? `${day} – ${contents.length} collaboration(s)` : String(day)}
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
                  const dayContents = getContentsForDay(day);
                  const hasItems = dayContents.length > 0;
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
                        if (dayContents.length > 0) {
                          setSelectedDay(clickedDate);
                          setSelectedEntry(dayContents[0]);
                        } else {
                          setSelectedDay(selectedDay?.getTime() === clickedDate.getTime() ? null : clickedDate);
                          setSelectedEntry(null);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          const clickedDate = new Date(year, month, day);
                          if (dayContents.length > 0) {
                            setSelectedDay(clickedDate);
                            setSelectedEntry(dayContents[0]);
                          } else {
                            setSelectedDay(selectedDay?.getTime() === clickedDate.getTime() ? null : clickedDate);
                            setSelectedEntry(null);
                          }
                        }
                      }}
                      className={`calendar-day ${isToday ? 'is-today' : ''} ${hasItems ? 'has-events' : ''} ${isSelected ? 'is-selected' : ''}`}
                    >
                      <span className="calendar-day-num">{day}</span>
                      {dayContents.length > 0 && (
                        <div className="calendar-day-bars">
                          {dayContents.slice(0, 3).map((entry, idx) => {
                            const config = statusConfigCollab[entry.kind] || { label: entry.kind, color: "#94a3b8" };
                            return (
                              <div
                                key={`${entry.collab._id}-${entry.kind}-${idx}`}
                                className="calendar-day-bar"
                                style={{ background: config.color }}
                              />
                            );
                          })}
                          {dayContents.length > 3 && (
                            <span className="calendar-day-more">+{dayContents.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="calendar-legend">
                {Object.entries(statusConfigCollab).map(([kind, config]) => (
                  <div key={kind} className="calendar-legend-item">
                    <span className="calendar-legend-dot" style={{ background: config.color }} />
                    <span>{config.label}</span>
                  </div>
                ))}
              </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {selectedEntry && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-collab-title"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--spacing-4)",
            zIndex: 1000,
            animation: "fadeIn 0.25s ease-out"
          }}
          onClick={() => setSelectedEntry(null)}
        >
          <div
            className="card-meta"
            style={{
              width: "100%",
              maxWidth: "960px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 0,
              position: "relative",
              background: "var(--color-white)",
              boxShadow: "0 24px 48px rgba(0,0,0,0.12), 0 12px 24px rgba(0,0,0,0.08)",
              borderRadius: "16px",
              border: "1px solid var(--color-border)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header moderne */}
            {(() => {
              const entriesForDay = selectedDay ? getContentsForDay(selectedDay.getDate()) : [];
              const currentIndex = entriesForDay.findIndex(
                e => e.collab._id === selectedEntry.collab._id && e.kind === selectedEntry.kind
              );
              const hasMultiple = entriesForDay.length > 1;
              const goPrev = () => {
                if (currentIndex > 0) setSelectedEntry(entriesForDay[currentIndex - 1]);
              };
              const goNext = () => {
                if (currentIndex < entriesForDay.length - 1) setSelectedEntry(entriesForDay[currentIndex + 1]);
              };
              return (
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "var(--spacing-4)",
              padding: "var(--spacing-6) var(--spacing-6) var(--spacing-5)",
              borderBottom: "1px solid var(--color-border)",
              background: "linear-gradient(180deg, var(--color-gray-50) 0%, var(--color-white) 100%)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-4)", flex: 1, minWidth: 0 }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: (() => {
                    const config = statusConfigCollab[selectedEntry.kind];
                    return config ? `linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%)` : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)";
                  })(),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                  flexShrink: 0,
                  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.25)"
                }}>
                  {selectedEntry.kind === "COLLAB_PUBLISHED" ? "✓" : selectedEntry.kind === "COLLAB_REVIEW" ? "👁" : selectedEntry.kind === "COLLAB_DRAFT" ? "📝" : "📅"}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "var(--color-text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: "2px"
                  }}>
                    {statusConfigCollab[selectedEntry.kind]?.label ?? selectedEntry.kind}
                  </div>
                  <h2
                    id="modal-collab-title"
                    style={{
                      fontSize: "1.375rem",
                      fontWeight: "700",
                      color: "var(--color-text-primary)",
                      margin: 0,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.3
                    }}
                  >
                    {t('calendarCollab.detailsTitle') || 'Détails de la collaboration'}
                  </h2>
                </div>
              </div>
              {hasMultiple && (
                <div className="collab-detail-nav" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginRight: "0.5rem" }}>
                  <button type="button" onClick={goPrev} disabled={currentIndex <= 0} aria-label={t('common.previous')}
                    className="collab-detail-nav-btn">
                    <ChevronLeft size={20} strokeWidth={2.5} />
                  </button>
                  <span className="collab-detail-nav-counter">
                    {currentIndex + 1} / {entriesForDay.length}
                  </span>
                  <button type="button" onClick={goNext} disabled={currentIndex >= entriesForDay.length - 1} aria-label={t('common.next')}
                    className="collab-detail-nav-btn">
                    <ChevronRight size={20} strokeWidth={2.5} />
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                aria-label={t('common.close')}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  border: "none",
                  background: "var(--color-gray-100)",
                  color: "var(--color-text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "background 0.2s, color 0.2s",
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--color-gray-200)";
                  e.currentTarget.style.color = "var(--color-text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--color-gray-100)";
                  e.currentTarget.style.color = "var(--color-text-secondary)";
                }}
              >
                <XIcon size={20} strokeWidth={2} />
              </button>
            </div>
            );
            })()}

            <div style={{ padding: "var(--spacing-6)" }}>
            {/* Grille d’infos – cartes fines */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "var(--spacing-4)",
              marginBottom: "var(--spacing-6)"
            }}>
              <div style={{
                padding: "var(--spacing-4)",
                background: "var(--color-gray-50)",
                borderRadius: "12px",
                border: "1px solid var(--color-border)"
              }}>
                <div style={{
                  fontSize: "10px",
                  fontWeight: "600",
                  color: "var(--color-text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "var(--spacing-2)"
                }}>
                  ⭐ {t('calendarCollab.influencer') || 'Influenceur'}
                </div>
                <div style={{
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: "var(--color-text-primary)"
                }}>
                  {getInfluencerName(selectedEntry.collab.influencerId)}
                </div>
              </div>

              <div style={{
                padding: "var(--spacing-4)",
                background: "var(--color-gray-50)",
                borderRadius: "12px",
                border: "1px solid var(--color-border)"
              }}>
                <div style={{
                  fontSize: "10px",
                  fontWeight: "600",
                  color: "var(--color-text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "var(--spacing-2)"
                }}>
                  💼 {t('calendarCollab.projects') || 'Projets'}
                </div>
                <div style={{
                  fontSize: "var(--font-size-sm)",
                  fontWeight: "500",
                  color: "var(--color-text-primary)",
                  lineHeight: 1.4
                }}>
                  {getProjectNames(selectedEntry.collab).map((name, idx) => (
                    <span key={idx}>
                      {idx > 0 && <span style={{ margin: "0 6px", color: "var(--color-text-tertiary)" }}>•</span>}
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              {canSeeBudgetAndTarifs() && (
              <div style={{
                padding: "var(--spacing-4)",
                background: "var(--color-gray-50)",
                borderRadius: "12px",
                border: "1px solid var(--color-border)"
              }}>
                <div style={{
                  fontSize: "10px",
                  fontWeight: "600",
                  color: "var(--color-text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "var(--spacing-2)"
                }}>
                  💰 {t('collaborations.budget') || 'Budget'}
                </div>
                <div style={{
                  fontSize: "1.25rem",
                  fontWeight: "700",
                  color: "var(--color-primary)"
                }}>
                  {selectedEntry.collab.budget.toLocaleString()}€
                </div>
              </div>
              )}

              <div style={{
                padding: "var(--spacing-4)",
                background: "var(--color-gray-50)",
                borderRadius: "12px",
                border: "1px solid var(--color-border)"
              }}>
                <div style={{
                  fontSize: "10px",
                  fontWeight: "600",
                  color: "var(--color-text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "var(--spacing-2)"
                }}>
                  📅 {t('calendarCollab.dates') || 'Dates'}
                </div>
                <div style={{
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-text-primary)",
                  lineHeight: 1.5
                }}>
                  <div style={{ marginBottom: "2px" }}>
                    <strong>Début:</strong> {new Date(selectedEntry.collab.startDate).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                  <div>
                    <strong>Fin:</strong> {new Date(selectedEntry.collab.endDate).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {getDisplayDescriptionCollab(selectedEntry.collab, language) && (
              <div style={{
                padding: "var(--spacing-4)",
                marginBottom: "var(--spacing-6)",
                background: "var(--color-white)",
                borderRadius: "12px",
                border: "1px solid var(--color-border)"
              }}>
                <div style={{
                  fontSize: "10px",
                  fontWeight: "600",
                  color: "var(--color-text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "var(--spacing-3)"
                }}>
                  📝 {t('calendarCollab.description') || 'Description'}
                </div>
                <p style={{
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-text-primary)",
                  lineHeight: 1.6,
                  margin: 0,
                  whiteSpace: "pre-wrap"
                }}>
                  {getDisplayDescriptionCollab(selectedEntry.collab, language)}
                </p>
              </div>
            )}

            {/* Aperçu vidéo – avec gestion chargement / erreur */}
            {(() => {
              const videoUrls = getVideoUrlsFromCollab(selectedEntry.collab);
              if (videoUrls.length === 0) return null;
              return (
                <div style={{
                  marginBottom: "var(--spacing-6)"
                }}>
                  <div style={{
                    fontSize: "10px",
                    fontWeight: "600",
                    color: "var(--color-text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: "var(--spacing-3)"
                  }}>
                    🎬 {t('calendarCollab.videoPreview') || 'Aperçu vidéo'}
                  </div>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: "var(--spacing-4)"
                  }}>
                    {videoUrls.slice(0, 3).map((url, idx) => (
                      <VideoPreviewCard key={idx} url={url} />
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

            {selectedEntry.kind === "COLLAB_PUBLISHED" && (
              <div style={{ marginBottom: "var(--spacing-6)" }}>
                {/* En-tête Performance */}
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
                      {t('calendarCollab.performance')}
                    </h3>
                    <p style={{
                      fontSize: "var(--font-size-sm)",
                      color: "var(--color-text-secondary)",
                      margin: "var(--spacing-1) 0 0 0"
                    }}>
                      {selectedEntryPublishedUploads.length} {t('calendarCollab.contentPublished')}
                    </p>
                  </div>
                </div>

                {selectedEntryPublishedUploads.length === 0 ? (
                  <div className="card-meta" style={{
                    padding: "var(--spacing-8)",
                    textAlign: "center",
                    background: "var(--color-gray-50)",
                    border: "2px dashed var(--color-border)"
                  }}>
                    <div style={{ fontSize: "var(--font-size-4xl)", marginBottom: "var(--spacing-3)", opacity: 0.3 }}>
                      📊
                    </div>
                    <p style={{
                      fontSize: "var(--font-size-base)",
                      color: "var(--color-text-secondary)",
                      margin: 0
                    }}>
                      {t('calendarCollab.noPublishedContent')}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Résumé global */}
                    {hasAggregatedStats && (
                      <>
                        <div style={{
                          fontSize: "var(--font-size-sm)",
                          fontWeight: "var(--font-weight-semibold)",
                          color: "var(--color-text-secondary)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          marginBottom: "var(--spacing-3)"
                        }}>
                          {t('calendarCollab.summaryTitle')}
                        </div>
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                          gap: "var(--spacing-3)",
                          marginBottom: "var(--spacing-6)",
                          padding: "var(--spacing-4)",
                          background: "linear-gradient(135deg, var(--color-gray-50) 0%, var(--color-white) 100%)",
                          borderRadius: "var(--border-radius-lg)",
                          border: "1px solid var(--color-border)"
                        }}>
                          {metricKeys.map((key) => {
                            const value = aggregatedStats[key];
                            if (!value) return null;
                            const displayValue = key === "engagement_rate" ? `${value.toFixed(2)}%` : formatNumber(value);
                            return (
                              <div
                                key={key}
                                className="card-meta"
                                style={{
                                  padding: "var(--spacing-4)",
                                  textAlign: "center",
                                  background: "var(--color-white)",
                                  border: "1px solid var(--color-border)",
                                  borderRadius: "var(--border-radius-base)",
                                  transition: "all var(--transition-fast)"
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "translateY(-2px)";
                                  e.currentTarget.style.boxShadow = "var(--shadow-md)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "translateY(0)";
                                  e.currentTarget.style.boxShadow = "none";
                                }}
                              >
                                <div style={{
                                  fontSize: "var(--font-size-2xl)",
                                  fontWeight: "var(--font-weight-bold)",
                                  color: "var(--color-primary)",
                                  marginBottom: "var(--spacing-1)",
                                  lineHeight: 1
                                }}>
                                  {displayValue}
                                </div>
                                <div style={{
                                  fontSize: "var(--font-size-xs)",
                                  color: "var(--color-text-secondary)",
                                  fontWeight: "var(--font-weight-semibold)",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.03em",
                                  lineHeight: 1.2
                                }}>
                                  {getMetricLabel(key)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {/* Détail par plateforme */}
                    <div style={{
                      fontSize: "var(--font-size-sm)",
                      fontWeight: "var(--font-weight-semibold)",
                      color: "var(--color-text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: "var(--spacing-3)"
                    }}>
                      {t('calendarCollab.perPublicationTitle')}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-3)" }}>
                      {selectedEntryPublishedUploads.map((upload, index) => (
                        <div 
                          key={index} 
                          className="card-meta" 
                          style={{ 
                            padding: "var(--spacing-4)", 
                            borderLeft: "3px solid var(--color-success)",
                            background: "var(--color-white)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--border-radius-base)",
                            transition: "all var(--transition-fast)"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = "var(--shadow-md)";
                            e.currentTarget.style.transform = "translateX(2px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = "none";
                            e.currentTarget.style.transform = "translateX(0)";
                          }}
                        >
                          {/* Header avec badge, date et plateforme */}
                          <div style={{ 
                            display: "flex", 
                            justifyContent: "space-between", 
                            alignItems: "center",
                            gap: "var(--spacing-2)",
                            marginBottom: "var(--spacing-3)",
                            paddingBottom: "var(--spacing-2)",
                            borderBottom: "1px solid var(--color-border)"
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ 
                                display: "flex",
                                alignItems: "center",
                                gap: "var(--spacing-2)",
                                marginBottom: "var(--spacing-1)",
                                flexWrap: "wrap"
                              }}>
                                <span style={{
                                  padding: "2px 8px",
                                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                  color: "white",
                                  borderRadius: "4px",
                                  fontSize: "10px",
                                  fontWeight: "var(--font-weight-bold)",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px"
                                }}>
                                  ✓ {t('calendarCollab.publishedBadge') || 'Publié'}
                                </span>
                            {upload.platform && (
                              <span style={{
                                    padding: "2px 8px",
                                    background: "var(--color-gray-100)",
                                    borderRadius: "4px",
                                    fontSize: "10px",
                                    fontWeight: "var(--font-weight-semibold)",
                                    textTransform: "capitalize",
                                    color: "var(--color-text-primary)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px"
                                  }}>
                                    {upload.platform === "instagram" ? "📷" :
                                     upload.platform === "facebook" ? "📘" :
                                     upload.platform === "tiktok" ? "🎵" :
                                     upload.platform === "youtube" ? "▶️" :
                                     upload.platform === "x" ? "🐦" :
                                     upload.platform === "linkedin" ? "💼" : "📱"} {upload.platform}
                              </span>
                            )}
                          </div>
                              {upload.publishedAt && (
                                <div style={{ 
                                  fontSize: "11px",
                                  color: "var(--color-text-secondary)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px"
                                }}>
                                  <span>📅</span>
                                  <span>{new Date(upload.publishedAt).toLocaleString('fr-FR', {
                                    day: 'numeric',
                                    month: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Lien vers la publication et Statistiques côte à côte */}
                          <div style={{
                            display: "flex",
                            gap: "var(--spacing-3)",
                            alignItems: "flex-start"
                          }}>
                            {/* Lien vers la publication */}
                            {upload.platform && (
                              <div style={{
                                flexShrink: 0
                              }}>
                                {(upload.postUrl || (upload.statistics && upload.statistics.length > 0 && upload.statistics[0].postUrl)) ? (
                                  <a
                                    href={upload.postUrl || (upload.statistics && upload.statistics[0]?.postUrl) || '#'}
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
                                      boxShadow: "var(--shadow-sm)",
                                      border: "none"
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
                                      {upload.platform === "instagram" ? "📷" :
                                       upload.platform === "facebook" ? "📘" :
                                       upload.platform === "tiktok" ? "🎵" :
                                       upload.platform === "youtube" ? "▶️" :
                                       upload.platform === "x" ? "🐦" :
                                       upload.platform === "linkedin" ? "💼" : "📱"}
                                    </div>
                                    <span style={{ flex: 1 }}>
                                      {upload.platform.charAt(0).toUpperCase() + upload.platform.slice(1)}
                                    </span>
                                    <ExternalLink size={16} strokeWidth={2.5} />
                                  </a>
                                ) : (
                                  <div style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "var(--spacing-2)",
                                    padding: "var(--spacing-3) var(--spacing-4)",
                                    background: "var(--color-gray-100)",
                                    borderRadius: "var(--border-radius-base)",
                                    fontSize: "12px",
                                    color: "var(--color-text-secondary)",
                                    fontStyle: "italic",
                                    border: "1px solid var(--color-border)"
                                  }}>
                                    <span>🔗</span>
                                    <span>{t('calendarCollab.noLink')}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Statistiques */}
                          {upload.insights && Object.values(upload.insights).some(Boolean) && (
                            <div style={{
                                display: "flex",
                                flexWrap: "nowrap",
                                gap: "var(--spacing-2)",
                                padding: "var(--spacing-3)",
                                background: "linear-gradient(135deg, var(--color-gray-50) 0%, var(--color-white) 100%)",
                                borderRadius: "var(--border-radius-base)",
                                border: "1px solid var(--color-border)",
                                overflowX: "auto",
                                flex: "1 1 0",
                                minWidth: 0
                            }}>
                              {metricKeys.map((key) => {
                                const value = upload.insights?.[key];
                                if (!value) return null;
                                const displayValue = key === "engagement_rate" ? `${value.toFixed(2)}%` : formatNumber(value);
                                  const iconMap: Record<string, string> = {
                                    views: "👁️",
                                    likes: "❤️",
                                    comments: "💬",
                                    shares: "🔁",
                                    saves: "🔖",
                                    engagement_rate: "📈"
                                  };
                                return (
                                    <div 
                                      key={key}
                                      style={{ 
                                        textAlign: "center",
                                        padding: "var(--spacing-2)",
                                        background: "var(--color-white)",
                                        borderRadius: "6px",
                                        border: "1px solid var(--color-border)",
                                        transition: "all var(--transition-fast)",
                                        flex: "1 1 0",
                                        minWidth: "90px"
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "translateY(-1px)";
                                        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                                        e.currentTarget.style.borderColor = "var(--color-primary)";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow = "none";
                                        e.currentTarget.style.borderColor = "var(--color-border)";
                                      }}
                                    >
                                      <div style={{ 
                                        fontSize: "16px",
                                        marginBottom: "2px"
                                      }}>
                                        {iconMap[key] || "📊"}
                                      </div>
                                      <div style={{ 
                                        fontSize: "16px",
                                        fontWeight: "var(--font-weight-bold)",
                                        color: "var(--color-primary)",
                                        marginBottom: "2px",
                                        lineHeight: 1
                                      }}>
                                        {displayValue}
                                      </div>
                                      <div style={{ 
                                        fontSize: "9px",
                                        color: "var(--color-text-secondary)",
                                        fontWeight: "var(--font-weight-semibold)",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px"
                                      }}>
                                        {getMetricLabel(key)}
                                      </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
