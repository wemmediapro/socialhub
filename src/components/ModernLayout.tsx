import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode, useState, useEffect, useRef, useCallback } from "react";
import LoadingSpinner from "./LoadingSpinner";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/i18n/TranslationContext";
import {
  LayoutDashboard,
  Folder,
  Calendar,
  Users,
  Star,
  LogOut,
  Zap,
  BarChart3,
  Settings,
  Lightbulb,
  Menu,
  Languages,
  Image,
  X,
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export default function ModernLayout({ children }: LayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { user, isInitialized, logout, hasAccess } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const { ToastContainer } = useToast();

  // Redirect to login if not authenticated (once, avoid loop)
  useEffect(() => {
    if (typeof window === 'undefined' || !isInitialized || !router.isReady) return;
    if (router.pathname === '/login') return;
    if (!user) {
      router.replace('/login');
    }
  }, [user, isInitialized, router.isReady, router.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined" && window.innerWidth >= 1024) {
        setSidebarMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Verrouiller le scroll du body quand le menu mobile est ouvert
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (sidebarMobileOpen) {
      document.body.classList.add("sidebar-mobile-open");
    } else {
      document.body.classList.remove("sidebar-mobile-open");
    }
    return () => document.body.classList.remove("sidebar-mobile-open");
  }, [sidebarMobileOpen]);

  // Fermer au clavier Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sidebarMobileOpen) {
        setSidebarMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarMobileOpen]);

  // Focus sur le bouton fermer à l'ouverture (accessibilité, mobile uniquement)
  useEffect(() => {
    if (sidebarMobileOpen && closeButtonRef.current && typeof window !== "undefined" && window.innerWidth < 1025) {
      closeButtonRef.current.focus({ preventScroll: true });
    }
  }, [sidebarMobileOpen]);

  const closeMobileSidebar = useCallback(() => setSidebarMobileOpen(false), []);

  // Show loading
  // Also block access if no user after initialization
  if (typeof window === 'undefined' || 
      !isInitialized || 
      router.isReady === false || 
      (isInitialized && router.isReady && !user && router.pathname !== '/login')) {
    return (
      <div className="loading-overlay">
        <LoadingSpinner size="lg" />
        <p>
          {!user && isInitialized ? 'Redirection vers la page de connexion...' : 'Vérification de l\'authentification...'}
        </p>
      </div>
    );
  }

  // Menu items avec clés de traduction et groupes (mobile)
  const allMenuItems = [
    { icon: LayoutDashboard, labelKey: "menu.dashboard", href: "/", group: "overview" },
    { icon: BarChart3, labelKey: "menu.statistics", href: "/stats", group: "overview" },
    { icon: Folder, labelKey: "menu.projects", href: "/projects", group: "content" },
    { icon: Lightbulb, labelKey: "menu.ideas", href: "/ideas", group: "content" },
    { icon: Zap, labelKey: "menu.workflowPosts", href: "/workflow", group: "posts" },
    { icon: Calendar, labelKey: "menu.calendarPosts", href: "/calendar", group: "posts" },
    { icon: Star, labelKey: "menu.influencers", href: "/influencers", group: "collab" },
    { icon: Users, labelKey: "menu.workflowCollab", href: "/collab", group: "collab" },
    { icon: Calendar, labelKey: "menu.calendarCollab", href: "/calendar-collab", group: "collab" },
    { icon: Image, labelKey: "menu.library", href: "/library", group: "other" },
    { icon: Settings, labelKey: "menu.settings", href: "/settings", group: "other" },
  ];

  const menuGroupLabels: Record<string, string> = {
    overview: "Vue d'ensemble",
    content: "Projets & idées",
    posts: "Posts",
    collab: "Collaborations",
    other: "Paramètres",
  };

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item => hasAccess(item.href));

  const isActive = (href: string) => {
    if (href === '/') return router.pathname === '/';
    return router.pathname === href || router.pathname.startsWith(href + '/');
  };

  return (
    <div className="app-shell">
      {/* Header mobile : hamburger + logo */}
      <header className="app-mobile-header" aria-label="Navigation principale">
        <button
          type="button"
          aria-label={sidebarMobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={sidebarMobileOpen}
          aria-controls="app-sidebar"
          className="app-mobile-header-burger"
          onClick={() => setSidebarMobileOpen(!sidebarMobileOpen)}
        >
          <Menu size={24} strokeWidth={2} />
        </button>
        <Link href="/" className="app-mobile-header-logo" onClick={closeMobileSidebar}>
          <img src="/logo-mediapro.png" alt="MediaPro" />
        </Link>
      </header>

      {/* Overlay mobile (fermeture sidebar) */}
      <button
        type="button"
        aria-label="Fermer le menu"
        className={`sidebar-overlay ${sidebarMobileOpen ? "sidebar-overlay-visible" : ""}`}
        onClick={closeMobileSidebar}
      />

      {/* Sidebar */}
      <aside
        id="app-sidebar"
        role={sidebarMobileOpen ? "dialog" : undefined}
        aria-modal={sidebarMobileOpen ? "true" : undefined}
        aria-label={sidebarMobileOpen ? "Menu de navigation" : undefined}
        className={`app-sidebar ${!sidebarOpen ? "app-sidebar-collapsed" : ""} ${sidebarMobileOpen ? "app-sidebar-mobile-open" : ""}`}
      >
        <div className="app-sidebar-logo">
          <Link href="/" className="app-sidebar-logo-link" onClick={closeMobileSidebar}>
            <img
              src="/logo-mediapro.png"
              alt="MediaPro"
            />
          </Link>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Fermer le menu"
            className="app-sidebar-close-mobile"
            onClick={closeMobileSidebar}
          >
            <X size={22} strokeWidth={2.5} />
          </button>
        </div>

        <nav className="app-sidebar-nav">
          {(["overview", "content", "posts", "collab", "other"] as const).map((groupKey) => {
            const items = menuItems.filter((it) => (it as typeof it & { group?: string }).group === groupKey);
            if (items.length === 0) return null;
            return (
              <div key={groupKey} className="nav-group">
                <span className="nav-group-label">{menuGroupLabels[groupKey]}</span>
                {items.map((item, i) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link key={item.href} href={item.href} onClick={closeMobileSidebar}>
                      <div className={`nav-item ${active ? "nav-item-active" : ""}`}>
                        <Icon size={20} strokeWidth={active ? 2.5 : 2} className="nav-item-icon" />
                        <span className="nav-item-label">{t(item.labelKey)}</span>
                        {active && <span className="nav-item-dot" />}
                      </div>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Bas du menu : langue, déconnexion, powered by */}
        <div className="app-sidebar-footer">
          <div className="app-sidebar-lang">
            <Languages size={16} className="app-sidebar-lang-icon" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'fr' | 'it')}
              className="app-sidebar-lang-select"
            >
              <option value="fr">🇫🇷 Français</option>
              <option value="it">🇮🇹 Italiano</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="app-sidebar-logout"
          >
            <LogOut size={16} strokeWidth={2.5} />
            {t('common.logout')}
          </button>
          <div className="app-sidebar-powered">
            <a href="https://www.groupemediapro.com" target="_blank" rel="noopener noreferrer">
              Powered by Mediapro
            </a>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main
        className={`app-main ${!sidebarOpen ? "app-main-sidebar-collapsed" : ""}`}
      >
        <div className="app-page-wrapper">
          {children}
        </div>
      </main>

      <ToastContainer />
    </div>
  );
}

