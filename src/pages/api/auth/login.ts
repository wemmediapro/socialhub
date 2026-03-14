import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import { loginSchema } from "@/lib/schemas/auth";
import { comparePassword, isHashed, hashPassword } from "@/lib/password";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.errors.map((e) => e.message).join(", ");
      return res.status(400).json({ error: msg });
    }

    const { email, password } = parsed.data;

    const user = await User.findOne({ email }).exec();
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordMatch = comparePassword(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!isHashed(user.password)) {
      user.password = hashPassword(password);
      await user.save();
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account is inactive" });
    }

    user.lastLogin = new Date();
    await user.save();

    const userData = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      projectIds: user.projectIds || [],
    };

    return res.status(200).json({
      success: true,
      user: userData,
      message: "Login successful",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return res.status(500).json({ error: message });
  }
}
