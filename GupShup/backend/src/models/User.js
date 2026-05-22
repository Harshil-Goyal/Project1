import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 40,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    birthDate: {
      type: Date,
    },
    age: {
      type: Number,
    },
    phone: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      default: "Not set",
    },
    country: {
      type: String,
      default: "India",
    },
    languages: {
      type: String,
      default: "English, Hindi",
    },
    bio: {
      type: String,
      default: "",
      maxlength: 160,
    },
    avatarColor: {
      type: String,
      default: "#3cd5b5",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    refreshTokens: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.hashPassword = function hashPassword(password) {
  return bcrypt.hash(password, 12);
};

export const User = mongoose.model("User", userSchema);
