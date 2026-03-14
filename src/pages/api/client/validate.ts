import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/db";
import Post from "@/models/Post";
import { clientValidateSchema } from "@/lib/schemas/collab";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  if (req.method !== "POST") return res.status(405).end();
  const parsed = clientValidateSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => e.message).join(", ");
    return res.status(400).json({ error: msg });
  }
  const { token, postId, action, comment } = parsed.data;
  const post = await Post.findOne({ _id: postId, clientToken: token });
  if (!post) return res.status(404).json({ error: "post not found" });
  if (action === "approve") post.status = "approved";
  if (action === "reject") post.status = "pending";
  if (comment) post.history.push({ at: new Date(), action: "client-comment", by: "client", note: comment });
  await post.save();
  res.status(200).json({ post });
}
