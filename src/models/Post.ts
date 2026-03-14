import mongoose, { Schema, Document, Model } from "mongoose";

interface IPost extends Document {
  projectId: string;
  projectIds: string[];
  network?: "facebook" | "instagram" | "tiktok" | "threads";
  networks: Array<"facebook" | "instagram" | "tiktok" | "threads">;
  type: "post" | "story" | "reel" | "carousel";
  nature: string;
  description: string;
  caption: string;
  descriptionIt?: string;
  captionIt?: string;
  hashtags: string;
  tags: string[];
  mediaUrls: string[];
  scheduledAt: Date;
  status: "DRAFT" | "PENDING_GRAPHIC" | "CLIENT_REVIEW" | "SCHEDULED" | "PENDING_CORRECTION" | "PUBLISHED" | "FAILED" | "approved" | "pending";
  assignedTo: "infographiste" | "video_motion" | "GRAPHIC_DESIGNER" | "CLIENT" | null;
  publishedAt?: Date;
  postUrl?: string;
  statsPlatform?: "facebook" | "instagram" | "tiktok" | "threads";
  comments: Array<{
    user: string;
    role: "DIGITAL_MARKETER" | "GRAPHIC_DESIGNER" | "CLIENT" | "ADMIN";
    text: string;
    createdAt: Date;
  }>;
  externalIds: {
    igMediaId?: string;
    fbPostId?: string;
    tiktokVideoId?: string;
  };
  insights: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
    engagement_rate?: number;
  };
  multiPlatformStats?: Array<{
    platform: string;
    followers?: number;
    sentiment?: "positive" | "neutral" | "negative";
    publishedAt?: Date;
    postUrl?: string;
    insights?: {
      views?: number;
      likes?: number;
      comments?: number;
      shares?: number;
      saves?: number;
      engagement_rate?: number;
    };
    sponsored?: boolean;
  }>;
  sentiment?: "positive" | "neutral" | "negative";
  history: Array<{
    at: Date;
    action: string;
    by: string;
    note: string;
  }>;
  clientToken?: string;
}

const PostSchema = new Schema({
  projectId: { type: String, required: true }, // Keep for backward compatibility - will be the first project
  projectIds: [{ type: String }], // Multi-project support
  network: { type: String, enum: ["facebook","instagram","tiktok","threads"] }, // Keep for backward compatibility
  networks: [{ type: String, enum: ["facebook","instagram","tiktok","threads"] }], // New multi-network support
  type: { type: String, enum: ["post","story","reel","carousel"], required: true },
  nature: { type: String, default: "commercial" },
  description: { type: String, default: "" }, // Internal description
  caption: { type: String, default: "" },
  descriptionIt: { type: String },
  captionIt: { type: String },
  hashtags: { type: String, default: "" },
  tags: [{ type: String }],
  mediaUrls: [{ type: String }],
  scheduledAt: { type: Date, required: true },
  status: { 
    type: String, 
    enum: [
      "DRAFT",                // Initial state
      "PENDING_GRAPHIC",      // After client validates draft
      "CLIENT_REVIEW",        // After graphic creation
      "SCHEDULED",            // After client approval - appears in calendar
      "PENDING_CORRECTION",   // If client rejects
      "PUBLISHED",            // Published to platform
      "FAILED"                // Publish failed
    ], 
    default: "DRAFT" 
  },
  assignedTo: { type: String, enum: ["infographiste", "video_motion", "GRAPHIC_DESIGNER", "CLIENT"], default: "infographiste", required: false }, // Creator type
  comments: [{
    user: String,
    role: { 
      type: String, 
      enum: ["DIGITAL_MARKETER", "GRAPHIC_DESIGNER", "CLIENT", "ADMIN"],
      default: "DIGITAL_MARKETER"
    },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  publishedAt: Date,
  postUrl: String,
  statsPlatform: { type: String, enum: ["facebook", "instagram", "tiktok", "threads"] },
  externalIds: {
    igMediaId: String,
    fbPostId: String,
    tiktokVideoId: String
  },
  insights: {
    views: Number,
    likes: Number,
    comments: Number,
    shares: Number,
    saves: Number,
    engagement_rate: Number
  },
  multiPlatformStats: [{
    platform: { type: String, enum: ["instagram", "facebook", "tiktok", "youtube", "x", "snapchat", "linkedin", "threads"], required: true },
    followers: Number,
    sentiment: { type: String, enum: ["positive", "neutral", "negative"] },
    publishedAt: Date,
    postUrl: String,
    insights: {
      views: Number,
      likes: Number,
      comments: Number,
      shares: Number,
      saves: Number,
      engagement_rate: Number
    },
    sponsored: Boolean
  }],
  sentiment: {
    type: String,
    enum: ["positive", "neutral", "negative"],
    default: "neutral"
  },
  history: [{
    at: { type: Date, default: Date.now },
    action: String,
    by: String,
    note: String
  }],
  clientToken: { type: String, index: true }
}, { timestamps: true });

const Post: Model<IPost> = mongoose.models?.Post || mongoose.model<IPost>("Post", PostSchema);

export default Post;
