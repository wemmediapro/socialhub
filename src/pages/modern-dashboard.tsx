import Link from "next/link";
import { useState, useEffect } from "react";
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
  Sparkles,
  Calendar,
  Eye,
  Heart,
  MessageCircle,
  BarChart3,
  Clock
} from "lucide-react";

export default function ModernDashboard() {
  const [stats, setStats] = useState({ 
    posts: 0, 
    collabs: 0, 
    influencers: 0,
    projects: 0,
    totalReach: 0,
    totalEngagement: 0
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/posts').then(r => r.json()),
      fetch('/api/collaborations').then(r => r.json()),
      fetch('/api/influencers').then(r => r.json()),
      fetch('/api/projects').then(r => r.json()),
    ]).then(([posts, collabs, influencers, projects]) => {
      // Calculate total reach from published posts
      const totalReach = (posts.posts || [])
        .filter((p: any) => p.status === "PUBLISHED")
        .reduce((sum: number, p: any) => sum + (p.insights?.reach || 0), 0);
      
      const totalEngagement = (posts.posts || [])
        .filter((p: any) => p.status === "PUBLISHED")
        .reduce((sum: number, p: any) => sum + (p.insights?.engagement || 0), 0);

      setStats({
        posts: posts.posts?.length || 0,
        collabs: collabs.collaborations?.length || 0,
        influencers: influencers.influencers?.length || 0,
        projects: projects.projects?.length || 0,
        totalReach,
        totalEngagement
      });
    }).catch(console.error);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const statsCards = [
    { 
      label: "Total Reach", 
      value: formatNumber(stats.totalReach), 
      icon: Eye, 
      gradient: "linear-gradient(135deg, #667eea, #764ba2)",
      trend: "+12.5%",
      color: "#667eea"
    },
    { 
      label: "Engagement", 
      value: formatNumber(stats.totalEngagement), 
      icon: Heart, 
      gradient: "linear-gradient(135deg, #f093fb, #f5576c)",
      trend: "+8.3%",
      color: "#f5576c"
    },
    { 
      label: "Active Projects", 
      value: stats.projects, 
      icon: Folder, 
      gradient: "linear-gradient(135deg, #4facfe, #00f2fe)",
      trend: "+3",
      color: "#00f2fe"
    },
    { 
      label: "Influencers", 
      value: stats.influencers, 
      icon: Star, 
      gradient: "linear-gradient(135deg, #43e97b, #38f9d7)",
      trend: "+2",
      color: "#38f9d7"
    },
  ];

  const quickActions = [
    { 
      title: "Nouvelle Idée", 
      description: "Proposer une idée créative", 
      href: "/ideas", 
      icon: Lightbulb,
      gradient: "linear-gradient(135deg, #fa709a, #fee140)",
      color: "#fa709a"
    },
    { 
      title: "Créer un Post", 
      description: "Composer du contenu", 
      href: "/posts/new", 
      icon: FileText,
      gradient: "linear-gradient(135deg, #30cfd0, #330867)",
      color: "#30cfd0"
    },
    { 
      title: "Workflow", 
      description: "Gérer les tâches", 
      href: "/workflow", 
      icon: Zap,
      gradient: "linear-gradient(135deg, #a8edea, #fed6e3)",
      color: "#a8edea"
    },
    { 
      title: "Calendrier", 
      description: "Planifier publications", 
      href: "/calendar", 
      icon: Calendar,
      gradient: "linear-gradient(135deg, #ff9a9e, #fecfef)",
      color: "#ff9a9e"
    },
  ];

  return (
    <div style={{ 
      padding: "2.5rem 3rem",
      minHeight: "100vh",
      background: "transparent"
    }}>
      
      {/* Animated Header */}
      <div className="slide-in-up" style={{ marginBottom: "2.5rem" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.625rem",
          padding: "0.625rem 1.25rem",
          background: "rgba(102, 126, 234, 0.1)",
          backdropFilter: "blur(10px)",
          borderRadius: "24px",
          border: "1px solid rgba(102, 126, 234, 0.2)",
          marginBottom: "1.25rem"
        }}>
          <Sparkles size={16} style={{ color: "#667eea" }} />
          <span style={{ fontSize: "0.8125rem", fontWeight: "700", color: "#667eea", letterSpacing: "0.02em" }}>
            Bienvenue sur MediaPro
          </span>
        </div>
        
        <h1 style={{ 
          fontSize: "2.5rem", 
          fontWeight: "900", 
          marginBottom: "0.75rem",
          letterSpacing: "-0.05em",
          background: "linear-gradient(135deg, #ffffff 0%, #cccccc 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}>
          Dashboard
        </h1>
        <p style={{ color: "#888", fontSize: "1.0625rem", fontWeight: "500" }}>
          Vue d'ensemble de vos projets et performances
        </p>
      </div>

      {/* Stats Grid - Ultra Modern */}
      <div className="stagger-children" style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(4, 1fr)", 
        gap: "1.5rem",
        marginBottom: "2.5rem"
      }}>
        {statsCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div 
              key={i} 
              className="glass-card card-lift"
              style={{ 
                padding: "2rem 1.75rem",
                position: "relative",
                overflow: "hidden",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)"
              }}
            >
              {/* Animated Gradient Background */}
              <div style={{
                position: "absolute",
                top: "-50%",
                right: "-50%",
                width: "200%",
                height: "200%",
                background: stat.gradient,
                opacity: 0.05,
                transform: "rotate(-45deg)",
                transition: "all 0.5s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.1";
                e.currentTarget.style.transform = "rotate(-45deg) scale(1.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "0.05";
                e.currentTarget.style.transform = "rotate(-45deg) scale(1)";
              }}
              />
              
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ 
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "1.5rem"
                }}>
                  <div style={{
                    width: "52px",
                    height: "52px",
                    background: stat.gradient,
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 8px 24px ${stat.color}40`
                  }}>
                    <Icon size={26} color="white" strokeWidth={2.5} />
                  </div>
                  
                  <span style={{
                    padding: "0.375rem 0.75rem",
                    background: "rgba(16, 185, 129, 0.1)",
                    color: "#10b981",
                    borderRadius: "8px",
                    fontSize: "0.75rem",
                    fontWeight: "700"
                  }}>
                    {stat.trend}
                  </span>
                </div>
                
                <div style={{ 
                  fontSize: "0.6875rem", 
                  color: "#888",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: "0.625rem",
                  fontWeight: "700"
                }}>
                  {stat.label}
                </div>
                
                <div style={{ 
                  fontSize: "2.75rem", 
                  fontWeight: "900", 
                  color: "#ffffff",
                  letterSpacing: "-0.03em",
                  textShadow: `0 0 40px ${stat.color}60`
                }}>
                  {stat.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions - Modern Grid */}
      <div className="slide-in-up" style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ 
            fontSize: "1.5rem", 
            fontWeight: "800",
            letterSpacing: "-0.03em",
            color: "#ffffff"
          }}>
            Actions Rapides
          </h2>
          <TrendingUp size={20} style={{ color: "#888" }} />
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem" }}>
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Link key={i} href={action.href}>
                <div 
                  className="glass-card card-lift"
                  style={{ 
                    padding: "2rem 1.75rem",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    position: "relative",
                    overflow: "hidden",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)"
                  }}
                >
                  {/* Hover Glow Effect */}
                  <div 
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      width: "150px",
                      height: "150px",
                      background: action.gradient,
                      opacity: 0,
                      borderRadius: "50%",
                      filter: "blur(60px)",
                      transform: "translate(-50%, -50%)",
                      transition: "opacity 0.5s ease",
                      pointerEvents: "none"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.2";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "0";
                    }}
                  />
                  
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{
                      width: "56px",
                      height: "56px",
                      background: action.gradient,
                      borderRadius: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "1.5rem",
                      boxShadow: `0 8px 24px ${action.color}40`,
                      transition: "all 0.3s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "rotate(-5deg) scale(1.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "rotate(0) scale(1)";
                    }}>
                      <Icon size={28} color="white" strokeWidth={2.5} />
                    </div>
                    
                    <h3 style={{ 
                      fontSize: "1.125rem", 
                      fontWeight: "800", 
                      marginBottom: "0.5rem",
                      letterSpacing: "-0.02em",
                      color: "#ffffff"
                    }}>
                      {action.title}
                    </h3>
                    <p style={{ fontSize: "0.875rem", color: "#888", marginBottom: "1.25rem", lineHeight: "1.5" }}>
                      {action.description}
                    </p>
                    <div style={{ 
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.875rem",
                      fontWeight: "700",
                      color: action.color
                    }}>
                      <span>Démarrer</span>
                      <ArrowRight size={16} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="slide-in-up" style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ 
          fontSize: "1.5rem", 
          fontWeight: "800",
          marginBottom: "1.5rem",
          letterSpacing: "-0.03em",
          color: "#ffffff"
        }}>
          Activité Récente
        </h2>
        
        <div className="glass-card" style={{
          padding: "2.5rem",
          textAlign: "center",
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.08)"
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
            boxShadow: "0 12px 40px rgba(102, 126, 234, 0.4)"
          }}>
            <TrendingUp size={40} color="white" strokeWidth={2} />
          </div>
          <p style={{ fontSize: "1.125rem", fontWeight: "700", marginBottom: "0.5rem", color: "#ffffff" }}>
            Aucune activité récente
          </p>
          <p style={{ fontSize: "0.9375rem", color: "#888" }}>
            Vos activités apparaîtront ici
          </p>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="slide-in-up">
        <h2 style={{ 
          fontSize: "1.5rem", 
          fontWeight: "800",
          marginBottom: "1.5rem",
          letterSpacing: "-0.03em",
          color: "#ffffff"
        }}>
          Vue d'ensemble
        </h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
          {/* Main Chart */}
          <div className="glass-card" style={{
            padding: "2rem",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            minHeight: "300px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <div style={{ textAlign: "center" }}>
              <BarChart3 size={64} strokeWidth={1} style={{ opacity: 0.3, margin: "0 auto 1rem", color: "#888" }} />
              <p style={{ color: "#888", fontSize: "0.9375rem" }}>
                Graphiques de performance à venir
              </p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="glass-card" style={{
              padding: "1.5rem",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                <div style={{
                  width: "44px",
                  height: "44px",
                  background: "linear-gradient(135deg, #667eea, #764ba2)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 16px rgba(102, 126, 234, 0.4)"
                }}>
                  <FileText size={22} color="white" strokeWidth={2.5} />
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#888", fontWeight: "600" }}>
                    Total Posts
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#ffffff" }}>
                    {stats.posts}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="glass-card" style={{
              padding: "1.5rem",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                <div style={{
                  width: "44px",
                  height: "44px",
                  background: "linear-gradient(135deg, #43e97b, #38f9d7)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 16px rgba(67, 233, 123, 0.4)"
                }}>
                  <Users size={22} color="white" strokeWidth={2.5} />
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#888", fontWeight: "600" }}>
                    Collaborations
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#ffffff" }}>
                    {stats.collabs}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

