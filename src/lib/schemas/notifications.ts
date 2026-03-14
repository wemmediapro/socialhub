import { z } from "zod";

const notificationTypeEnum = z.enum([
  "POST_CREATED", "CONTENT_UPLOADED", "CLIENT_VALIDATED", "POST_SCHEDULED",
  "POST_PUBLISHED", "CLIENT_REJECTED", "COMMENT_ADDED", "COLLAB_CREATED",
  "COLLAB_CONTENT_UPLOADED", "COLLAB_VALIDATED", "DEADLINE_APPROACHING", "MENTION"
]);
const userRoleEnum = z.enum(["digital_creative", "client", "infographiste", "video_motion", "influencer"]);
const priorityEnum = z.enum(["low", "medium", "high"]);

export const createNotificationSchema = z.object({
  userId: z.string().min(1, "userId requis"),
  userRole: userRoleEnum,
  type: notificationTypeEnum,
  title: z.string().min(1, "title requis"),
  message: z.string().min(1, "message requis"),
  link: z.string().optional(),
  relatedPostId: z.string().optional(),
  relatedCollabId: z.string().optional(),
  relatedProjectId: z.string().optional(),
  isRead: z.boolean().optional(),
  priority: priorityEnum.optional(),
});

export const markAllReadSchema = z.object({
  userId: z.string().min(1, "userId requis"),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type MarkAllReadInput = z.infer<typeof markAllReadSchema>;
