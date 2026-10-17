
const bcrypt = require("bcrypt");
const pool = require("../config/database");
const user = require("../models/user");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../services/email.service");
const crypto = require("crypto");

const FRONTEND_URL = "http://localhost:5173";

const createSession = async (userRecord, res) => {
    const accessToken = jwt.sign(
        { id: userRecord.id },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
        { id: userRecord.email },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
    );

    const refreshTokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

    await user.saveRefreshTokenHash(userRecord.id, refreshTokenHash);

    res.cookie("refreshtoken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
    });

    return accessToken;
};


const userRegister = async (req, res) => {
    try {
        const { first_name, last_name, email, mobile, password } = req.body;

        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({
                message: "Required fields are missing",
            });
        }

        const existingUser = await user.findEmail(email);

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered",
            });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const result = await user.createUser(
            first_name,
            last_name,
            email,
            mobile,
            password_hash
        );

        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationExpires = new Date(
            Date.now() + 24 * 60 * 60 * 1000
        );

        await user.saveVerificationToken(
            email,
            verificationToken,
            verificationExpires
        );

        const backendUrl = process.env.BACKEND_URL;
        const verificationLink =
            `${backendUrl}/api/auth/verify-email?token=${verificationToken}`;

        try {
            await sendEmail(
                email,
                "Verify your Shopora account",
                `
                    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px;">
                        <h1>Welcome to Shopora!</h1>
                        <p>Thank you for creating your account.</p>
                        <p>Please verify your email address.</p>
                        <a href="${verificationLink}"
                           style="display:inline-block;padding:12px 20px;background:#2563eb;color:white;text-decoration:none;border-radius:6px;">
                            Verify My Email
                        </a>
                        <p>Thanks,<br>Team Shopora</p>
                    </div>
                `
            );

            return res.status(201).json({
                message: "Account created. Please check your email to verify it.",
                user: result,
            });
        } catch (emailError) {
            console.error("Verification email failed:", emailError.message);

            return res.status(201).json({
                message: "Account created, but the verification email could not be sent. Please try again later.",
                user: result,
                emailSent: false,
            });
        }
    } catch (error) {
        console.error("Registration failed:", error.message);

        return res.status(500).json({
            message: "Registration failed. Please try again.",
        });
    }
};

const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Required fields are empty",
            });
        }

        const emailCheck = await user.findEmail(email);

        if (!emailCheck) {
            return res.status(401).json({
                message: "No account found with this email. Please sign up first.",
            });
        }

        const passwordCheck = await bcrypt.compare(
            password,
            emailCheck.password_hash
        );

        if (!passwordCheck) {
            return res.status(401).json({
                message: "Email or password is incorrect",
            });
        }

        if (!emailCheck.email_verified) {
    return res.status(403).json({
        message: "Please verify your email before logging in."
    });
}

        const accessToken = await createSession(emailCheck, res);

        return res.status(200).json({
            message: "Login successful",
            accessToken,
        });
    } catch (error) {
        console.error("Login failed:", error);

        return res.status(500).json({
            message: "Login failed",
        });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required",
            });
        }

        const User = await user.findEmail(email);

        if (!User) {
            return res.status(404).json({
                message: "Email not found",
            });
        }

        const token = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 15 * 60 * 1000);

        await user.saveResetToken(email, token, expires);

        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

        await sendEmail(
            email,
            "Reset your password",
            `Click this link to reset your password: ${resetLink}`
        );

        return res.status(200).json({
            message: "Password reset email sent",
        });
    } catch (error) {
        console.error("Forgot password failed:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, new_password } = req.body;

        if (!token || !new_password) {
            return res.status(400).json({
                message: "Token and password are required",
            });
        }

        const User = await user.findByResetToken(token);

        if (!User) {
            return res.status(400).json({
                message: "Invalid or expired token",
            });
        }

        const password_hash = await bcrypt.hash(new_password, 10);

        const updatedUser = await user.updatePassword(
            User.id,
            password_hash
        );

        return res.status(200).json({
            message: "Password reset successful",
            user: updatedUser,
        });
    } catch (error) {
        console.error("Reset password error:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).send("Verification token is missing.");
        }

        const User = await user.findByVerificationToken(token);

        if (!User) {
            return res.status(400).send(
                "This verification link is invalid or has expired."
            );
        }

        const verifiedUser = await user.verifyUserEmail(User.id);

        if (!verifiedUser) {
            return res.status(500).send(
                "Failed to verify your email. Please try again."
            );
        }

        const accessToken = await createSession(User, res);

        // Send the access token to the frontend without putting it in the URL.
        const params = new URLSearchParams({
            verified: "true",
            accessToken,
        });

        return res.redirect(`${FRONTEND_URL}/verify-email?${params.toString()}`);
    } catch (error) {
        console.error("Email verification failed:", error);

        return res.status(500).send(
            "Email verification failed. Please try again."
        );
    }
};

const userLogout = async (req, res) => {
    try {
        await user.clearRefreshTokenHash(req.user.id);

        res.clearCookie("refreshtoken", {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            path: "/",
        });

        return res.status(200).json({
            message: "Logout successful",
        });
    } catch (error) {
        console.error("Logout failed:", error);

        return res.status(500).json({
            message: "Logout failed",
        });
    }
};

const getProfile = async (req, res) => {
    try {
        const profile = await user.getProfileById(req.user.id);

        if (!profile) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.status(200).json({
            user: profile,
        });
    } catch (error) {
        console.error("Get profile failed:", error);

        return res.status(500).json({
            message: "Failed to fetch profile",
        });
    }
};

const refreshToken = async (req, res) => {
    try {
        const token = req.cookies?.refreshtoken;

        if (!token) {
            return res.status(401).json({
                message: "Refresh token is required",
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_REFRESH_SECRET
        );

        const existingUser = await user.findEmail(decoded.id);

        if (!existingUser || !existingUser.refresh_token_hash) {
            return res.status(401).json({
                message: "Refresh token is invalid",
            });
        }

        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        if (tokenHash !== existingUser.refresh_token_hash) {
            return res.status(401).json({
                message: "Refresh token is invalid",
            });
        }

        const accessToken = jwt.sign(
            { id: existingUser.id },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: "15m" }
        );

        return res.status(200).json({ accessToken });
    } catch (error) {
        if (
            error.name === "TokenExpiredError" ||
            error.name === "JsonWebTokenError"
        ) {
            return res.status(401).json({
                message: "Refresh token is invalid or expired",
            });
        }

        console.error("Refresh token failed:", error);

        return res.status(500).json({
            message: "Failed to refresh session",
        });
    }
};

module.exports = {
    userRegister,
    userLogin,
    forgotPassword,
    resetPassword,
    verifyEmail,
    userLogout,
    getProfile,
    refreshToken,
};
