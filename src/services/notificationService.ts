import axios from 'axios';
import { sendNotificationEmail } from './emailService';

type NotificationType = 
  | "POST_CREATED"
  | "CONTENT_UPLOADED"
  | "CLIENT_VALIDATED"
  | "POST_SCHEDULED"
  | "POST_PUBLISHED"
  | "CLIENT_REJECTED"
  | "COMMENT_ADDED"
  | "COLLAB_CREATED"
  | "COLLAB_CONTENT_UPLOADED"
  | "COLLAB_VALIDATED"
  | "DEADLINE_APPROACHING"
  | "MENTION";

type CreateNotificationParams = {
  userId: string;
  userRole: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  relatedPostId?: string;
  relatedCollabId?: string;
  relatedProjectId?: string;
  priority?: "low" | "medium" | "high";
  userEmail?: string;
  userName?: string;
  emailData?: any;
};

export async function createNotification(params: CreateNotificationParams) {
  try {
    // Create in-app notification
    await axios.post('/api/notifications', {
      userId: params.userId,
      userRole: params.userRole,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      relatedPostId: params.relatedPostId,
      relatedCollabId: params.relatedCollabId,
      relatedProjectId: params.relatedProjectId,
      priority: params.priority || "medium"
    });

    // Send email notification if user email provided
    if (params.userEmail && params.userName) {
      await sendNotificationEmail(
        params.userEmail,
        params.userName,
        params.type,
        {
          ...params.emailData,
          link: params.link,
          title: params.title,
          message: params.message
        }
      );
    }
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

// Helper functions for common notifications

export async function notifyPostCreated(
  creatorId: string, 
  creatorRole: string, 
  postId: string, 
  postDescription: string,
  creatorEmail?: string,
  creatorName?: string,
  scheduledDate?: string
) {
  await createNotification({
    userId: creatorId,
    userRole: creatorRole,
    type: "POST_CREATED",
    title: "📝 Nouveau post à créer",
    message: `Un nouveau post vous a été assigné : "${postDescription}"`,
    link: `/workflow`,
    relatedPostId: postId,
    priority: "high",
    userEmail: creatorEmail,
    userName: creatorName,
    emailData: { postDescription, scheduledDate }
  });
}

export async function notifyContentUploaded(
  clientId: string, 
  postId: string, 
  postDescription: string, 
  creatorName: string,
  clientEmail?: string,
  clientName?: string
) {
  await createNotification({
    userId: clientId,
    userRole: "client",
    type: "CONTENT_UPLOADED",
    title: "📤 Nouveau contenu à valider",
    message: `${creatorName} a uploadé le contenu pour "${postDescription}". Validation requise.`,
    link: `/workflow`,
    relatedPostId: postId,
    priority: "high",
    userEmail: clientEmail,
    userName: clientName,
    emailData: { postDescription, creatorName }
  });
}

export async function notifyClientValidated(
  creatorId: string, 
  creatorRole: string, 
  postId: string, 
  postDescription: string,
  creatorEmail?: string,
  creatorName?: string
) {
  await createNotification({
    userId: creatorId,
    userRole: creatorRole,
    type: "CLIENT_VALIDATED",
    title: "✅ Contenu validé !",
    message: `Le client a validé votre contenu pour "${postDescription}"`,
    link: `/workflow`,
    relatedPostId: postId,
    priority: "medium",
    userEmail: creatorEmail,
    userName: creatorName,
    emailData: { postDescription }
  });
}

export async function notifyClientRejected(
  creatorId: string, 
  creatorRole: string, 
  postId: string, 
  postDescription: string, 
  reason?: string,
  creatorEmail?: string,
  creatorName?: string
) {
  await createNotification({
    userId: creatorId,
    userRole: creatorRole,
    type: "CLIENT_REJECTED",
    title: "❌ Correction demandée",
    message: `Le client demande une correction pour "${postDescription}". ${reason || ""}`,
    link: `/workflow`,
    relatedPostId: postId,
    priority: "high",
    userEmail: creatorEmail,
    userName: creatorName,
    emailData: { postDescription, reason }
  });
}

export async function notifyPostScheduled(userIds: string[], postId: string, postDescription: string, scheduledDate: string) {
  for (const userId of userIds) {
    await createNotification({
      userId,
      userRole: "digital_creative", // Can be dynamic
      type: "POST_SCHEDULED",
      title: "📅 Post planifié",
      message: `"${postDescription}" sera publié le ${new Date(scheduledDate).toLocaleDateString()}`,
      link: `/calendar`,
      relatedPostId: postId,
      priority: "low"
    });
  }
}

export async function notifyPostPublished(userIds: string[], postId: string, postDescription: string, reach?: number) {
  for (const userId of userIds) {
    await createNotification({
      userId,
      userRole: "digital_creative",
      type: "POST_PUBLISHED",
      title: "🚀 Post publié !",
      message: `"${postDescription}" a été publié avec succès${reach ? ` • Reach: ${reach}` : ""}`,
      link: `/workflow`,
      relatedPostId: postId,
      priority: "medium"
    });
  }
}

export async function notifyCommentAdded(userId: string, userRole: string, postId: string, commenterName: string, comment: string) {
  await createNotification({
    userId,
    userRole,
    type: "COMMENT_ADDED",
    title: "💬 Nouveau commentaire",
    message: `${commenterName} : "${comment.substring(0, 50)}${comment.length > 50 ? "..." : ""}"`,
    link: `/workflow`,
    relatedPostId: postId,
    priority: "medium"
  });
}

export async function notifyCollabCreated(influencerId: string, collabId: string, projectName: string, budget: number) {
  await createNotification({
    userId: influencerId,
    userRole: "influencer",
    type: "COLLAB_CREATED",
    title: "🤝 Nouvelle collaboration",
    message: `Vous avez été invité à collaborer sur "${projectName}" • Budget: ${budget}€`,
    link: `/collab`,
    relatedCollabId: collabId,
    priority: "high"
  });
}

export async function notifyCollabContentUploaded(clientId: string, collabId: string, influencerName: string) {
  await createNotification({
    userId: clientId,
    userRole: "client",
    type: "COLLAB_CONTENT_UPLOADED",
    title: "📤 Contenu influenceur à valider",
    message: `${influencerName} a uploadé du contenu pour validation`,
    link: `/collab`,
    relatedCollabId: collabId,
    priority: "high"
  });
}

export async function notifyDeadlineApproaching(userId: string, userRole: string, postId: string, postDescription: string, daysLeft: number) {
  await createNotification({
    userId,
    userRole,
    type: "DEADLINE_APPROACHING",
    title: "⏰ Deadline proche",
    message: `"${postDescription}" doit être prêt dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}`,
    link: `/workflow`,
    relatedPostId: postId,
    priority: "high"
  });
}

