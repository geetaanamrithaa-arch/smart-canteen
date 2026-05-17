const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// ── Email transporter ─────────────────────────────────────────────────────
console.log("EMAIL_USER =", process.env.EMAIL_USER);
console.log("EMAIL_PASS =", process.env.EMAIL_PASS);
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER?.trim(),
    pass: process.env.EMAIL_PASS?.trim(),
  },
});
transporter.verify((err, success) => {
  if (err) {
    console.log("EMAIL ERROR:", err);
  } else {
    console.log("Email server ready");
  }
});

// ── Register ──────────────────────────────────────────────────────────────
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "student",
    });

    res.status(201).json({
      message: "User registered successfully",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── Login ─────────────────────────────────────────────────────────────────
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
  if (user.passwordChangedAt) {
    const changedDate = new Date(user.passwordChangedAt);
    const now = new Date();

    const diffTime = now - changedDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const changedText =
      diffDays === 0
        ? "today"
        : diffDays === 1
        ? "1 day ago"
        : `${diffDays} days ago`;

    return res.status(400).json({
      message: `Your password was changed ${changedText}. If you are using an old password, please use your latest password or reset it again.`,
    });
  }

  return res.status(400).json({ message: "Invalid credentials" });
}

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── Forgot Password ───────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    // Always return success even if user not found (security best practice)
    if (!user) {
      return res.status(200).json({
        message: "If this email is registered, a reset link has been sent.",
      });
    }

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Token expires in 1 hour
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Build reset URL — points to the frontend reset page
    const resetURL = `http://localhost:5173/reset-password/${resetToken}`;

    // Send email
    await transporter.sendMail({
      from: `"Smart Canteen" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Smart Canteen — Password Reset Link",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #34d399;">Smart Canteen</h2>
          <p>Hi ${user.name},</p>
          <p>You requested a password reset. Click the button below to set a new password:</p>
          <a href="${resetURL}"
             style="display: inline-block; padding: 12px 24px; background: #34d399;
                    color: #0f172a; text-decoration: none; border-radius: 8px;
                    font-weight: bold; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #64748b; font-size: 13px;">
            This link expires in <strong>1 hour</strong>.<br>
            If you did not request this, ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="color: #94a3b8; font-size: 12px;">Smart Canteen Queue Management Platform</p>
        </div>
      `,
    });

    res.status(200).json({
      message: "If this email is registered, a reset link has been sent.",
    });
  } catch (error) {
    console.error("forgotPassword error:", error);
    res.status(500).json({ message: "Server error while sending reset email" });
  }
};

// ── Reset Password ────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "New password is required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Find user with matching token that hasn't expired
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Reset link is invalid or has expired. Please request a new one.",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.passwordChangedAt = new Date();

    // Clear reset token fields
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.status(200).json({ message: "Password reset successfully. You can now log in." });
  } catch (error) {
    console.error("resetPassword error:", error);
    res.status(500).json({ message: "Server error while resetting password" });
  }
};

module.exports = { registerUser, loginUser, forgotPassword, resetPassword };