import mongoose, { Schema, Document, Model } from "mongoose";

interface IPlatformStat {
  platform: "instagram" | "facebook" | "tiktok" | "youtube" | "x" | "snapchat" | "linkedin" | "threads";
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
}

interface IContentUpload {
  uploadedBy: string;
  role: "INFLUENCER" | "CREATIVE" | "DIGITAL_MARKETER";
  urls: string[];
  description: string;
  uploadedAt: Date;
  validatedByClient: boolean;
  scheduledAt?: Date;
  publishedAt?: Date;
    platform?: "instagram" | "facebook" | "tiktok" | "youtube" | "x" | "snapchat" | "linkedin" | "threads";
  sentiment?: "positive" | "neutral" | "negative";
  postUrl?: string;
  insights?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
    engagement_rate?: number;
  };
  // Support multiplateforme : array de stats par plateforme
  platformStats?: IPlatformStat[];
}

interface ICollaborationComment {
  user: string;
  role: "DIGITAL_MARKETER" | "CLIENT" | "INFLUENCER" | "CREATIVE";
  text: string;
  createdAt: Date;
}

interface IDeliverable {
  title: string;
  description: string;
  dueDate: Date;
  status: "todo" | "in_progress" | "done";
}

interface IPayment {
  amount: number;
  date: Date;
  status: "pending" | "paid";
  note: string;
}

interface ICollaboration extends Document {
  influencerId: string;
  projectId: string;
  description: string;
  descriptionIt?: string;
  captionFr?: string;
  captionIt?: string;
  contentType?: "reel" | "story";
  platforms?: ("instagram" | "facebook" | "tiktok" | "youtube" | "x" | "snapchat" | "linkedin" | "threads")[];
  budget: number;
  startDate: Date;
  endDate: Date;
  status: "DRAFT" | "PENDING_GRAPHIC" | "CLIENT_REVIEW" | "SCHEDULED" | "PUBLISHED" | "PENDING_CORRECTION" | "FAILED";
  assignedTo?: string; // "INFLUENCER" | "CLIENT" | "DIGITAL_MARKETER"
  createdBy: string;
  contentUploads: IContentUpload[];
  comments: ICollaborationComment[];
  deliverables: IDeliverable[];
  payments: IPayment[];
  notes?: string;
  clientToken?: string;
  clientDecision?: string;
  clientNotes?: string;
  thread?: Array<{ author: string; text: string }>;
  history?: Array<{ action: string; by: string; note: string; at: Date }>;
  validatedByClient?: boolean;
  validatedByDigital?: boolean;
}

const CollaborationSchema = new Schema({
  influencerId: { type: String, required: true, index: true },
  projectId: { type: String, required: true, index: true },
  description: { type: String, required: true },
  descriptionIt: { type: String },
  captionFr: { type: String },
  captionIt: { type: String },
  contentType: { type: String, enum: ["reel", "story"] },
  platforms: [{ type: String, enum: ["instagram", "facebook", "tiktok", "youtube", "x", "snapchat", "linkedin", "threads"] }],
  budget: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ["DRAFT", "PENDING_GRAPHIC", "CLIENT_REVIEW", "SCHEDULED", "PUBLISHED", "PENDING_CORRECTION", "FAILED", "pending", "active", "completed", "cancelled"], // Inclure les anciens statuts temporairement pour la migration
    default: "DRAFT"
  },
  assignedTo: { type: String },
  createdBy: { type: String, default: "User" },
  validatedByClient: { type: Boolean, default: false },
  validatedByDigital: { type: Boolean, default: false },
  contentUploads: [{
    uploadedBy: String,
    role: { type: String, enum: ["INFLUENCER", "CREATIVE", "DIGITAL_MARKETER"] },
    urls: [String],
    description: String,
    uploadedAt: { type: Date, default: Date.now },
    validatedByClient: { type: Boolean, default: false },
    scheduledAt: Date,
    publishedAt: Date,
    platform: { type: String, enum: ["instagram", "facebook", "tiktok", "youtube", "x", "snapchat", "linkedin", "threads"] },
    sentiment: { type: String, enum: ["positive", "neutral", "negative"] },
    postUrl: String,
    insights: {
      views: Number,
      likes: Number,
      comments: Number,
      shares: Number,
      saves: Number,
      engagement_rate: Number
    },
    // Support multiplateforme : array de stats par plateforme
    platformStats: [{
      platform: { type: String, enum: ["instagram", "facebook", "tiktok", "youtube", "x", "snapchat", "linkedin", "threads"], required: true },
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
      }
    }]
  }],
  comments: [{
    user: String,
    role: { type: String, enum: ["DIGITAL_MARKETER", "CLIENT", "INFLUENCER", "CREATIVE"] },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  deliverables: [{
    title: String,
    description: String,
    dueDate: Date,
    status: { type: String, enum: ["todo", "in_progress", "done"], default: "todo" }
  }],
  payments: [{
    amount: Number,
    date: Date,
    status: { type: String, enum: ["pending", "paid"], default: "pending" },
    note: String
  }],
  notes: String,
  clientToken: { type: String, index: true },
  clientDecision: String,
  clientNotes: String,
  thread: [{
    author: String,
    text: String
  }],
  history: [{
    action: String,
    by: String,
    note: String,
    at: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Supprimer le modèle existant pour forcer la réutilisation du nouveau schéma
// Cela garantit que les nouvelles valeurs enum sont utilisées
const modelName = "Collaboration";
if (mongoose.models?.[modelName]) {
  delete (mongoose.models as any)[modelName];
}

// Créer le modèle avec le nouveau schéma
const Collaboration: Model<ICollaboration> = mongoose.model<ICollaboration>(modelName, CollaborationSchema);

export default Collaboration;
