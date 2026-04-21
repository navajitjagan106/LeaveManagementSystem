import { Request, Response } from "express";
import { pool } from "../config/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { validatePassword } from "../utils/passwordValidator";
import { sendOTPEmail } from "../utils/emailService";
import crypto from "crypto";

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

        await pool.query("UPDATE otps SET used = true WHERE user_id = $1 AND used = false", [dbUser.id]);

        const code = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 

        await pool.query(
            "INSERT INTO otps (user_id, code, expires_at) VALUES ($1, $2, $3)",
            [dbUser.id, code, expiresAt]
        );

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

        const otpResult = await pool.query(
            "SELECT * FROM otps WHERE user_id = $1 AND code = $2 AND used = false AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
            [dbUser.id, code]
        );

        if (otpResult.rows.length === 0)
            return res.status(400).json({ error: "Invalid or expired OTP" });

        await pool.query("UPDATE otps SET used = true WHERE id = $1", [otpResult.rows[0].id]);

        const token = jwt.sign(
            { id: dbUser.id, role: dbUser.role, name: dbUser.name, email: dbUser.email },
            process.env.JWT_SECRET as string,
            { expiresIn: process.env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
        );

        res.json({
            token,
            user: {
                id: dbUser.id, name: dbUser.name, email: dbUser.email,
                role: dbUser.role, manager_id: dbUser.manager_id, department: dbUser.department,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "OTP verification failed" });
    }
};
