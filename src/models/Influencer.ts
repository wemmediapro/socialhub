import mongoose, { Schema, Document, Model } from "mongoose";

interface IPlatform {
  network: "instagram" | "tiktok" | "facebook" | "youtube" | "x" | "snapchat" | "linkedin" | "threads" | "other";
  handle?: string;
  url?: string;
  followers?: number;
  avgViews?: number;
  avgEngagementRate?: number;
}

interface IRates {
  story?: number;
  post?: number;
  reel?: number;
  tiktok?: number;
  package?: number;
  currency: string;
}

interface IInfluencer extends Document {
  projectId?: string;
  name: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  platforms: IPlatform[];
  niches: string[];
  country?: string;
  city?: string;
  targetMarket?: string;
  languages: string[];
  rates: IRates;
  portfolioUrls: string[];
  notes?: string;
  notesIt?: string;
  status: "pending" | "active" | "inactive";
  invitedAt?: Date;
  invitedToProjectId?: string;
}

const InfluencerSchema = new Schema({
  projectId: { type: String, index: true },
  name: { type: String, required: true },
  avatarUrl: String,
  email: String,
  phone: String,
  platforms: [{
    network: { type: String, enum: ["instagram","tiktok","facebook","youtube","x","snapchat","linkedin","threads","other"] },
    handle: String,
    url: String,
    followers: Number,
    avgViews: Number,
    avgEngagementRate: Number
  }],
  niches: [String],
  country: String,
  city: String,
  targetMarket: String,
  languages: [String],
  rates: {
    story: Number,
    post: Number,
    reel: Number,
    tiktok: Number,
    package: Number,
    currency: { type: String, default: "EUR" }
  },
  portfolioUrls: [String],
  notes: String,
  notesIt: String,
  status: { type: String, enum: ["pending", "active", "inactive"], default: "active" },
  invitedAt: Date,
  invitedToProjectId: String,
}, { timestamps: true });

const Influencer: Model<IInfluencer> = mongoose.models?.Influencer || mongoose.model<IInfluencer>("Influencer", InfluencerSchema);

export default Influencer;
