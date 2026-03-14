import type { NextApiRequest, NextApiResponse } from "next";
import { Queue } from "bullmq";
import { enqueueSchema } from "@/lib/schemas/publish";

const connection = { host: process.env.REDIS_HOST || "127.0.0.1", port: Number(process.env.REDIS_PORT || 6379) };
const publishQueue = new Queue("publish-queue", { connection });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const parsed = enqueueSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => e.message).join(", ");
    return res.status(400).json({ error: msg });
  }
  const { postId, runAt } = parsed.data;
  const delay = Math.max(0, runAt.getTime() - Date.now());
  const job = await publishQueue.add("publish-post", { postId }, { delay });
  res.status(200).json({ jobId: job.id, scheduledInMs: delay });
}
