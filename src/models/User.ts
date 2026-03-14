import mongoose, { Schema, Document, Model } from "mongoose";
import { hashPassword } from "@/lib/password";

interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: "admin" | "digital_creative" | "client" | "infographiste" | "video_motion" | "influencer";
  login: string;
  password: string;
  isActive: boolean;
  lastLogin?: Date;
  avatar?: string;
  projectIds: string[];
  notifications: {
    email: boolean;
    push: boolean;
  };
}

const UserSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  role: { 
    type: String, 
    enum: ["admin", "digital_creative", "client", "infographiste", "video_motion", "influencer"], 
    required: true 
  },
  login: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  avatar: { type: String },
  projectIds: [{ type: String }], // Array of project IDs
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: false }
  }
}, { timestamps: true });

UserSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();
  this.password = hashPassword(this.password);
  next();
});

const User: Model<IUser> = mongoose.models?.User || mongoose.model<IUser>("User", UserSchema);

export default User;

