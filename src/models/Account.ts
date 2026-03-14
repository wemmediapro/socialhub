import mongoose, { Schema, Document, Model } from "mongoose";

interface IAccount extends Document {
  projectId?: string;
  network: "facebook" | "instagram" | "tiktok" | "threads";
  pageId?: string;
  igUserId?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresAt?: Date;
  extra?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

const AccountSchema = new Schema({
  projectId: { type: String, index: true },
  network: { type: String, enum: ["facebook","instagram","tiktok","threads"], required: true },
  pageId: String,
  igUserId: String,
  accessToken: String,
  refreshToken: String,
  tokenType: String,
  expiresAt: Date,
  extra: Schema.Types.Mixed
}, { timestamps: true });

const Account: Model<IAccount> = mongoose.models?.Account || mongoose.model<IAccount>("Account", AccountSchema);

export default Account;
