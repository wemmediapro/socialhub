import { useEffect, useState } from "react";
import axios from "axios";

export default function CollabClientView() {
  const [c, setC] = useState<any>(null);
  const [token, setToken] = useState<string>("");
  const [cid, setCid] = useState<string>("");
  const [note, setNote] = useState("");

  useEffect(() => {
    const url = new URL(window.location.href);
    const t = url.searchParams.get("token") || "";
    const id = url.searchParams.get("id") || "";
    setToken(t); setCid(id);
    if (id) axios.get(`/api/collaborations/${id}`).then(res => setC(res.data.collaboration));
  }, []);

  const decide = async (decision: "approved"|"changes_requested"|"rejected") => {
    await axios.post("/api/collab/client/decision", { token, collabId: cid, decision, note });
    alert("Merci pour votre retour");
    const res = await axios.get(`/api/collaborations/${cid}`);
    setC(res.data.collaboration);
    setNote("");
  };

  if (!c) return <main style={{ padding: 24 }}>Chargement…</main>;
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Collaboration : {c.title || c?.influencerId?.name}</h1>
      <div><b>Influenceur :</b> {c?.influencerId?.name}</div>
      <div><b>Objectifs :</b> {c.objectives}</div>
      <div><b>Brief :</b> {c.brief}</div>
      <div style={{ marginTop: 12 }}><b>Décision actuelle :</b> {c.clientDecision}</div>
      <h3 style={{ marginTop: 16 }}>Espace d'idées</h3>
      <div style={{ border: "1px solid #ddd", padding: 12 }}>
        {(c.thread||[]).map((m:any, idx:number) => (
          <div key={idx} style={{ marginBottom: 8 }}>
            <b>{m.author}</b> — {new Date(m.at).toLocaleString()}<br />{m.text}
          </div>
        ))}
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Ajouter une remarque, idée, correction…" />
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={() => decide("approved")}>✅ Valider</button>{" "}
        <button onClick={() => decide("changes_requested")}>✏️ Demander des changements</button>{" "}
        <button onClick={() => decide("rejected")}>⛔ Refuser</button>
      </div>
    </main>
  );
}
