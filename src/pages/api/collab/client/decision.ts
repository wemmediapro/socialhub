import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/db";
import Collaboration from "@/models/Collaboration";
import { clientDecisionSchema } from "@/lib/schemas/collab";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  if (req.method !== "POST") return res.status(405).end();
  const parsed = clientDecisionSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => e.message).join(", ");
    return res.status(400).json({ error: msg });
  }
  const { token, collabId, decision, note } = parsed.data;

  const col = await Collaboration.findOne({ _id: collabId, clientToken: token });
  if (!col) return res.status(404).json({ error: "collaboration not found" });

  if (decision) col.clientDecision = decision;
  if (note) {
    col.clientNotes = note;
    if (!col.thread) col.thread = [];
    col.thread.push({ author: "client", text: note });
  }
  if (!col.history) col.history = [];
  col.history.push({ action: "client-decision", by: "client", note: decision || "", at: new Date() });
  await col.save();
  res.status(200).json({ collaboration: col });
}
