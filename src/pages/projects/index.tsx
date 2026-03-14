import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Plus,
  Folder,
  Facebook,
  Instagram,
  Music,
  Trash2,
  Edit,
  ArrowRight,
  Search,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/i18n/TranslationContext";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function Projects() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingProject, setDeletingProject] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        setProjects(data.projects || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!user || user.role !== "admin") return;

    if (!confirm(t("projects.deleteConfirm").replace("{name}", projectName))) {
      return;
    }

    setDeletingProject(projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProjects(projects.filter((p) => p._id !== projectId));
        alert(t("projects.deleteSuccess"));
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error || t("projects.deleteError")}`);
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      alert(t("projects.deleteError"));
    } finally {
      setDeletingProject(null);
    }
  };

  const isAdmin = user?.role === "admin";

  const filteredProjects = search.trim()
    ? projects.filter(
        (p) =>
          p.name?.toLowerCase().includes(search.trim().toLowerCase()) ||
          p.client?.toLowerCase().includes(search.trim().toLowerCase()) ||
          p.description?.toLowerCase().includes(search.trim().toLowerCase())
      )
    : projects;

  const networkIcons: Record<string, any> = {
    facebook: { icon: Facebook, color: "#1877f2" },
    instagram: { icon: Instagram, color: "#e4405f" },
    tiktok: { icon: Music, color: "#000000" },
  };

  if (loading) {
    return (
      <div className="page-container">
        <div
          className="page-content dashboard-page"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "50vh",
          }}
        >
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container projects-page">
      <div className="page-content dash">
        {/* Hero – même style que dashboard */}
        <div className="page-hero">
          <div className="page-hero-inner">
            <div className="page-hero-text">
              <div className="page-hero-breadcrumbs">
                <Breadcrumbs
                  items={[
                    { label: t("menu.dashboard"), href: "/" },
                    { label: t("menu.projects") },
                  ]}
                />
              </div>
              <h1 className="page-hero-title">{t("menu.projects")}</h1>
              <p className="page-hero-subtitle">
                {isAdmin
                  ? t("projects.subtitleAdmin")
                  : t("projects.subtitle")}
              </p>
            </div>
            <div className="page-hero-actions">
              <Link href="/projects/new" className="page-hero-btn">
                <Plus size={18} strokeWidth={2.5} />
                {t("projects.newProject")}
              </Link>
            </div>
          </div>
        </div>

        {/* KPI – un bloc comme sur le dashboard */}
        <div className="dash-kpis">
          <div className="dash-kpi">
            <div
              className="dash-kpi-icon"
              style={{
                background: "var(--color-primary-100)",
                color: "var(--color-primary-600)",
              }}
            >
              <Folder size={24} strokeWidth={2.5} />
            </div>
            <div className="dash-kpi-body">
              <div className="dash-kpi-value">{projects.length}</div>
              <div className="dash-kpi-label">
                {t("dashboard.stats.projects")}
              </div>
            </div>
          </div>
        </div>

        {/* Section liste */}
        <section className="dash-section">
          <div className="dash-section-head">
            <h2 className="dash-section-title">
              {t("projects.listTitle") || "Vos projets"}
            </h2>
            {projects.length > 0 && (
              <div className="projects-search-wrap">
                <div className="projects-search-box">
                  <Search size={18} strokeWidth={2} aria-hidden />
                  <input
                    type="search"
                    className="projects-search-input"
                    placeholder={t("common.search") || "Rechercher…"}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label={t("common.search") || "Rechercher un projet"}
                  />
                </div>
              </div>
            )}
          </div>

          {projects.length === 0 ? (
            <div className="projects-empty-wrap">
              <EmptyState
                icon={Folder}
                title={t("projects.noProjects")}
                description={t("projects.createFirst")}
                action={
                  <Link
                    href="/projects/new"
                    className="page-hero-btn"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "var(--spacing-2)",
                      marginTop: "var(--spacing-4)",
                    }}
                  >
                    <Plus size={18} strokeWidth={2.5} />
                    {t("projects.createProject")}
                  </Link>
                }
              />
            </div>
          ) : (
            <>
              {filteredProjects.length === 0 && search.trim() ? (
                <p style={{ marginBottom: "var(--spacing-4)", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                  {t("common.search") || "Recherche"} : aucun projet ne correspond à « {search.trim()} ».{" "}
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    style={{ background: "none", border: "none", color: "var(--color-primary)", cursor: "pointer", fontWeight: 600, padding: 0 }}
                  >
                    Réinitialiser
                  </button>
                </p>
              ) : null}
            <div className="projects-grid">
              {filteredProjects.map((project) => (
                <div
                  key={project._id}
                  role="button"
                  tabIndex={0}
                  className="projects-card"
                  onClick={() => router.push(`/projects/${project._id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/projects/${project._id}`);
                    }
                  }}
                >
                  <div
                    className="projects-card-accent"
                    style={{
                      background: `linear-gradient(90deg, ${project.color || "#6366f1"}, ${project.color ? `${project.color}99` : "#818cf8"})`,
                    }}
                  />
                  <div className="projects-card-header">
                    <div
                      className="projects-card-icon"
                      style={{
                        background: `${project.color || "var(--color-primary)"}18`,
                        color: project.color || "var(--color-primary)",
                      }}
                    >
                      <Folder size={22} strokeWidth={2.5} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h3 className="projects-card-title">{project.name}</h3>
                      {project.client && (
                        <p className="projects-card-client">{project.client}</p>
                      )}
                    </div>
                  </div>
                  <p className="projects-card-desc">
                    {project.description
                      ? project.description.slice(0, 120) + (project.description.length > 120 ? "…" : "")
                      : t("projects.noDescription") || "Aucune description"}
                  </p>

                  {project.socialAccounts && project.socialAccounts.length > 0 && (
                    <div className="projects-card-networks">
                      {project.socialAccounts
                        .filter((s: any) => s.isActive)
                        .map((social: any, idx: number) => {
                          const net = networkIcons[social.network];
                          const Icon = net?.icon || Folder;
                          return (
                            <span
                              key={idx}
                              className="projects-card-network"
                              style={{
                                background: `${net?.color || "var(--color-primary)"}18`,
                                border: `1px solid ${net?.color || "var(--color-primary)"}40`,
                                color: net?.color || "var(--color-primary)",
                              }}
                            >
                              <Icon size={12} strokeWidth={2.5} />
                              {social.network.charAt(0).toUpperCase() + social.network.slice(1)}
                            </span>
                          );
                        })}
                    </div>
                  )}

                  <div className="projects-card-footer">
                    <span
                      className={`projects-card-status ${project.status === "active" ? "active" : ""}`}
                    >
                      {project.status || "active"}
                    </span>
                    <div className="projects-card-actions">
                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            data-action="edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/projects/${project._id}/edit`);
                            }}
                            title={t("projects.editProject")}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            data-action="delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project._id, project.name);
                            }}
                            disabled={deletingProject === project._id}
                            title={t("projects.deleteProject")}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                      <span
                        className="projects-card-cta"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(`/projects/${project._id}`);
                        }}
                      >
                        {t("common.view") || "Voir"}
                        <ArrowRight size={16} strokeWidth={3} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <Link href="/projects/new" className="projects-card projects-card-new" aria-label={t("projects.newProject")}>
                <div className="projects-card-new-inner">
                  <Plus size={32} strokeWidth={2} />
                  <span>{t("projects.newProject")}</span>
                </div>
              </Link>
            </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
