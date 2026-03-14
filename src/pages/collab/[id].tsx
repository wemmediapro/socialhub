import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";

export default function CollabDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [c, setC] = useState<any>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/collaborations/${id}`).then(res => setC(res.data.collaboration));
  }, [id]);

  const addMsg = async () => {
    await axios.post("/api/collab/thread/post", { collabId: id, author: "team", text: msg });
    setMsg("");
    const res = await axios.get(`/api/collaborations/${id}`);
    setC(res.data.collaboration);
  };

  if (!c) return <main style={{ padding: 24 }}>Chargement…</main>;
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>{c.title || "Collaboration"}</h1>
      <div><b>Influenceur :</b> {c?.influencerId?.name}</div>
      <div><b>Status :</b> {c.status} | <b>Décision client :</b> {c.clientDecision}</div>
      <div style={{ marginTop: 12 }}><b>Objectifs :</b><div>{c.objectives}</div></div>
      <div style={{ marginTop: 12 }}><b>Brief :</b><div>{c.brief}</div></div>

      <h3 style={{ marginTop: 16 }}>Espace d'idées (équipe & client)</h3>
      <div style={{ border: "1px solid #ddd", padding: 12 }}>
        {(c.thread||[]).map((m:any, idx:number) => (
          <div key={idx} style={{ marginBottom: 8 }}>
            <b>{m.author}</b> — {new Date(m.at).toLocaleString()}<br />{m.text}
          </div>
        ))}
        <div style={{ marginTop: 8 }}>
          <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="Proposer une idée, script, promo…" />
          <div><button onClick={addMsg}>Envoyer</button></div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        Lien d'accès client : <code>/collab/view?token={c.clientToken}&id={c._id}</code>
      </div>
    </main>
  );
}
