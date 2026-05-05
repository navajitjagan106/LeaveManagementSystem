import { Request, Response } from "express";
import { pool } from "../config/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { validatePassword } from "../utils/passwordValidator";
import { sendOTPEmail } from "../utils/emailService";
import crypto from "crypto";
import redis from "../config/redis";
import { setAuthCookies } from "../utils/authUtils";
import { fetchUserPermissions } from "../utils/permissionUtils";

const OTP_TTL = 600; // 10 minutes in seconds



export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0) {
            console.warn(`LOGIN ATTEMPT FAILED: User not found - ${email}`);
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const dbUser = result.rows[0];

        const isMatch = await bcrypt.compare(password, dbUser.password);
        if (!isMatch) {
            console.warn(`LOGIN ATTEMPT FAILED: Password mismatch - ${email}`);
            return res.status(400).json({ error: "Invalid credentials" });
        }

        if (!dbUser.email_verified)
            return res.status(403).json({ error: "You have a pending invitation. Please accept it via the email link before logging in." });

        const code = crypto.randomInt(100000, 999999).toString();
        // Overwrites any existing OTP for this user; expires automatically after 10 min
        await redis.setex(`otp:${dbUser.id}`, OTP_TTL, code);

        await sendOTPEmail({ email: dbUser.email, name: dbUser.name, code });

        res.json({ step: "otp_required", email: dbUser.email });
    } catch (err) {
        console.error("LOGIN ERROR:", err);
        res.status(500).json({ error: "Login failed", details: err instanceof Error ? err.message : String(err) });
    }
};

export const verifyOtp = async (req: Request, res: Response) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) return res.status(400).json({ error: "Email and OTP are required" });

        const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userResult.rows.length === 0)
            return res.status(400).json({ error: "Invalid request" });

        const dbUser = userResult.rows[0];

        const storedCode = await redis.get(`otp:${dbUser.id}`);
        
        console.log(`VERIFYING OTP: user=${dbUser.email}, provided=${code}, stored=${storedCode}`);

        if (!storedCode || storedCode.toString().trim() !== code.toString().trim()) {
            console.warn(`OTP VERIFICATION FAILED: user=${dbUser.email}`);
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        await redis.del(`otp:${dbUser.id}`);

        const token = jwt.sign(
            { id: dbUser.id, role: dbUser.role, name: dbUser.name, email: dbUser.email },
            process.env.JWT_SECRET as string,
            { expiresIn: process.env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
        );

        const permissions = await fetchUserPermissions(dbUser.id);

        const user = {
            id: dbUser.id, name: dbUser.name, email: dbUser.email,
            role: dbUser.role, manager_id: dbUser.manager_id, department: dbUser.department,
            permissions,
        };

        setAuthCookies(res, token);
        res.json({ success: true, user });
    } catch (err) {
        console.error("OTP VERIFY ERROR:", err);
        res.status(500).json({ error: "OTP verification failed", details: err instanceof Error ? err.message : String(err) });
    }
};

export const getMe = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        
        const userResult = await pool.query(
            `SELECT u.id, u.name, u.email, u.role, u.department, u.phone, u.gender, u.date_of_birth, u.location,
             m.name AS manager_name, p.name AS policy_name
             FROM users u
             LEFT JOIN users m ON u.manager_id = m.id
             LEFT JOIN leave_policies p ON u.policy_id = p.id
             WHERE u.id = $1`,
            [req.user.id]
        );

        if (userResult.rows.length === 0) return res.status(404).json({ error: "User not found" });

        const permissions = await fetchUserPermissions(req.user.id);
        res.json({ success: true, data: { ...userResult.rows[0], permissions } });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch user data" });
    }
};

export const logout = (req: Request, res: Response) => {
    res.clearCookie("token", { path: "/", httpOnly: true, sameSite: "lax" });
    res.json({ success: true });
};
