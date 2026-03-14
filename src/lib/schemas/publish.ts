import { z } from "zod";

export const enqueueSchema = z.object({
  postId: z.string().min(1, "postId requis"),
  runAt: z.union([z.string().datetime(), z.coerce.date(), z.number()]).transform((v) => (typeof v === "number" ? new Date(v) : new Date(v))),
});

export type EnqueueInput = z.infer<typeof enqueueSchema>;
