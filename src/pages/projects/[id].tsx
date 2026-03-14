import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  FileText,
  Calendar,
  Facebook,
  Instagram,
  Music,
  Link2,
} from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useTranslation } from "@/i18n/TranslationContext";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

const networkConfig: Record<string, { icon: typeof Facebook; color: string }> = {
  facebook: { icon: Facebook, color: "#1877f2" },
  instagram: { icon: Instagram, color: "#e4405f" },
  tiktok: { icon: Music, color: "#000000" },
  twitter: { icon: Link2, color: "#1da1f2" },
  linkedin: { icon: Link2, color: "#0a66c2" },
};

export default function ProjectDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation();
  const { user } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetch(`/api/projects/${id}`)
        .then((r) => r.json())
        .then((data) => {
          setProject(data.project);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [id]);

  const isAdmin = user?.role === "admin";
  const projectColor = project?.color || "#6366f1";

  if (loading) {
    return (
      <div className="page-container project-detail-page">
        <div
          className="page-content-detail"
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

  if (!project) {
    return (
      <div className="page-container project-detail-page">
        <div className="page-content-detail">
          <div className="project-detail-empty">
            <h3>{t("projects.notFound") || "Projet non trouvé"}</h3>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: 0 }}>
              {t("projects.notFoundDesc") || "Ce projet n'existe pas ou vous n'y avez pas accès."}
            </p>
            <Link href="/projects" className="page-hero-btn" style={{ display: "inline-flex", alignItems: "center", gap: "var(--spacing-2)", marginTop: "var(--spacing-4)" }}>
              <ArrowLeft size={18} />
              {t("projects.backToProjects") || "Retour aux projets"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const socialAccounts = project.socialAccounts?.filter((s: any) => s.isActive) ?? [];

  return (
    <div className="page-container project-detail-page">
      <div className="page-content-detail">
        {/* Hero */}
        <header className="project-detail-hero">
          <div
            className="project-detail-hero-accent"
            style={{
              background: `linear-gradient(90deg, ${projectColor}, ${projectColor}99)`,
            }}
          />
          <div className="project-detail-hero-inner">
            <Link href="/projects" className="project-detail-hero-back">
              <ArrowLeft size={18} strokeWidth={2.5} />
              {t("projects.backToProjects") || "Retour aux projets"}
            </Link>
            <div className="project-detail-hero-top">
              <div>
                <h1 className="project-detail-hero-title">{project.name}</h1>
                {project.client && (
                  <p className="project-detail-hero-client">
                    {t("projects.client") || "Client"} : {project.client}
                  </p>
                )}
              </div>
              <div className="project-detail-hero-actions">
                {isAdmin && (
                  <Link
                    href={`/projects/${id}/edit`}
                    className="page-hero-btn"
                    style={{ display: "inline-flex", alignItems: "center", gap: "var(--spacing-2)" }}
                  >
                    <Edit size={18} strokeWidth={2.5} />
                    {t("projects.editProject") || "Modifier"}
                  </Link>
                )}
              </div>
            </div>
            <Breadcrumbs
              items={[
                { label: t("menu.dashboard") || "Dashboard", href: "/" },
                { label: t("menu.projects") || "Projets", href: "/projects" },
                { label: project.name },
              ]}
            />
          </div>
        </header>

        {/* Description */}
        {project.description && (
          <section className="project-detail-section">
            <h2 className="project-detail-section-title">
              <FileText size={20} strokeWidth={2} />
              {t("projects.description") || "Description"}
            </h2>
            <p className="project-detail-desc">{project.description}</p>
          </section>
        )}

        {/* Réseaux sociaux */}
        <section className="project-detail-section">
          <h2 className="project-detail-section-title">
            <Link2 size={20} strokeWidth={2} />
            {t("projects.socialNetworks") || "Réseaux sociaux connectés"}
          </h2>
          {socialAccounts.length > 0 ? (
            <div className="project-detail-networks">
              {socialAccounts.map((social: any, idx: number) => {
                const config = networkConfig[social.network] || { icon: Link2, color: "var(--color-primary)" };
                const Icon = config.icon;
                const connected = !!social.accessToken;
                return (
                  <div key={idx} className="project-detail-network-card">
                    <div className="project-detail-network-left">
                      <div
                        className="project-detail-network-icon"
                        style={{
                          background: `${config.color}18`,
                          color: config.color,
                        }}
                      >
                        <Icon size={24} strokeWidth={2} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h3 className="project-detail-network-name">{social.network}</h3>
                        <p className="project-detail-network-account">
                          {social.accountName || t("projects.notConfigured") || "Non configuré"}
                        </p>
                        {!connected && (
                          <a
                            href={`/api/auth/${social.network}/login?projectId=${id}`}
                            className="project-detail-network-connect"
                          >
                            {t("projects.connect") || "Connecter"} →
                          </a>
                        )}
                      </div>
                    </div>
                    <span
                      className={`project-detail-network-status ${connected ? "connected" : "disconnected"}`}
                    >
                      {connected
                        ? t("projects.connected") || "Connecté"
                        : t("projects.notConnected") || "Non connecté"}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: "var(--color-text-secondary)", textAlign: "center", padding: "var(--spacing-6)", margin: 0 }}>
              {t("projects.noSocialConfigured") || "Aucun réseau social configuré"}
            </p>
          )}
        </section>

        {/* Actions rapides */}
        <section className="project-detail-section">
          <h2 className="project-detail-section-title">
            <Calendar size={20} strokeWidth={2} />
            {t("projects.quickActions") || "Actions rapides"}
          </h2>
          <div className="project-detail-actions">
            <Link href={`/workflow?projectId=${id}`} className="project-detail-action-link project-detail-action-create">
              <div
                className="project-detail-action-icon"
                style={{
                  background: "#ede9fe",
                  color: "#7c3aed",
                }}
              >
                <FileText size={24} strokeWidth={2} />
              </div>
              <div>
                <h4>{t("projects.createPost") || "Créer un post"}</h4>
                <p>{t("projects.createPostDesc") || "Publier sur les réseaux du projet"}</p>
              </div>
            </Link>
            <Link href={`/calendar-pro?projectId=${id}`} className="project-detail-action-link project-detail-action-calendar">
              <div
                className="project-detail-action-icon"
                style={{
                  background: "#e0f2fe",
                  color: "#0284c7",
                }}
              >
                <Calendar size={24} strokeWidth={2} />
              </div>
              <div>
                <h4>{t("menu.calendar") || "Calendrier"}</h4>
                <p>{t("projects.calendarDesc") || "Voir le planning du projet"}</p>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
