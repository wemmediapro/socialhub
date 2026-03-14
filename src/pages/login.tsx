import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { LogIn, User, Key, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const authContext = useAuth();
  const { login } = authContext ?? {};
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  // Éviter le décalage du centrage dû à la scrollbar (VPS / production)
  useEffect(() => {
    document.documentElement.classList.add("login-page-active");
    return () => document.documentElement.classList.remove("login-page-active");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with:', form);
    console.log('Login function available:', typeof login);
    
    if (!login) {
      console.error('Login function is not available!');
      setError("Erreur: Fonction de connexion non disponible");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      console.log('Attempting login...');
      await login(form.email, form.password);
      console.log('Login successful, redirecting...');
      router.push("/");
    } catch (error) {
      console.error('Login failed:', error);
      setError("Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Social Hub - Connexion</title>
      </Head>
    <div
      className="login-page-root"
      style={{
        minHeight: "100vh",
        width: "100%",
        maxWidth: "100vw",
        margin: 0,
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1e3a5f 0%, #0d47a1 50%, #1565c0 100%)",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box"
      }}
    >
      {/* Animated background */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.08), transparent 50%), radial-gradient(circle at 70% 50%, rgba(255,255,255,0.05), transparent 50%)",
        pointerEvents: "none"
      }} />

      {/* Login Card - centrage robuste */}
      <div style={{
        width: "100%",
        maxWidth: "480px",
        margin: "0 auto",
        padding: "0 2rem",
        position: "relative",
        zIndex: 1,
        boxSizing: "border-box",
        flexShrink: 0
      }}>
        
        {/* Logo */}
        <div style={{
          textAlign: "center",
          marginBottom: "3rem",
          animation: "fadeInDown 0.6s ease-out"
        }}>
          <img 
            src="/logo-login.png"
            alt="Logo"
            style={{
              height: "160px",
              width: "auto",
              margin: "0 auto",
              filter: "drop-shadow(0 8px 24px rgba(0, 0, 0, 0.15))"
            }}
          />
        </div>

        {/* Card */}
        <div style={{
          background: "linear-gradient(135deg, #0a0a0a, #000000)",
          border: "1px solid #1a1a1a",
          borderRadius: "20px",
          padding: "3rem",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8), 0 0 80px rgba(255,255,255,0.05)",
          animation: "fadeInUp 0.8s ease-out"
        }}>
          <h1 style={{
            fontSize: "1.75rem",
            fontWeight: "800",
            color: "#ffffff",
            marginBottom: "0.5rem",
            letterSpacing: "-0.02em"
          }}>
            Bienvenue
          </h1>
          <p style={{
            color: "#999",
            fontSize: "0.9375rem",
            marginBottom: "2.5rem"
          }}>
            Connectez-vous pour accéder à votre espace
          </p>

          <form onSubmit={handleSubmit}>
            {/* Login Field */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "700",
                color: "#999",
                marginBottom: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                Identifiant
              </label>
              <div style={{ position: "relative" }}>
                <div style={{
                  position: "absolute",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#666"
                }}>
                  <User size={18} />
                </div>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="votre@email.com"
                  required
                  style={{
                    width: "100%",
                    padding: "1rem 1rem 1rem 3rem",
                    fontSize: "1rem",
                    background: "#0a0a0a",
                    border: "1px solid #1a1a1a",
                    borderRadius: "12px",
                    color: "#ffffff",
                    fontWeight: "600",
                    transition: "all 0.3s ease"
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#ffffff";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,255,255,0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#1a1a1a";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: "2rem" }}>
              <label style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "700",
                color: "#999",
                marginBottom: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                Mot de passe
              </label>
              <div style={{ position: "relative" }}>
                <div style={{
                  position: "absolute",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#666"
                }}>
                  <Key size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  style={{
                    width: "100%",
                    padding: "1rem 3rem 1rem 3rem",
                    fontSize: "1rem",
                    background: "#0a0a0a",
                    border: "1px solid #1a1a1a",
                    borderRadius: "12px",
                    color: "#ffffff",
                    fontWeight: "600",
                    transition: "all 0.3s ease"
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#ffffff";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,255,255,0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#1a1a1a";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#666",
                    cursor: "pointer",
                    padding: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "color 0.2s ease"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#666"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                background: "#ff4444",
                color: "#ffffff",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                marginBottom: "1.5rem",
                fontSize: "0.875rem",
                fontWeight: "600"
              }}>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "1.125rem",
                fontSize: "1rem",
                fontWeight: "800",
                background: "#ffffff",
                color: "#000000",
                border: "none",
                borderRadius: "12px",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                transition: "all 0.3s ease",
                opacity: loading ? 0.6 : 1,
                letterSpacing: "0.02em"
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(255,255,255,0.4)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: "18px",
                    height: "18px",
                    border: "2px solid #000",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite"
                  }} />
                  Connexion...
                </>
              ) : (
                <>
                  <LogIn size={20} strokeWidth={2.5} />
                  Se connecter
                </>
              )}
            </button>
          </form>
        </div>

        {/* Bottom Text */}
        <div style={{
          textAlign: "center",
          marginTop: "2rem",
          color: "#666",
          fontSize: "0.8125rem",
          animation: "fadeIn 1s ease-out"
        }}>
          © 2025 GROUPE MEDIAPRO
        </div>
      </div>

      <style jsx>{`
        :global(html.login-page-active) {
          scrollbar-gutter: stable;
        }
        :global(html.login-page-active body) {
          overflow-x: hidden;
          overflow-y: auto;
        }
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
    </>
  );
}
