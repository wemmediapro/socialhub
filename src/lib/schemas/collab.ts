import { z } from "zod";

export const threadPostSchema = z.object({
  collabId: z.string().min(1, "collabId requis"),
  author: z.string().min(1, "author requis"),
  text: z.string().min(1, "text requis"),
});

export const clientDecisionSchema = z.object({
  token: z.string().min(1, "token requis"),
  collabId: z.string().min(1, "collabId requis"),
  decision: z.string().optional(),
  note: z.string().optional(),
});

export const clientValidateSchema = z.object({
  token: z.string().min(1, "token requis"),
  postId: z.string().min(1, "postId requis"),
  action: z.enum(["approve", "reject"]).optional(),
  comment: z.string().optional(),
});

export type ThreadPostInput = z.infer<typeof threadPostSchema>;
export type ClientDecisionInput = z.infer<typeof clientDecisionSchema>;
export type ClientValidateInput = z.infer<typeof clientValidateSchema>;
