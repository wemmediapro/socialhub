import mongoose, { Schema, Document, Model } from "mongoose";

interface INotification extends Document {
  userId: string;
  userRole: "digital_creative" | "client" | "infographiste" | "video_motion" | "influencer";
  type: "POST_CREATED" | "CONTENT_UPLOADED" | "CLIENT_VALIDATED" | "POST_SCHEDULED" | "POST_PUBLISHED" | "CLIENT_REJECTED" | "COMMENT_ADDED" | "COLLAB_CREATED" | "COLLAB_CONTENT_UPLOADED" | "COLLAB_VALIDATED" | "DEADLINE_APPROACHING" | "MENTION";
  title: string;
  message: string;
  link?: string;
  relatedPostId?: string;
  relatedCollabId?: string;
  relatedProjectId?: string;
  isRead: boolean;
  readAt?: Date;
  priority: "low" | "medium" | "high";
}

const NotificationSchema = new Schema({
  userId: { type: String, required: true, index: true }, // User to notify
  userRole: { 
    type: String, 
    enum: ["digital_creative", "client", "infographiste", "video_motion", "influencer"], 
    required: true 
  },
  type: { 
    type: String, 
    enum: [
      "POST_CREATED",           // Post créé, notifier créateur
      "CONTENT_UPLOADED",       // Contenu uploadé, notifier client
      "CLIENT_VALIDATED",       // Client a validé, notifier digital creative
      "POST_SCHEDULED",         // Post planifié, notifier tous
      "POST_PUBLISHED",         // Post publié, notifier tous
      "CLIENT_REJECTED",        // Client a rejeté, notifier créateur
      "COMMENT_ADDED",          // Commentaire ajouté
      "COLLAB_CREATED",         // Collaboration créée, notifier influenceur
      "COLLAB_CONTENT_UPLOADED",// Influenceur a uploadé, notifier client
      "COLLAB_VALIDATED",       // Client a validé collab
      "DEADLINE_APPROACHING",   // Deadline proche
      "MENTION"                 // Mentionné dans commentaire
    ], 
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String }, // URL to redirect when clicked
  relatedPostId: { type: String },
  relatedCollabId: { type: String },
  relatedProjectId: { type: String },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" }
}, { timestamps: true });

// Index for quick queries
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });

const Notification: Model<INotification> = mongoose.models?.Notification || mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;

