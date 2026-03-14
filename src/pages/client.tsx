import { useEffect, useState } from "react";
import axios from "axios";
import { getMediaUrlForContext } from "@/lib/utils";

type Post = {
  _id: string;
  projectId: string;
  network: string;
  type: string;
  caption: string;
  scheduledAt: string;
  status: string;
  mediaUrls?: string[];
};

function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const u = url.split("?")[0].toLowerCase();
  return /\.(mp4|webm|mov|ogg|m4a)(#|$)/i.test(u) || u.includes("video");
}

export default function ClientView() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const t = url.searchParams.get("token") || "DEMO";
    setToken(t);
    const apiUrl = t !== "DEMO" ? `/api/posts?clientToken=${encodeURIComponent(t)}` : "/api/posts";
    axios.get(apiUrl).then((res) => setPosts(res.data.posts || []));
  }, []);

  const act = async (postId: string, action: "approve" | "reject") => {
    await axios.post("/api/client/validate", { token, postId, action });
    alert(action === "approve" ? "Validé" : "Remis en attente");
  };

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Espace Client – Publications</h1>
      {posts.map((p) => (
        <div key={p._id} style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16, borderRadius: 8 }}>
          <b>{p.network?.toUpperCase() || "—"} – {p.type || "post"}</b>
          <div>Date : {new Date(p.scheduledAt).toLocaleString()}</div>
          <div>Caption : {p.caption || "—"}</div>
          <div>Statut : {p.status}</div>

          {/* Médias (images / vidéos) */}
          {p.mediaUrls && p.mediaUrls.length > 0 && (
            <div style={{ marginTop: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 8 }}>
                Médias ({p.mediaUrls.length})
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                  gap: 12,
                }}
              >
                {p.mediaUrls.map((url, idx) => {
                  const normalizedUrl = getMediaUrlForContext(url, "workflow");
                  const isVideo = isVideoUrl(url);
                  return (
                    <div
                      key={idx}
                      style={{
                        borderRadius: 8,
                        overflow: "hidden",
                        background: "#f0f0f0",
                        aspectRatio: "1",
                        maxHeight: 220,
                      }}
                    >
                      {isVideo ? (
                        <video
                          src={normalizedUrl}
                          controls
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={normalizedUrl}
                          alt={`Média ${idx + 1}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ marginTop: 8 }}>
            <button onClick={() => act(p._id, "approve")}>✅ Valider</button>{" "}
            <button onClick={() => act(p._id, "reject")}>✏️ Demander des modifs</button>
          </div>
        </div>
      ))}
    </main>
  );
}
