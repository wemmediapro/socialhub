import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/db";
import Influencer from "@/models/Influencer";
import { createInfluencerSchema } from "@/lib/schemas/influencers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  if (req.method === "GET") {
    const { projectId } = req.query;
    const filter: { projectId?: string } = typeof projectId === "string" ? { projectId } : {};
    const data = await Influencer.find(filter).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ influencers: data });
  }
  if (req.method === "POST") {
    const parsed = createInfluencerSchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.errors.map((e) => e.message).join(", ");
      return res.status(400).json({ error: msg });
    }
    const inf = await Influencer.create(parsed.data);
    return res.status(201).json({ influencer: inf });
  }
  res.setHeader("Allow","GET,POST");
  res.status(405).end();
}
