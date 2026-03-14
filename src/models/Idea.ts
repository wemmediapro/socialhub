import mongoose, { Schema, Document, Model } from "mongoose";

interface IIdeaComment {
  userId: string;
  userName: string;
  userRole: string;
  text: string;
  createdAt: Date;
}

interface IIdeaVote {
  userId: string;
  userName: string;
  vote: "upvote" | "downvote";
  votedAt: Date;
}

interface IIdeaValidatedBy {
  userId: string;
  name: string;
  validatedAt: Date;
}

interface IIdea extends Document {
  title: string;
  description: string;
  titleIt?: string;
  descriptionIt?: string;
  type: "post" | "photo_shoot" | "video_shoot" | "collaboration";
  projectIds: string[];
  status: "pending" | "in_discussion" | "validated" | "rejected" | "archived";
  createdBy: {
    userId: string;
    name: string;
    role: string;
  };
  mediaUrls: string[];
  tags: string[];
  priority: "low" | "medium" | "high";
  estimatedBudget?: number;
  estimatedDuration?: string;
  targetDate?: Date;
  comments: IIdeaComment[];
  votes: IIdeaVote[];
  validatedBy?: IIdeaValidatedBy;
  convertedToPostId?: string;
  convertedToCollabId?: string;
}

const IdeaSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  titleIt: { type: String },
  descriptionIt: { type: String },
  type: { 
    type: String, 
    enum: ["post", "photo_shoot", "video_shoot", "collaboration"], 
    required: true 
  },
  projectIds: [{ type: String }], // Can be assigned to multiple projects
  status: { 
    type: String, 
    enum: ["pending", "in_discussion", "validated", "rejected", "archived"], 
    default: "pending" 
  },
  createdBy: {
    userId: String,
    name: String,
    role: String
  },
  mediaUrls: [{ type: String }],
  tags: [{ type: String }],
  priority: { 
    type: String, 
    enum: ["low", "medium", "high"], 
    default: "medium" 
  },
  estimatedBudget: { type: Number },
  estimatedDuration: { type: String }, // "2 semaines", "1 mois", etc.
  targetDate: { type: Date },
  comments: [{
    userId: String,
    userName: String,
    userRole: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  votes: [{
    userId: String,
    userName: String,
    vote: { type: String, enum: ["upvote", "downvote"] },
    votedAt: { type: Date, default: Date.now }
  }],
  validatedBy: {
    userId: String,
    name: String,
    validatedAt: Date
  },
  convertedToPostId: { type: String }, // If idea was converted to actual post
  convertedToCollabId: { type: String } // If idea was converted to collaboration
}, { timestamps: true });

const Idea: Model<IIdea> = mongoose.models?.Idea || mongoose.model<IIdea>("Idea", IdeaSchema);

export default Idea;

