import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const connectAccountSchema = z.object({
  platform: z.string().min(1, "platform requis"),
  accountName: z.string().optional(),
  accessToken: z.string().optional(),
  userId: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ConnectAccountInput = z.infer<typeof connectAccountSchema>;
