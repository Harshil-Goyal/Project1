import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { completeProfileSchema } from "../validators/authSchemas.js";

const USERNAME_REGEX = /^(?=.{3,20}$)(?!.*[._]{2})[a-z0-9](?:[a-z0-9._]*[a-z0-9])?$/;

function calculateAge(birthDate) {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
}

function serializeUser(user) {
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

export const completeProfile = asyncHandler(async (req, res) => {
  const parsed = completeProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Invalid profile data", 400);
  }

  const { personalUsername, birthDate } = parsed.data;
  const cleanUsername = String(personalUsername || "").trim().toLowerCase();

  if (!USERNAME_REGEX.test(cleanUsername)) {
    throw new AppError("Use 3-20 chars: lowercase letters, numbers, . or _, without spaces", 400);
  }

  const existingUser = await User.findOne({
    username: cleanUsername,
    _id: { $ne: req.user.id },
  });
  if (existingUser) {
    throw new AppError("Username is already taken. Try a different one.", 409);
  }

  const parsedBirthDate = new Date(String(birthDate || ""));
  if (Number.isNaN(parsedBirthDate.getTime())) {
    throw new AppError("Invalid date selected", 400);
  }

  const age = calculateAge(parsedBirthDate);
  if (age < 13) {
    throw new AppError("You must be at least 13 years old", 400);
  }

  req.user.username = cleanUsername;
  req.user.birthDate = parsedBirthDate;
  req.user.age = age;
  await req.user.save();

  res.json({
    message: "Profile completed successfully",
    user: serializeUser(req.user),
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const {
    name,
    username,
    email,
    phone,
    gender,
    country,
    languages,
    bio,
    avatarColor,
    birthDate,
  } = req.body;

  if (typeof name === "string" && name.trim()) {
    req.user.name = name.trim();
  }

  if (typeof username === "string") {
    const cleanUsername = username.trim().toLowerCase();
    if (!USERNAME_REGEX.test(cleanUsername)) {
      throw new AppError("Use 3-20 characters (letters, numbers, underscore, dot).", 400);
    }
    const existingUser = await User.findOne({
      username: cleanUsername,
      _id: { $ne: req.user.id },
    });
    if (existingUser) {
      throw new AppError("Username is already taken. Try a different one.", 409);
    }
    req.user.username = cleanUsername;
  }

  if (typeof email === "string" && email.trim()) {
    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({
      email: cleanEmail,
      _id: { $ne: req.user.id },
    });
    if (existingUser) {
      throw new AppError("Account already exists for this email", 409);
    }
    req.user.email = cleanEmail;
  }

  if (typeof phone === "string") req.user.phone = phone.trim();
  if (typeof gender === "string") req.user.gender = gender.trim() || "Not set";
  if (typeof country === "string") req.user.country = country.trim() || "India";
  if (typeof languages === "string") req.user.languages = languages.trim() || "English, Hindi";
  if (typeof bio === "string") req.user.bio = bio.slice(0, 160);
  if (typeof avatarColor === "string") req.user.avatarColor = avatarColor;

  if (typeof birthDate === "string" && birthDate.trim()) {
    const parsedBirthDate = new Date(birthDate);
    if (Number.isNaN(parsedBirthDate.getTime())) {
      throw new AppError("Invalid date selected", 400);
    }
    const age = calculateAge(parsedBirthDate);
    if (age < 13) {
      throw new AppError("You must be at least 13 years old", 400);
    }
    req.user.birthDate = parsedBirthDate;
    req.user.age = age;
  }

  await req.user.save();

  res.json({
    message: "Profile updated successfully",
    user: serializeUser(req.user),
  });
});
