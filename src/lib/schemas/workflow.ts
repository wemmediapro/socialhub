import { z } from "zod";

const workflowActionCollab = z.enum([
  "VALIDATE_DRAFT",
  "VALIDATE_CREATION",
  "SUBMIT_GRAPHIC",
  "APPROVE_REVIEW",
  "APPROVE_POST",
  "REJECT_REVIEW",
  "REJECT_POST",
  "RESUBMIT_CORRECTION",
  "MARK_PUBLISHED",
  "PUBLISH",
]);

const workflowActionPost = z.enum([
  "VALIDATE_DRAFT",
  "SUBMIT_GRAPHIC",
  "APPROVE_POST",
  "REJECT_POST",
  "RESUBMIT_CORRECTION",
  "MARK_PUBLISHED",
]);

export const collaborationWorkflowSchema = z.object({
  collabId: z.string().min(1, "collabId requis"),
  action: workflowActionCollab,
  comment: z.string().optional(),
  role: z.string().optional(),
  newStatus: z.string().optional(),
});

export const postWorkflowSchema = z.object({
  postId: z.string().min(1, "postId requis"),
  action: workflowActionPost,
  comment: z.string().optional(),
  role: z.string().optional(),
});

export type CollaborationWorkflowInput = z.infer<typeof collaborationWorkflowSchema>;
export type PostWorkflowInput = z.infer<typeof postWorkflowSchema>;
