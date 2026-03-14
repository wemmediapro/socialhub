import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Check, ArrowRight, Loader } from "lucide-react";

export default function OAuthSimulator() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);
  const [platform, setPlatform] = useState("");
  const [accountName, setAccountName] = useState("");

  useEffect(() => {
    // Get platform from URL
    const urlPlatform = window.location.pathname.includes("meta") ? "instagram" : "tiktok";
    setPlatform(urlPlatform);
    
    // Generate fake account name
    const accounts: Record<string, string> = {
      instagram: "@my_business_ig",
      facebook: "My Business Page",
      tiktok: "@my_business_tt"
    };
    setAccountName(accounts[urlPlatform] || "@demo_account");

    // Countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect back with success
          router.push(`/projects/new?oauth_success=true&platform=${urlPlatform}&account=${encodeURIComponent(accounts[urlPlatform] || "@demo_account")}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "2rem"
    }}>
      <div style={{
        maxWidth: "480px",
        width: "100%",
        background: "white",
        borderRadius: "16px",
        padding: "3rem",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        textAlign: "center"
      }}>
        <div style={{
          width: "80px",
          height: "80px",
          background: "linear-gradient(135deg, #10b981, #059669)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 2rem",
          animation: "pulse 2s ease-in-out infinite"
        }}>
          <Check size={40} color="white" strokeWidth={3} />
        </div>

        <h1 style={{
          fontSize: "1.75rem",
          fontWeight: "800",
          marginBottom: "1rem",
          color: "#111"
        }}>
          ✅ Connexion Réussie !
        </h1>

        <p style={{
          color: "#666",
          fontSize: "1rem",
          marginBottom: "2rem"
        }}>
          Votre compte <strong style={{ color: platform === "instagram" ? "#E4405F" : "#000" }}>
            {platform === "instagram" ? "Instagram" : "TikTok"}
          </strong> a été connecté avec succès
        </p>

        <div style={{
          background: "#f8f9fa",
          padding: "1.5rem",
          borderRadius: "12px",
          marginBottom: "2rem"
        }}>
          <div style={{
            fontSize: "0.875rem",
            color: "#999",
            marginBottom: "0.5rem",
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Compte connecté
          </div>
          <div style={{
            fontSize: "1.25rem",
            fontWeight: "700",
            color: "#111"
          }}>
            {accountName}
          </div>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          color: "#666",
          fontSize: "0.9375rem"
        }}>
          {countdown > 0 ? (
            <>
              <Loader size={20} style={{ animation: "spin 1s linear infinite" }} />
              Redirection dans {countdown}s...
            </>
          ) : (
            <>
              <ArrowRight size={20} />
              Redirection...
            </>
          )}
        </div>

        <style jsx>{`
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.05);
              opacity: 0.8;
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
    </div>
  );
}

