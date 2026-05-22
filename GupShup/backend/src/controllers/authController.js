import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/token.js";
import { changePasswordSchema, loginSchema, registerSchema } from "../validators/authSchemas.js";
import { verifyIdToken } from "../config/firebase.js";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username || "",
    age: user.age || null,
    birthDate: user.birthDate || null,
    phone: user.phone || "",
    gender: user.gender || "Not set",
    country: user.country || "India",
    languages: user.languages || "English, Hindi",
    bio: user.bio || "",
    avatarColor: user.avatarColor || "#3cd5b5",
    role: user.role,
    profileCompleted: Boolean(user.username && user.birthDate && user.age),
    createdAt: user.createdAt,
  };
}

async function issueAuthPayload(user) {
  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);
  user.refreshTokens = [...user.refreshTokens, refreshToken].slice(-5);
  await user.save();

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(user),
  };
}

export const register = asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Please provide valid signup details", 400);
  }

  const { username, email, password } = parsed.data;
  const cleanName = String(username || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPassword = String(password || "");

  if (!cleanName || !cleanEmail || !cleanPassword) {
    throw new AppError("All fields are required", 400);
  }

  if (cleanName.length < 2 || cleanName.length > 40) {
    throw new AppError("Name must be 2-40 characters", 400);
  }

  if (!isValidEmail(cleanEmail)) {
    throw new AppError("Email is invalid", 400);
  }

  if (!isStrongPassword(cleanPassword)) {
    throw new AppError("Password must be at least 8 characters, include uppercase, lowercase, number and special character", 400);
  }

  const existingUser = await User.findOne({ email: cleanEmail });
  if (existingUser) {
    throw new AppError("Account already exists for this email", 409);
  }

  const passwordHash = await User.hashPassword(cleanPassword);
  const user = await User.create({
    name: cleanName,
    email: cleanEmail,
    passwordHash,
  });

  const payload = await issueAuthPayload(user);
  res.status(201).json(payload);
});

export const login = asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("All fields are required", 400);
  }

  const { identifier, password } = parsed.data;
  const cleanIdentifier = String(identifier || "").trim().toLowerCase();
  const cleanPassword = String(password || "");

  if (!cleanIdentifier || !cleanPassword) {
    throw new AppError("All fields are required", 400);
  }

  const user = await User.findOne({
    $or: [{ email: cleanIdentifier }, { username: cleanIdentifier }],
  });

  if (!user || !(await user.comparePassword(cleanPassword))) {
    throw new AppError("Invalid username/email or password", 401);
  }

  const payload = await issueAuthPayload(user);
  res.json(payload);
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError("Refresh token is required", 400);
  }

  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.sub);

  if (!user || !user.refreshTokens.includes(refreshToken)) {
    throw new AppError("Invalid refresh token", 401);
  }

  user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
  const authPayload = await issueAuthPayload(user);
  res.json(authPayload);
});

export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.sub);
    if (user) {
      user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
      await user.save();
    }
  }

  res.json({ message: "Logged out successfully" });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

export const changePassword = asyncHandler(async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Please provide valid password details", 400);
  }

  const { currentPassword, newPassword, confirmPassword } = parsed.data;

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new AppError("Fill all password fields.", 400);
  }

  if (!isStrongPassword(newPassword)) {
    throw new AppError("New password must be at least 8 characters, include uppercase, lowercase, number and special character", 400);
  }

  if (newPassword !== confirmPassword) {
    throw new AppError("New password and confirm password do not match.", 400);
  }

  const matches = await req.user.comparePassword(currentPassword);
  if (!matches) {
    throw new AppError("Current password is incorrect.", 401);
  }

  req.user.passwordHash = await User.hashPassword(newPassword);
  await req.user.save();

  res.json({ message: "Password updated successfully." });
});

export const googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    throw new AppError("ID Token is required", 400);
  }

  try {
    const decodedToken = await verifyIdToken(idToken);
    const { email, name, picture } = decodedToken;

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Generate a unique username from email
      const baseUsername = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      let generatedUsername = baseUsername;
      let counter = 1;
      
      // Check for username collision
      while (await User.findOne({ username: generatedUsername })) {
        generatedUsername = `${baseUsername}${counter}`;
        counter++;
      }

      // Auto-create user if they don't exist
      user = await User.create({
        name: name || email.split("@")[0] || "GupShup User",
        email: email.toLowerCase(),
        username: generatedUsername,
        passwordHash: await User.hashPassword(Math.random().toString(36).slice(-10) + "A1!"),
      });
    }

    const payload = await issueAuthPayload(user);
    res.json(payload);
  } catch (err) {
    console.error("Firebase Verify Error:", err);
    throw new AppError(`Google Authentication failed: ${err.message}`, 401);
  }
});
