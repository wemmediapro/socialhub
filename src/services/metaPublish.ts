import axios from "axios";
import Post from "@/models/Post";
import Account from "@/models/Account";

/** Publie sur Instagram (image) et Facebook (texte / photo / vidéo).
 * Étendre pour IG carrousel/Reels si besoin.
 */
export async function publishToMeta(postId: string) {
  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found");

  if (post.network === "instagram") {
    const acc = await Account.findOne({ network: "instagram" });
    if (!acc?.igUserId || !acc.accessToken) throw new Error("Instagram account/token missing");
    const imageUrl = post.mediaUrls?.[0];
    if (!imageUrl) throw new Error("No media URL for Instagram");
    const container = await axios.post(`https://graph.facebook.com/v19.0/${acc.igUserId}/media`, null, {
      params: { image_url: imageUrl, caption: post.caption || "", access_token: acc.accessToken }
    });
    const creationId = container.data.id;
    const publish = await axios.post(`https://graph.facebook.com/v19.0/${acc.igUserId}/media_publish`, null, {
      params: { creation_id: creationId, access_token: acc.accessToken }
    });
    post.externalIds.igMediaId = publish.data.id;
    await post.save();
    return publish.data;
  }

  if (post.network === "facebook") {
    const acc = await Account.findOne({ network: "facebook" });
    if (!acc?.pageId || !acc.accessToken) throw new Error("Facebook page/token missing");
    const media = post.mediaUrls?.[0];
    if (media) {
      if (media.match(/\.mp4($|\?)/i)) {
        // Video post
        const v = await axios.post(`https://graph.facebook.com/v19.0/${acc.pageId}/videos`, null, {
          params: { file_url: media, description: post.caption || "", access_token: acc.accessToken }
        });
        post.externalIds.fbPostId = v.data.id;
        await post.save();
        return v.data;
      } else {
        // Photo post
        const p = await axios.post(`https://graph.facebook.com/v19.0/${acc.pageId}/photos`, null, {
          params: { url: media, caption: post.caption || "", access_token: acc.accessToken }
        });
        post.externalIds.fbPostId = p.data.post_id || p.data.id;
        await post.save();
        return p.data;
      }
    } else {
      // Text-only post
      const resp = await axios.post(`https://graph.facebook.com/v19.0/${acc.pageId}/feed`, null, {
        params: { message: post.caption || "", access_token: acc.accessToken }
      });
      post.externalIds.fbPostId = resp.data.id;
      await post.save();
      return resp.data;
    }
  }

  throw new Error("Unsupported Meta network");
}
