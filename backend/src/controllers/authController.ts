import { Request, Response } from "express";
import { pool } from "../config/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { validatePassword } from "../utils/passwordValidator";
import { sendOTPEmail } from "../utils/emailService";
import crypto from "crypto";
import redis from "../config/redis";

const OTP_TTL = 600; // 10 minutes in seconds
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
const isProduction = process.env.NODE_ENV === "production";

const setAuthCookies = (res: Response, token: string, user: object) => {
    res.cookie("token", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
        path: "/",
    });
    res.cookie("user", JSON.stringify(user), {
        httpOnly: false,
        secure: isProduction,
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
        path: "/",
    });
};

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role } = req.body;
        const validation = validatePassword(password);
        if (!validation.valid) return res.status(400).json({ error: validation.errors.join(", ") });
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO users (name, email, password, role, email_verified) VALUES ($1, $2, $3, $4, true) RETURNING id, name, email, role`,
            [name, email, hashedPassword, role || "employee"]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Registration failed" });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0)
            return res.status(400).json({ error: "Invalid credentials" });

        const dbUser = result.rows[0];

        const isMatch = await bcrypt.compare(password, dbUser.password);
        if (!isMatch)
            return res.status(400).json({ error: "Invalid credentials" });

        if (!dbUser.email_verified)
            return res.status(403).json({ error: "You have a pending invitation. Please accept it via the email link before logging in." });

        const code = crypto.randomInt(100000, 999999).toString();
        // Overwrites any existing OTP for this user; expires automatically after 10 min
        await redis.setex(`otp:${dbUser.id}`, OTP_TTL, code);

        await sendOTPEmail({ email: dbUser.email, name: dbUser.name, code });

        res.json({ step: "otp_required", email: dbUser.email });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Login failed" });
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
        if (!storedCode || storedCode !== code)
            return res.status(400).json({ error: "Invalid or expired OTP" });

        await redis.del(`otp:${dbUser.id}`);

        const token = jwt.sign(
            { id: dbUser.id, role: dbUser.role, name: dbUser.name, email: dbUser.email },
            process.env.JWT_SECRET as string,
            { expiresIn: process.env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
        );

        const permResult = await pool.query(
            `SELECT page_key, can_view, can_edit, can_delete
             FROM user_page_permissions WHERE user_id = $1`,
            [dbUser.id]
        );
        const permissions: Record<string, { can_view: boolean; can_edit: boolean; can_delete: boolean }> = {};
        permResult.rows.forEach((p) => {
            permissions[p.page_key] = { can_view: p.can_view, can_edit: p.can_edit, can_delete: p.can_delete };
        });

        const user = {
            id: dbUser.id, name: dbUser.name, email: dbUser.email,
            role: dbUser.role, manager_id: dbUser.manager_id, department: dbUser.department,
            permissions,
        };

        setAuthCookies(res, token, user);
        res.json({ success: true, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "OTP verification failed" });
    }
};

export const logout = (req: Request, res: Response) => {
    res.clearCookie("token", { path: "/", httpOnly: true, sameSite: "lax" });
    res.clearCookie("user", { path: "/", sameSite: "lax" });
    res.json({ success: true });
};
