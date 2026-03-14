import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/i18n/TranslationContext";
import type { PagePermissions, PermissionKey } from "@/models/Permission";
import { normalizePagePermissions, DEFAULT_PERMISSION_MATRIX } from "@/models/Permission";
import {
  UserPlus,
  User,
  Mail,
  Phone,
  Key,
  Users,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Folder,
  Check,
  Send,
  Sparkles,
  Film,
  Paintbrush,
  Info,
  ShieldCheck,
  GitBranch,
  ChevronDown,
} from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import LoadingSpinner from "@/components/LoadingSpinner";

type User = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: "digital_creative" | "client" | "infographiste" | "video_motion";
  login: string;
  password: string;
  isActive: boolean;
  projectIds?: string[];
  createdAt: string;
};

export default function SettingsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user: currentUser, permissionMatrix, refreshPermissions } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailTest, setEmailTest] = useState({
    email: "",
    name: "",
    type: "POST_CREATED",
  });

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "digital_creative" as User["role"],
    login: "",
    password: "",
    projectIds: [] as string[],
  });

  type PermKey = PermissionKey;
  type RoleId = "admin" | "digital_creative" | "client" | "infographiste" | "video_motion" | "influencer";
  const ROLES_ORDER: RoleId[] = ["admin", "digital_creative", "client", "infographiste", "video_motion", "influencer"];
  const PERM_KEYS_ORDER: PermKey[] = ["dashboard", "stats", "projects", "ideas", "workflowPosts", "calendarPosts", "influencers", "influencerContact", "workflowCollab", "calendarCollab", "library", "budgetAndTarifs", "settings"];
  const PERM_ACTIONS: Array<keyof PagePermissions> = ["view", "create", "update", "delete", "workflow"];
  const PERM_ACTION_ICONS: Record<keyof PagePermissions, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
    view: Eye,
    create: UserPlus,
    update: Edit,
    delete: Trash2,
    workflow: GitBranch,
  };
  /** Groupes de pages pour une lecture plus simple */
  const PERM_GROUPS: { labelKey: string; keys: PermKey[] }[] = [
    { labelKey: "settings.permissions.groupDashboard", keys: ["dashboard", "stats"] },
    { labelKey: "settings.permissions.groupContent", keys: ["projects", "ideas", "workflowPosts", "calendarPosts"] },
    { labelKey: "settings.permissions.groupInfluencers", keys: ["influencers", "influencerContact"] },
    { labelKey: "settings.permissions.groupCollab", keys: ["workflowCollab", "calendarCollab"] },
    { labelKey: "settings.permissions.groupResources", keys: ["library", "budgetAndTarifs"] },
    { labelKey: "settings.permissions.groupSettings", keys: ["settings"] },
  ];
  const [editMatrix, setEditMatrix] = useState<Record<RoleId, Record<PermKey, PagePermissions>> | null>(null);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [permissionsDropdownOpen, setPermissionsDropdownOpen] = useState(false);
  const [openRoleDropdowns, setOpenRoleDropdowns] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!permissionMatrix) return;
    const normalized: Record<RoleId, Record<PermKey, PagePermissions>> = {} as Record<RoleId, Record<PermKey, PagePermissions>>;
    for (const role of ROLES_ORDER) {
      normalized[role] = {} as Record<PermKey, PagePermissions>;
      for (const key of PERM_KEYS_ORDER) {
        const current = (permissionMatrix as Record<string, Record<string, unknown>>)[role]?.[key];
        const fallback = DEFAULT_PERMISSION_MATRIX[role][key];
        normalized[role][key] = normalizePagePermissions(current as PagePermissions | boolean | undefined, fallback);
      }
    }
    setEditMatrix(normalized);
  }, [permissionMatrix]);

  const setPermission = (role: RoleId, key: PermKey, action: keyof PagePermissions, value: boolean) => {
    setEditMatrix((prev) => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev)) as Record<RoleId, Record<PermKey, PagePermissions>>;
      if (!next[role][key]) next[role][key] = { ...prev[role][key] };
      next[role][key][action] = value;
      return next;
    });
  };

  const handleSavePermissions = async () => {
    if (!editMatrix) return;
    setSavingPermissions(true);
    try {
      const res = await axios.put("/api/permissions", { matrix: editMatrix });
      if (res.data?.matrix) {
        await refreshPermissions();
        alert(t("settings.permissions.saved") || "Permissions enregistrées.");
      } else {
        alert(res.data?.error || t("settings.operationError"));
      }
    } catch (err: any) {
      alert(err.response?.data?.error || t("settings.operationError"));
    } finally {
      setSavingPermissions(false);
    }
  };

  const roleLabels: Record<RoleId, string> = {
    admin: t("settings.roles.admin"),
    digital_creative: t("settings.roles.digitalCreative"),
    client: t("settings.roles.client"),
    infographiste: t("settings.roles.infographiste"),
    video_motion: t("settings.roles.videoMotion"),
    influencer: t("settings.roles.influencer"),
  };

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      router.push("/");
    }
  }, [currentUser, router]);

  useEffect(() => {
    loadUsers();
    loadProjects();
  }, []);

  const loadUsers = async () => {
    try {
      const { data } = await axios.get("/api/users");
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const { data } = await axios.get("/api/projects");
      setProjects(data.projects || []);
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

  const resetForm = () => {
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "digital_creative",
      login: "",
      password: "",
      projectIds: [],
    });
    setEditingUser(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await axios.put(`/api/users/${editingUser._id}`, form);
        alert(t("settings.userUpdated"));
      } else {
        await axios.post("/api/users", form);
        alert(t("settings.userAdded"));
      }
      resetForm();
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || t("settings.operationError"));
    }
  };

  const handleEdit = (user: User) => {
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      login: user.login,
      password: "",
      projectIds: user.projectIds || [],
    });
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("settings.deleteConfirm"))) return;
    try {
      await axios.delete(`/api/users/${id}`);
      alert(t("settings.userDeleted"));
      loadUsers();
    } catch (error) {
      alert(t("settings.deleteError"));
    }
  };

  const roleConfig = {
    digital_creative: {
      label: t("settings.roles.digitalCreative"),
      icon: Sparkles,
      color: "var(--color-primary)",
      bg: "var(--color-primary-100)",
    },
    client: {
      label: t("common.client"),
      icon: Users,
      color: "#059669",
      bg: "#d1fae5",
    },
    infographiste: {
      label: t("posts.infographiste"),
      icon: Paintbrush,
      color: "#db2777",
      bg: "#fce7f3",
    },
    video_motion: {
      label: t("posts.videoMotion"),
      icon: Film,
      color: "#7c3aed",
      bg: "#ede9fe",
    },
  };

  const getUsersByRole = (role: User["role"]) => users.filter((u) => u.role === role);

  const getProjectName = (id: string) => {
    const project = projects.find((p) => p._id === id);
    return project?.name || t("reports.unknown");
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTest.email || !emailTest.name) {
      alert(t("settings.emailNameRequired"));
      return;
    }
    setSendingEmail(true);
    try {
      const { data } = await axios.post("/api/test-email", emailTest);
      alert(data.message || t("settings.emailSent"));
    } catch (error: any) {
      alert(error.response?.data?.error || t("settings.sendError"));
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-content dash settings-page" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-content dash settings-page">
        {/* Hero – même structure que le dashboard */}
        <div className="page-hero">
          <div className="page-hero-inner">
            <div className="page-hero-text">
              <div className="page-hero-breadcrumbs">
                <Breadcrumbs items={[{ label: t("menu.dashboard"), href: "/" }, { label: t("settings.title") }]} />
              </div>
              <h1 className="page-hero-title">{t("settings.title")}</h1>
              <p className="page-hero-subtitle">{t("settings.subtitle")}</p>
            </div>
            <div className="page-hero-actions">
              <button
                type="button"
                onClick={() => (showForm ? resetForm() : setShowForm(true))}
                className="page-hero-btn"
              >
                {showForm ? <X size={20} strokeWidth={2} /> : <UserPlus size={20} strokeWidth={2} />}
                {showForm ? t("common.cancel") : t("settings.newUser")}
              </button>
            </div>
          </div>
        </div>

        {/* Formulaire nouvel / édition utilisateur */}
        {showForm && (
          <section className="dash-section">
            <div className="settings-form-card">
              <h2 className="settings-form-title">
                {editingUser ? t("settings.editUser") : t("settings.newUser")}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="settings-form-grid">
                  <div className="settings-field">
                    <label className="settings-label">{t("settings.firstName")} *</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      placeholder="Jean"
                      required
                    />
                  </div>
                  <div className="settings-field">
                    <label className="settings-label">{t("settings.lastName")} *</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      placeholder="Dupont"
                      required
                    />
                  </div>
                  <div className="settings-field">
                    <label className="settings-label">
                      <span className="settings-label-icon"><Mail size={14} strokeWidth={2} /></span>
                      {t("settings.email")} *
                    </label>
                    <input
                      type="email"
                      className="settings-input"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="jean.dupont@exemple.fr"
                      required
                    />
                  </div>
                  <div className="settings-field">
                    <label className="settings-label">
                      <span className="settings-label-icon"><Phone size={14} strokeWidth={2} /></span>
                      {t("settings.phone")}
                    </label>
                    <input
                      type="tel"
                      className="settings-input"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                  <div className="settings-field">
                    <label className="settings-label">
                      <span className="settings-label-icon"><User size={14} strokeWidth={2} /></span>
                      {t("settings.login")} *
                    </label>
                    <input
                      type="text"
                      className="settings-input"
                      value={form.login}
                      onChange={(e) => setForm({ ...form, login: e.target.value })}
                      placeholder="jean.dupont"
                      required
                    />
                  </div>
                  <div className="settings-field">
                    <label className="settings-label">
                      <span className="settings-label-icon"><Key size={14} strokeWidth={2} /></span>
                      {t("settings.password")} {editingUser && `(${t("settings.passwordLeaveEmpty")})`}
                    </label>
                    <div className="settings-input-wrap">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="••••••••"
                        required={!editingUser}
                        className={editingUser ? "" : "settings-password"}
                      />
                      <button
                        type="button"
                        className="settings-toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="settings-roles-label">{t("common.status")} *</div>
                <div className="settings-roles-grid">
                  {Object.entries(roleConfig).map(([key, config]) => {
                    const Icon = config.icon;
                    const isSelected = form.role === key;
                    return (
                      <div
                        key={key}
                        role="button"
                        tabIndex={0}
                        className={`settings-role-card ${isSelected ? "is-selected" : ""}`}
                        onClick={() => setForm({ ...form, role: key as User["role"] })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setForm({ ...form, role: key as User["role"] });
                          }
                        }}
                      >
                        <div
                          className="settings-role-icon-wrap"
                          style={isSelected ? { background: config.color, color: "white" } : undefined}
                        >
                          <Icon size={24} strokeWidth={2} />
                        </div>
                        <div className="settings-role-label">{config.label}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="settings-roles-label">
                  <span className="settings-label-icon"><Folder size={14} strokeWidth={2} /></span>
                  {t("settings.assignedProjects")} ({form.projectIds.length} {t("ideas.form.selected")}
                  {form.projectIds.length > 1 ? "s" : ""})
                </div>
                <p className="settings-projects-hint">{t("settings.selectProjects")}</p>
                <div className="settings-projects-list">
                  {projects.length === 0 ? (
                    <div className="settings-empty-state" style={{ gridColumn: "1 / -1" }}>
                      <Folder size={32} strokeWidth={1} />
                      <p>{t("posts.noProjectsAvailable")}</p>
                      <p style={{ fontSize: "0.75rem", marginTop: 4 }}>{t("settings.createProjectsFirst")}</p>
                    </div>
                  ) : (
                    projects.map((project) => {
                      const isSelected = form.projectIds.includes(project._id);
                      return (
                        <div
                          key={project._id}
                          role="button"
                          tabIndex={0}
                          className={`settings-project-chip ${isSelected ? "is-selected" : ""}`}
                          onClick={() => {
                            const newIds = isSelected
                              ? form.projectIds.filter((id) => id !== project._id)
                              : [...form.projectIds, project._id];
                            setForm({ ...form, projectIds: newIds });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              const newIds = isSelected
                                ? form.projectIds.filter((id) => id !== project._id)
                                : [...form.projectIds, project._id];
                              setForm({ ...form, projectIds: newIds });
                            }
                          }}
                        >
                          <span className="settings-project-name">{project.name}</span>
                          {isSelected && <Check size={16} strokeWidth={3} />}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="settings-form-actions">
                  <button type="button" onClick={resetForm} className="btn btn-secondary">
                    {t("common.cancel")}
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <Save size={18} strokeWidth={2} />
                    {editingUser ? t("common.edit") : t("common.create")}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* Utilisateurs par rôle */}
        <section className="dash-section">
          <div className="dash-section-head">
            <h2 className="dash-section-title">{t("settings.usersByRole") || "Utilisateurs par rôle"}</h2>
          </div>
          <div className="settings-roles-section">
            {Object.entries(roleConfig).map(([roleKey, config]) => {
              const Icon = config.icon;
              const roleUsers = getUsersByRole(roleKey as User["role"]);
              const isOpen = openRoleDropdowns[roleKey] ?? false;
              const toggleRole = () => setOpenRoleDropdowns((prev) => ({ ...prev, [roleKey]: !prev[roleKey] }));
              return (
                <div key={roleKey} className="settings-role-block settings-role-block-dropdown">
                  <button
                    type="button"
                    className="settings-role-block-head settings-role-block-trigger"
                    onClick={toggleRole}
                    aria-expanded={isOpen}
                    aria-controls={`settings-role-content-${roleKey}`}
                  >
                    <div
                      className="settings-role-block-icon"
                      style={{ background: config.bg, color: config.color }}
                    >
                      <Icon size={26} strokeWidth={2} />
                    </div>
                    <div className="settings-role-block-head-text">
                      <h3 className="settings-role-block-title">{config.label}</h3>
                      <p className="settings-role-block-count">
                        {roleUsers.length} {t("settings.user")}
                        {roleUsers.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <ChevronDown
                      size={22}
                      strokeWidth={2}
                      className={`settings-role-block-chevron ${isOpen ? "is-open" : ""}`}
                    />
                  </button>
                  <div
                    id={`settings-role-content-${roleKey}`}
                    className={`settings-role-block-content ${isOpen ? "is-open" : ""}`}
                    role="region"
                  >
                    {roleUsers.length === 0 ? (
                      <div className="settings-empty-state">
                        <Icon size={40} strokeWidth={1} />
                        <p>{t("settings.noUsers")}</p>
                      </div>
                    ) : (
                      <div className="settings-user-list">
                        {roleUsers.map((user) => (
                          <div key={user._id} className="settings-user-card">
                            <div className="settings-user-info">
                              <div className="settings-user-name">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="settings-user-meta">
                                <span className="settings-user-meta-icon"><Mail size={14} strokeWidth={2} /></span>
                                {user.email}
                              </div>
                              <div className="settings-user-meta">
                                <span className="settings-user-meta-icon"><User size={14} strokeWidth={2} /></span>
                                {user.login}
                              </div>
                              {user.projectIds && user.projectIds.length > 0 && (
                                <div className="settings-user-projects">
                                  {user.projectIds.map((projectId) => (
                                    <span key={projectId} className="settings-user-project-tag">
                                      <Folder size={12} strokeWidth={2} />
                                      {getProjectName(projectId)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="settings-user-actions">
                              <button
                                type="button"
                                className="settings-btn-icon settings-btn-edit"
                                onClick={() => handleEdit(user)}
                                aria-label={t("common.edit")}
                              >
                                <Edit size={24} strokeWidth={2.25} />
                              </button>
                              <button
                                type="button"
                                className="settings-btn-icon settings-btn-delete"
                                onClick={() => handleDelete(user._id)}
                                aria-label={t("common.delete")}
                              >
                                <Trash2 size={24} strokeWidth={2.25} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Récapitulatif des permissions par rôle – dropdown */}
        <section className="dash-section settings-permissions-dropdown">
          <button
            type="button"
            className="settings-permissions-dropdown-trigger"
            onClick={() => setPermissionsDropdownOpen((o) => !o)}
            aria-expanded={permissionsDropdownOpen}
            aria-controls="settings-permissions-content"
          >
            <div className="settings-permissions-dropdown-title">
              <ShieldCheck size={22} strokeWidth={2} />
              <span>{t("settings.permissions.title")}</span>
              <ChevronDown
                size={22}
                strokeWidth={2}
                className={`settings-permissions-dropdown-icon ${permissionsDropdownOpen ? "is-open" : ""}`}
              />
            </div>
            <p className="settings-permissions-dropdown-subtitle">{t("settings.permissions.subtitle")}</p>
          </button>
          <div
            id="settings-permissions-content"
            className={`settings-permissions-dropdown-content ${permissionsDropdownOpen ? "is-open" : ""}`}
            role="region"
            aria-label={t("settings.permissions.title")}
          >
            {editMatrix && (
              <div className="settings-permissions-head settings-permissions-dropdown-actions">
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  disabled={savingPermissions}
                  className="btn btn-primary settings-permissions-save-btn"
                >
                  <Save size={18} strokeWidth={2} />
                  {savingPermissions ? t("common.saving") : (t("settings.permissions.save") || "Enregistrer les permissions")}
                </button>
              </div>
            )}
            {!editMatrix ? (
              <div className="settings-empty-state settings-permissions-loading">
                <LoadingSpinner size="md" />
                <p>{t("common.loading")}</p>
              </div>
            ) : (
              <div className="settings-permissions-cards">
                {ROLES_ORDER.map((role) => (
                  <div key={role} className="settings-perm-role-card">
                    <div className="settings-perm-role-card-header">
                      <strong className="settings-perm-role-name">{roleLabels[role]}</strong>
                      {role === "digital_creative" && <span className="settings-role-badge">Social</span>}
                    </div>
                    <div className="settings-perm-role-card-body">
                      {PERM_GROUPS.map((group) => (
                        <div key={group.labelKey} className="settings-perm-group">
                          <div className="settings-perm-group-title">{t(group.labelKey)}</div>
                          <div className="settings-perm-group-pages">
                            {group.keys.map((key) => {
                              const perms = editMatrix[role]?.[key];
                              if (!perms) return null;
                              return (
                                <div key={key} className="settings-perm-page-row">
                                  <span className="settings-perm-page-label">{t(`settings.permissions.${key}`)}</span>
                                  <div className="settings-perm-actions">
                                    {PERM_ACTIONS.map((action) => {
                                      const Icon = PERM_ACTION_ICONS[action];
                                      return (
                                        <label
                                          key={action}
                                          className={`settings-perm-toggle ${perms[action] ? "is-checked" : ""}`}
                                          title={t(`settings.permissions.${action}`)}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={perms[action]}
                                            onChange={(e) => setPermission(role, key, action, e.target.checked)}
                                            className="settings-perm-checkbox"
                                          />
                                          <span className="settings-perm-toggle-inner">
                                            <Icon size={14} strokeWidth={2.5} />
                                          </span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>


        {/* Test d’envoi d’email */}
        <section className="dash-section">
          <div className="settings-test-email-card">
            <h3 className="settings-test-email-title">
              <span className="settings-test-email-icon"><Mail size={22} strokeWidth={2} /></span>
              {t("settings.testEmail") || "Test d’envoi d’email"}
              <span className="settings-test-email-info" title="Test email"><Info size={16} strokeWidth={2} /></span>
            </h3>
            <p className="settings-test-email-desc">
              Envoyez un email de test pour vérifier la configuration SMTP (destinataire et nom optionnels).
            </p>
            <form onSubmit={handleSendTestEmail}>
              <div className="settings-test-email-form">
                <div className="settings-test-email-grid">
                  <div className="settings-field">
                    <label className="settings-label">{t("settings.email")}</label>
                    <input
                      type="email"
                      className="settings-input"
                      value={emailTest.email}
                      onChange={(e) => setEmailTest({ ...emailTest, email: e.target.value })}
                      placeholder="destinataire@exemple.fr"
                    />
                  </div>
                  <div className="settings-field">
                    <label className="settings-label">{t("settings.name") || "Nom"}</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={emailTest.name}
                      onChange={(e) => setEmailTest({ ...emailTest, name: e.target.value })}
                      placeholder="Jean Dupont"
                    />
                  </div>
                </div>
                <div className="settings-test-email-actions">
                  <button type="submit" className="btn btn-primary" disabled={sendingEmail}>
                    <Send size={18} strokeWidth={2} />
                    {sendingEmail ? t("common.sending") || "Envoi…" : t("settings.sendTest") || "Envoyer un test"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
