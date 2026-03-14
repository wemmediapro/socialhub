import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import NotificationBell from "./NotificationBell";
import { 
  LayoutDashboard, 
  Folder, 
  Calendar, 
  Users, 
  Star, 
  Eye,
  LogOut,
  User,
  Zap,
  BarChart3,
  Settings,
  Lightbulb,
  Image
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/", color: "#6366f1" },
    { icon: BarChart3, label: "Statistiques", href: "/stats", color: "#8b5cf6" },
    { icon: Folder, label: "Projects", href: "/projects", color: "#8b5cf6" },
    { icon: Lightbulb, label: "Boîte à Idées", href: "/ideas", color: "#f59e0b" },
    { icon: Zap, label: "Workflow Posts", href: "/workflow", color: "#f59e0b" },
    { icon: Calendar, label: "Calendar Posts", href: "/calendar", color: "#ea580c" },
    { icon: Star, label: "Influencers", href: "/influencers", color: "#f59e0b" },
    { icon: Users, label: "Workflow Collab", href: "/collab", color: "#14b8a6" },
    { icon: Calendar, label: "Calendar Collab", href: "/calendar-collab", color: "#059669" },
    { icon: Image, label: "Bibliothèque", href: "/library", color: "#38bdf8" },
    { icon: Settings, label: "Paramètres", href: "/settings", color: "#6366f1" },
  ];

  const isActive = (href: string) => {
    if (href === '/') return router.pathname === '/';
    return router.pathname === href || router.pathname.startsWith(href + '/');
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Left Sidebar - Modern Dynamic */}
      <aside style={{
        width: "280px",
        background: "linear-gradient(180deg, #2d2d2d 0%, #1f1f1f 100%)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflow: "auto",
        boxShadow: "4px 0 24px rgba(0, 0, 0, 0.3)"
      }}>
        {/* MediaPro Logo */}
        <div style={{ 
          padding: "0.75rem 1rem",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "200px",
            height: "200px",
            background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none"
          }} />
          <Link href="/" style={{ textDecoration: "none", display: "block", position: "relative", zIndex: 1 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05) translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1) translateY(0)";
            }}>
              <img 
                src="/logo-mediapro.png"
                alt="MediaPro"
                style={{
                  height: "110px",
                  width: "auto",
                  objectFit: "contain",
                  filter: "drop-shadow(0 4px 16px rgba(255, 255, 255, 0.2)) brightness(1.2) contrast(1.1)",
                  transition: "all 0.3s ease"
                }}
              />
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "1rem 0" }}>
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={i} href={item.href}>
                <div 
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.625rem 1.25rem",
                    margin: "0 0.75rem 0.25rem",
                    color: active ? "#ffffff" : "#999",
                    background: active ? "linear-gradient(90deg, #3a3a3a, #2d2d2d)" : "transparent",
                    fontSize: "0.875rem",
                    fontWeight: active ? "700" : "500",
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    textDecoration: "none",
                    position: "relative",
                    borderRadius: "10px",
                    border: active ? "1px solid #4a4a4a" : "1px solid transparent"
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "#3a3a3a";
                      e.currentTarget.style.color = "#ffffff";
                      e.currentTarget.style.transform = "translateX(8px)";
                      e.currentTarget.style.borderColor = "#4a4a4a";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#999";
                      e.currentTarget.style.transform = "translateX(0)";
                      e.currentTarget.style.borderColor = "transparent";
                    }
                  }}
                >
                  {active && (
                    <div style={{
                      position: "absolute",
                      left: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "3px",
                      height: "60%",
                      background: "#ffffff",
                      borderRadius: "0 4px 4px 0",
                      boxShadow: "0 0 15px rgba(255,255,255,0.8)"
                    }} />
                  )}
                  <Icon 
                    size={19} 
                    strokeWidth={active ? 2.5 : 2}
                    style={{ 
                      color: active ? "#ffffff" : "#666",
                      filter: active ? "drop-shadow(0 2px 8px rgba(255,255,255,0.5))" : "none",
                      transition: "all 0.3s ease"
                    }}
                  />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {active && (
                    <div style={{
                      width: "5px",
                      height: "5px",
                      background: "#ffffff",
                      borderRadius: "50%",
                      boxShadow: "0 0 6px rgba(255,255,255,0.8)"
                    }} />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div style={{ 
          padding: "1.5rem 1.75rem",
          borderTop: "1px solid #4a4a4a",
          background: "radial-gradient(circle at bottom, #2d2d2d, #1f1f1f)"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.875rem",
            marginBottom: "1rem",
            padding: "0.75rem",
            background: "#2d2d2d",
            borderRadius: "12px",
            border: "1px solid #4a4a4a",
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#666";
            e.currentTarget.style.background = "#3a3a3a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#4a4a4a";
            e.currentTarget.style.background = "#2d2d2d";
          }}>
            <div style={{
              width: "46px",
              height: "46px",
              background: "linear-gradient(135deg, #3a3a3a, #2d2d2d)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              border: "1px solid #666",
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
            }}>
              <User size={22} strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.9375rem", fontWeight: "700", color: "#ffffff", marginBottom: "0.125rem" }}>
                Admin User
              </div>
              <div style={{ fontSize: "0.75rem", color: "#666" }}>
                admin@mediapro.com
              </div>
            </div>
          </div>
          
          <Link href="/login">
            <button style={{
              width: "100%",
              fontSize: "0.875rem",
              padding: "0.875rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.625rem",
              background: "#2d2d2d",
              color: "#999",
              border: "1px solid #4a4a4a",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "700",
              transition: "all 0.3s ease",
              position: "relative",
              overflow: "hidden"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.color = "#000000";
              e.currentTarget.style.borderColor = "#ffffff";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(255,255,255,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#2d2d2d";
              e.currentTarget.style.color = "#999";
              e.currentTarget.style.borderColor = "#4a4a4a";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}>
              <LogOut size={16} strokeWidth={2.5} />
              Sign out
            </button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ 
        flex: 1, 
        overflow: "auto",
        minHeight: "100vh",
        position: "relative"
      }}>
        {/* Notification Bell - Fixed top right */}
        <div style={{
          position: "fixed",
          top: "2rem",
          right: "2rem",
          zIndex: 999
        }}>
          <NotificationBell userId="DEMO_USER" />
        </div>
        
        {children}
      </main>
    </div>
  );
}