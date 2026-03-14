import mongoose, { Schema, Document, Model } from "mongoose";

interface ISocialAccount {
  network: "facebook" | "instagram" | "tiktok" | "twitter" | "linkedin" | "threads";
  accountId?: string;
  accountName?: string;
  pageId?: string;
  pageName?: string;
  accessToken?: string;
  isActive: boolean;
  connectedAt: Date;
}

interface ITeamMember {
  userId: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  addedAt: Date;
}

interface IProject extends Document {
  name: string;
  description?: string;
  client?: string;
  logo?: string;
  color: string;
  socialAccounts: ISocialAccount[];
  team: ITeamMember[];
  status: "active" | "paused" | "archived";
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  client: String,
  logo: String,
  color: { type: String, default: "#667eea" },
  
  // Réseaux sociaux associés
  socialAccounts: [{
    network: { type: String, enum: ["facebook", "instagram", "tiktok", "twitter", "linkedin", "threads"], required: true },
    accountId: String,
    accountName: String,
    pageId: String,
    pageName: String,
    accessToken: String,
    isActive: { type: Boolean, default: true },
    connectedAt: { type: Date, default: Date.now }
  }],
  
  // Membres de l'équipe
  team: [{
    userId: String,
    name: String,
    email: String,
    role: { type: String, enum: ["admin", "editor", "viewer"], default: "editor" },
    addedAt: { type: Date, default: Date.now }
  }],
  
  status: { type: String, enum: ["active", "paused", "archived"], default: "active" },
  createdBy: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Project: Model<IProject> = mongoose.models?.Project || mongoose.model<IProject>("Project", ProjectSchema);

export default Project;


