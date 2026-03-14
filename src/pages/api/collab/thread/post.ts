import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/db";
import Collaboration from "@/models/Collaboration";
import { threadPostSchema } from "@/lib/schemas/collab";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  if (req.method !== "POST") return res.status(405).end();
  const parsed = threadPostSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => e.message).join(", ");
    return res.status(400).json({ error: msg });
  }
  const { collabId, author, text } = parsed.data;

  const col = await Collaboration.findById(collabId);
  if (!col) return res.status(404).json({ error: "collaboration not found" });

  col.thread.push({ author, text });
  await col.save();
  res.status(200).json({ collaboration: col });
}
