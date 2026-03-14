import Post from "@/models/Post";
import Account from "@/models/Account";

/** Placeholder TikTok : implémenter l'Upload API (init + upload + publish) selon votre app. */
export async function publishToTikTok(postId: string) {
  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found");
  const acc = await Account.findOne({ network: "tiktok" });
  if (!acc?.accessToken) throw new Error("TikTok token missing");
  post.externalIds.tiktokVideoId = "tiktok_demo_video_id";
  await post.save();
  return { id: "tiktok_demo_video_id" };
}
