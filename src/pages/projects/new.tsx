import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ArrowLeft, Check, Facebook, Instagram, Music, Palette, Link2, CheckCircle, MessageCircle } from "lucide-react";
import { useTranslation } from "@/i18n/TranslationContext";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function NewProject() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    client: "",
    color: "#6366f1"
  });

  const [socialAccounts, setSocialAccounts] = useState([
    { network: "facebook", accountName: "", isActive: false, connected: false, accessToken: "" },
    { network: "instagram", accountName: "", isActive: false, connected: false, accessToken: "" },
    { network: "tiktok", accountName: "", isActive: false, connected: false, accessToken: "" },
    { network: "threads", accountName: "", isActive: false, connected: false, accessToken: "" },
  ]);

  useEffect(() => {
    const { oauth_success, platform, account } = router.query;
    if (oauth_success === 'true' && platform && account) {
      const platformIndex = socialAccounts.findIndex(s => s.network === platform);
      if (platformIndex !== -1) {
        const updated = [...socialAccounts];
        updated[platformIndex] = {
          ...updated[platformIndex],
          connected: true,
          accountName: account as string,
          accessToken: "oauth_token_" + Date.now(),
          isActive: true
        };
        setSocialAccounts(updated);
        router.replace('/projects/new', undefined, { shallow: true });
      }
    }
  }, [router.query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const activeSocial = socialAccounts.filter(s => s.accountName && s.isActive);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, socialAccounts: activeSocial })
      });
      if (res.ok) {
        const { project } = await res.json();
        router.push(`/projects/${project._id}`);
      }
    } catch (error) {
      alert(t('projects.createError'));
    } finally {
      setLoading(false);
    }
  };

  const updateSocialAccount = (index: number, field: string, value: any) => {
    const updated = [...socialAccounts];
    updated[index] = { ...updated[index], [field]: value };
    setSocialAccounts(updated);
  };

  const handleConnectPlatform = (network: string) => {
    if (network === "facebook" || network === "instagram") {
      window.location.href = "/api/auth/meta/login";
    } else if (network === "tiktok") {
      window.location.href = "/api/auth/tiktok/login";
    }
  };

  const handleDisconnectPlatform = (index: number) => {
    const updated = [...socialAccounts];
    updated[index] = { ...updated[index], connected: false, accessToken: "", accountName: "", isActive: false };
    setSocialAccounts(updated);
  };

  const networkData: Record<string, any> = {
    facebook: { icon: Facebook, color: "#1877f2", label: "Facebook" },
    instagram: { icon: Instagram, color: "#e4405f", label: "Instagram" },
    tiktok: { icon: Music, color: "#000000", label: "TikTok" },
    threads: { icon: MessageCircle, color: "#101010", label: "Threads" },
  };

  const colorPresets = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
    "#10b981", "#3b82f6", "#06b6d4", "#ef4444"
  ];

  return (
    <div className="page-container">
      <div className="page-content dash">
        {/* Hero – même style que dashboard */}
        <div className="page-hero">
          <div className="page-hero-inner">
            <div className="page-hero-text">
              <div className="page-hero-breadcrumbs">
                <Breadcrumbs items={[
                  { label: t('menu.dashboard'), href: '/' },
                  { label: t('menu.projects'), href: '/projects' },
                  { label: t('projects.newProject') }
                ]} />
              </div>
              <h1 className="page-hero-title">{t('projects.newProject')}</h1>
              <p className="page-hero-subtitle">{t('projects.setupDescription')}</p>
            </div>
            <div className="page-hero-actions">
              <Link href="/projects" className="page-hero-btn" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>
                <ArrowLeft size={18} strokeWidth={2.5} />
                {t('menu.projects')}
              </Link>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Section Détails du projet */}
          <section className="dash-section">
            <div className="dash-section-head">
              <h2 className="dash-section-title">{t('projects.projectDetails')}</h2>
            </div>
            <div
              className="card"
              style={{
                padding: "var(--spacing-6)",
                marginBottom: 0,
              }}
            >
              <div style={{ marginBottom: "var(--spacing-5)" }}>
                <label className="dash-kpi-label" style={{ display: "block", marginBottom: "var(--spacing-2)" }}>
                  {t('projects.projectName')} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('projects.projectNamePlaceholder')}
                  required
                  style={{ maxWidth: "100%" }}
                />
              </div>
              <div style={{ marginBottom: "var(--spacing-5)" }}>
                <label className="dash-kpi-label" style={{ display: "block", marginBottom: "var(--spacing-2)" }}>
                  {t('common.client')}
                </label>
                <input
                  type="text"
                  value={formData.client}
                  onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  placeholder={t('projects.clientPlaceholder')}
                  style={{ maxWidth: "100%" }}
                />
              </div>
              <div style={{ marginBottom: "var(--spacing-5)" }}>
                <label className="dash-kpi-label" style={{ display: "block", marginBottom: "var(--spacing-2)" }}>
                  {t('common.description')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('projects.descriptionPlaceholder')}
                  rows={4}
                  style={{ resize: "vertical", maxWidth: "100%" }}
                />
              </div>
              <div>
                <label className="dash-kpi-label" style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)", marginBottom: "var(--spacing-3)" }}>
                  <Palette size={14} />
                  {t('projects.projectColor')}
                </label>
                <div style={{ display: "flex", gap: "var(--spacing-3)", marginBottom: "var(--spacing-3)", flexWrap: "wrap" }}>
                  {colorPresets.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      style={{
                        width: "44px",
                        height: "44px",
                        background: color,
                        border: formData.color === color ? "3px solid var(--color-text-primary)" : "2px solid var(--color-border)",
                        borderRadius: "var(--border-radius-base)",
                        cursor: "pointer",
                        transition: "all var(--transition-fast)",
                        position: "relative",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.08)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                    >
                      {formData.color === color && (
                        <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
                          <Check size={18} color="white" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "var(--spacing-3)", alignItems: "center" }}>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    style={{
                      width: "44px",
                      height: "44px",
                      border: "2px solid var(--color-border)",
                      borderRadius: "var(--border-radius-base)",
                      cursor: "pointer",
                      padding: 2,
                    }}
                  />
                  <span className="dash-action-desc" style={{ margin: 0 }}>
                    {t('projects.orChooseCustom')}: <strong style={{ color: "var(--color-text-primary)" }}>{formData.color}</strong>
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Section Réseaux sociaux */}
          <section className="dash-section">
            <div className="dash-section-head">
              <h2 className="dash-section-title">{t('projects.socialAccounts')}</h2>
            </div>
            <p className="dash-action-desc" style={{ marginBottom: "var(--spacing-5)", marginTop: "-var(--spacing-3)" }}>
              {t('projects.connectAccounts')}
            </p>
            <div style={{ display: "grid", gap: "var(--spacing-4)" }}>
              {socialAccounts.map((social, index) => {
                const network = networkData[social.network];
                const Icon = network.icon;
                return (
                  <div
                    key={index}
                    className="card"
                    style={{
                      padding: "var(--spacing-5)",
                      borderLeft: social.connected ? `4px solid ${network.color}` : undefined,
                      background: social.connected ? `${network.color}08` : undefined,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--spacing-4)", flexWrap: "wrap", gap: "var(--spacing-3)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-4)" }}>
                        <div
                          className="dash-kpi-icon"
                          style={{
                            background: `${network.color}15`,
                            color: network.color,
                          }}
                        >
                          <Icon size={22} strokeWidth={2} />
                        </div>
                        <div>
                          <h3 className="dash-action-title" style={{ marginBottom: "var(--spacing-1)", display: "flex", alignItems: "center", gap: "var(--spacing-2)", flexWrap: "wrap" }}>
                            {network.label}
                            {social.connected && (
                              <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "var(--spacing-1)",
                                padding: "var(--spacing-1) var(--spacing-2)",
                                background: "var(--color-success-50)",
                                color: "var(--color-success)",
                                borderRadius: "var(--border-radius-base)",
                                fontSize: "var(--font-size-xs)",
                                fontWeight: "var(--font-weight-semibold)",
                              }}>
                                <CheckCircle size={12} />
                                {t('projects.connected')}
                              </span>
                            )}
                          </h3>
                          <p className="dash-action-desc" style={{ margin: 0, fontSize: "var(--font-size-sm)" }}>
                            {social.connected
                              ? `${t('projects.account')}: ${social.accountName || t('projects.connected')}`
                              : t('projects.notConnected')}
                          </p>
                        </div>
                      </div>
                      {social.connected && (
                        <label style={{ position: "relative", display: "inline-block", width: 48, height: 26 }}>
                          <input
                            type="checkbox"
                            checked={social.isActive}
                            onChange={(e) => updateSocialAccount(index, "isActive", e.target.checked)}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span style={{
                            position: "absolute",
                            cursor: "pointer",
                            top: 0, left: 0, right: 0, bottom: 0,
                            background: social.isActive ? network.color : "var(--color-gray-200)",
                            borderRadius: 26,
                            transition: "0.2s",
                          }}>
                            <span style={{
                              position: "absolute",
                              height: 20, width: 20,
                              left: social.isActive ? 22 : 2,
                              bottom: 3,
                              background: "white",
                              borderRadius: "50%",
                              transition: "0.2s",
                            }} />
                          </span>
                        </label>
                      )}
                    </div>

                    {!social.connected ? (
                      <div>
                        <button
                          type="button"
                          onClick={() => handleConnectPlatform(social.network)}
                          className="page-hero-btn"
                          style={{
                            width: "100%",
                            background: network.color,
                            color: "white",
                            border: "none",
                            justifyContent: "center",
                          }}
                        >
                          <Link2 size={18} />
                          {t('projects.connectWith')} {network.label}
                        </button>
                        <p className="dash-action-desc" style={{ marginTop: "var(--spacing-2)", textAlign: "center", marginBottom: 0, fontSize: "var(--font-size-xs)" }}>
                          {t('projects.oauthSecure')}
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "var(--spacing-3)", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => handleDisconnectPlatform(index)}
                          style={{
                            flex: 1,
                            minWidth: 120,
                            padding: "var(--spacing-2) var(--spacing-4)",
                            background: "var(--color-white)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--border-radius-base)",
                            color: "var(--color-error)",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontSize: "var(--font-size-sm)",
                          }}
                        >
                          {t('projects.disconnect')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConnectPlatform(social.network)}
                          style={{
                            flex: 1,
                            minWidth: 120,
                            padding: "var(--spacing-2) var(--spacing-4)",
                            background: "var(--color-white)",
                            border: `1px solid ${network.color}50`,
                            borderRadius: "var(--border-radius-base)",
                            color: network.color,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontSize: "var(--font-size-sm)",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "var(--spacing-2)",
                          }}
                        >
                          <Link2 size={16} />
                          {t('projects.reconnect')}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Actions pied de page */}
          <div style={{
            display: "flex",
            gap: "var(--spacing-4)",
            justifyContent: "flex-end",
            paddingTop: "var(--spacing-6)",
            borderTop: "1px solid var(--color-border)",
            marginTop: "var(--spacing-6)",
          }}>
            <Link href="/projects">
              <button
                type="button"
                style={{
                  padding: "var(--spacing-2) var(--spacing-4)",
                  background: "var(--color-white)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--border-radius-base)",
                  color: "var(--color-text-secondary)",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "var(--font-size-sm)",
                }}
              >
                {t('common.cancel')}
              </button>
            </Link>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "var(--spacing-2) var(--spacing-4)",
                background: "var(--color-primary)",
                color: "var(--color-white)",
                border: "none",
                borderRadius: "var(--border-radius-base)",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--spacing-2)",
                fontSize: "var(--font-size-sm)",
              }}
            >
              {loading ? t('projects.creating') : (
                <>
                  <Check size={16} strokeWidth={2.5} />
                  {t('projects.createProject')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
