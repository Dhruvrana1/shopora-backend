
const pool = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendEmail } = require("../services/email.service");
const e = require("express");

const createVerificationToken = () => {
    return crypto.randomBytes(32).toString("hex");
};

const hashToken = (token) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

const requestAdminVerification = async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const result = await pool.query(
            `SELECT id, name, email, email_verified, status
             FROM admin_users
             WHERE email = $1`,
            [email]
        );

        // Don't reveal whether an admin account exists.
        if (result.rows.length === 0) {
            return res.status(200).json({
                message: "If the account exists and needs verification, an email will be sent."
            });
        }

        const admin = result.rows[0];

        if (admin.status !== "active") {
            return res.status(403).json({ message: "Admin account is disabled" });
        }

        if (admin.email_verified) {
            return res.status(200).json({ message: "Admin email is already verified" });
        }

        const token = createVerificationToken();
        const tokenHash = hashToken(token);

        await pool.query(
            `UPDATE admin_users
             SET verification_token_hash = $1,
                 verification_token_expires_at = NOW() + INTERVAL '30 minutes',
                 updated_at = NOW()
             WHERE id = $2`,
            [tokenHash, admin.id]
        );

        const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
        const verificationUrl =
            `${backendUrl}/api/admin/auth/verify-email?token=${token}`;

        await sendEmail(
            admin.email,
            "Verify your Shopora admin email",
            `<p>Hello ${admin.full_name},</p>
             <p>Click the link below to verify your Shopora admin email.
             This link expires in 30 minutes and can be used only once.</p>
             <p><a href="${verificationUrl}">Verify admin email</a></p>
             <p>If you did not expect this email, you can ignore it.</p>`
        );

        return res.status(200).json({
            message: "If the account needs verification, an email will be sent."
        });
    } catch (error) {
        console.error("Admin verification request failed:", error.message);
        return res.status(500).json({
            message: "Could not process the verification request"
        });
    }
};

// Verify an admin email using the one-time token.
const verifyAdminEmail = async (req, res) => {
    try {
        const token = req.query.token;

        if (!token || typeof token !== "string") {
            return res.status(400).send("Verification token is missing.");
        }

        const tokenHash = hashToken(token);

        const result = await pool.query(
            `UPDATE admin_users
             SET email_verified = TRUE,
                 verification_token_hash = NULL,
                 verification_token_expires_at = NULL,
                 updated_at = NOW()
             WHERE verification_token_hash = $1
               AND verification_token_expires_at > NOW()
               AND status = 'active'
             RETURNING email`,
            [tokenHash]
        );

        if (result.rows.length === 0) {
            return res.status(400).send(
                "This verification link is invalid, expired, or already used."
            );
        }

        return res.status(200).send(
            "Shopora admin email verified successfully. You can now log in."
        );
    } catch (error) {
        console.error("Admin email verification failed:", error.message);
        return res.status(500).send("Could not verify the admin email.");
    }
};

// Admin login.
const adminLogin = async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        const password = req.body.password;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const result = await pool.query(
            `SELECT id, name, email, password_hash,
                    role, status, email_verified
             FROM admin_users
             WHERE email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const admin = result.rows[0];

        const passwordMatches = await bcrypt.compare(
            password,
            admin.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        if (admin.status !== "active") {
            return res.status(403).json({
                message: "This admin account is disabled"
            });
        }

        if (!admin.email_verified) {
            return res.status(403).json({
                message: "Please verify your admin email before logging in"
            });
        }

        if (!process.env.JWT_ACCESS_SECRET) {
            throw new Error("JWT_ACCESS_SECRET is not configured");
        }

        const accessToken = jwt.sign(
    { id: admin.id, type: "admin" },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
);

const refreshToken = jwt.sign(
    { id: admin.id, type: "admin" },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
);

const refreshTokenHash = hashToken(refreshToken);

await pool.query(
    `UPDATE admin_users
     SET refresh_token_hash = $1,
         updated_at = NOW()
     WHERE id = $2`,
    [refreshTokenHash, admin.id]
);

        return res.status(200).json({
            message: "Admin login successful",
            accessToken,
            refreshToken,
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        console.error("Admin login failed:", error.message);
        return res.status(500).json({
            message: "Could not log in"
        });
    }
};


const refreshAdminToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                message: "Refresh token is required"
            });
        }

        if (!process.env.JWT_REFRESH_SECRET) {
            throw new Error("JWT_REFRESH_SECRET is not configured");
        }

        // Verify the refresh token's signature and expiry.
        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
        );

        if (decoded.type !== "admin") {
            return res.status(401).json({
                message: "Invalid refresh token"
            });
        }

        // Check that this token belongs to the current admin session.
        const result = await pool.query(
            `SELECT id, status, email_verified, refresh_token_hash
             FROM admin_users
             WHERE id = $1`,
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Admin account not found"
            });
        }

        const admin = result.rows[0];

        if (
            admin.status !== "active" ||
            !admin.email_verified ||
            !admin.refresh_token_hash ||
            hashToken(refreshToken) !== admin.refresh_token_hash
        ) {
            return res.status(401).json({
                message: "Refresh token is invalid or revoked"
            });
        }

        // Generate a new short-lived access token.
        const accessToken = jwt.sign(
            { id: admin.id, type: "admin" },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: "15m" }
        );

        return res.status(200).json({
            message: "Access token refreshed successfully",
            accessToken
        });
    } catch (error) {
        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError"
        ) {
            return res.status(401).json({
                message: "Refresh token is invalid or expired"
            });
        }

        console.error("Admin token refresh failed:", error.message);

        return res.status(500).json({
            message: "Could not refresh access token"
        });
    }
};


const getAdminProfile = async (req, res) => {
    try {
        return res.status(200).json({ admin: req.admin });
    } catch (error) {
        console.error("error in getting admin",error)
        return res.status(500).json({
            message:"internal server error"
        })
    }
};


const adminLogout = async (req,res) => {
    
    try {
        
        await pool.query(
            `UPDATE admin_users
            SET refresh_token_hash = NULL,
                updated_at = NOW()
            WHERE id = $1`,
            [req.admin.id]
        )

        return res.status(200).json({
            message:"Admin logged out successfully"
        })

    } catch (error) {
        console.error("Admin logout failed",error)
        return res.status(500).json({
            message:"internal server error"
        })
    }

}

module.exports = {
    requestAdminVerification,
    verifyAdminEmail,
    adminLogin,
    getAdminProfile,
    refreshAdminToken,
    adminLogout
};
