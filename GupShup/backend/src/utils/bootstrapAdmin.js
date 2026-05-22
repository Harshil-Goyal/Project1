import { env } from "../config/env.js";
import { User } from "../models/User.js";

export async function bootstrapAdmin() {
  if (!env.adminEmail || !env.adminPassword) {
    return;
  }

  const email = env.adminEmail.trim().toLowerCase();
  const existingUser = await User.findOne({ email });
  const passwordHash = await User.hashPassword(env.adminPassword);

  if (!existingUser) {
    await User.create({
      name: env.adminName || "GS Admin",
      email,
      passwordHash,
      username: "gsadmin",
      role: "admin",
    });
    return;
  }

  existingUser.name = env.adminName || existingUser.name;
  existingUser.role = "admin";
  existingUser.passwordHash = passwordHash;
  if (!existingUser.username) {
    existingUser.username = "gsadmin";
  }
  await existingUser.save();
}
