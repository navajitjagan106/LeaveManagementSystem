import { Request, Response } from "express";
import { pool } from "../config/db";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { sendInvitationEmail } from "../utils/emailService";

const TOKEN_EXPIRY_HOURS = 48;

export const sendInvitation = async (req: Request, res: Response) => {
    try {
        const { name, email, role, department, manager_id, policy_id } = req.body;
        const invitedBy = (req as any).user.id;

        if (!name || !email || !role)
            return res.status(400).json({ error: "Name, email and role are required" });

        const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
        if (existing.rows.length > 0)
            return res.status(400).json({ error: "A user with this email already exists" });

        const existingInv = await pool.query(
            "SELECT id FROM invitations WHERE email = $1 AND status = 'pending'", [email]
        );
        if (existingInv.rows.length > 0)
            return res.status(400).json({ error: "A pending invitation already exists for this email" });

        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

        const result = await pool.query(
            `INSERT INTO invitations (name, email, role, department, manager_id, policy_id, token, expires_at, invited_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [name, email, role, department || null, manager_id || null, policy_id || null, token, expiresAt, invitedBy]
        );

        const inviter = await pool.query("SELECT name FROM users WHERE id = $1", [invitedBy]);
        const inviterName = inviter.rows[0]?.name || "Admin";
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

        await sendInvitationEmail({name, email, token, inviterName, role, frontendUrl });

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to send invitation" });
    }
};

export const getInvitations = async (req: Request, res: Response) => {
    try {
        const { status } = req.query;
        let query = `SELECT i.*, u.name as invited_by_name FROM invitations i
                    LEFT JOIN users u ON i.invited_by = u.id`;
        const values: any[] = [];
        if (status) { query += " WHERE i.status = $1"; values.push(status); }
        query += " ORDER BY i.created_at DESC";
        const result = await pool.query(query, values);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch invitations" });
    }
};

export const resendInvitation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const invitedBy = (req as any).user.id;

        const inv = await pool.query("SELECT * FROM invitations WHERE id = $1", [id]);
        if (inv.rows.length === 0) return res.status(404).json({ error: "Invitation not found" });

        const invitation = inv.rows[0];
        if (invitation.status !== "pending")
            return res.status(400).json({ error: "Can only resend pending invitations" });

        const newToken = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

        await pool.query("UPDATE invitations SET token = $1, expires_at = $2 WHERE id = $3",
            [newToken, expiresAt, id]);

        const inviter = await pool.query("SELECT name FROM users WHERE id = $1", [invitedBy]);
        const inviterName = inviter.rows[0]?.name || "Admin";
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

        await sendInvitationEmail({
            name:invitation.name,
            email: invitation.email, token: newToken,
            inviterName, role: invitation.role, frontendUrl,
        });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to resend invitation" });
    }
};

export const cancelInvitation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const inv = await pool.query("SELECT * FROM invitations WHERE id = $1", [id]);
        if (inv.rows.length === 0) return res.status(404).json({ error: "Invitation not found" });
        if (inv.rows[0].status !== "pending")
            return res.status(400).json({ error: "Can only cancel pending invitations" });

        await pool.query("UPDATE invitations SET status = 'cancelled' WHERE id = $1", [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to cancel invitation" });
    }
};

export const getInvitationByToken = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const result = await pool.query(
            "SELECT name, email, role, department FROM invitations WHERE token = $1 AND status = 'pending' AND expires_at > NOW()",
            [token]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ error: "Invitation not found or expired" });
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch invitation" });
    }
};

export const acceptInvitation = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password) return res.status(400).json({ error: "Password is required" });

        const { validatePassword } = await import("../utils/passwordValidator");
        const validation = validatePassword(password);
        if (!validation.valid) return res.status(400).json({ error: validation.errors.join(", ") });

        const inv = await pool.query(
            "SELECT * FROM invitations WHERE token = $1 AND status = 'pending' AND expires_at > NOW()",
            [token]
        );
        if (inv.rows.length === 0)
            return res.status(400).json({ error: "Invitation not found or expired" });

        const invitation = inv.rows[0];

        const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [invitation.email]);
        if (existingUser.rows.length > 0)
            return res.status(400).json({ error: "Account already exists for this email" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const userResult = await pool.query(
            `INSERT INTO users (name, email, password, role, department, manager_id, policy_id, email_verified)
            VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING id, name, email, role, department, manager_id`,
            [invitation.name, invitation.email, hashedPassword, invitation.role,
            invitation.department, invitation.manager_id, invitation.policy_id || null]
        );

        await pool.query(
            "UPDATE invitations SET status = 'accepted', accepted_at = NOW() WHERE id = $1",
            [invitation.id]
        );

        const userId = userResult.rows[0].id;

        if (invitation.policy_id) {
            const rules = await pool.query(
                "SELECT leave_type_id, total_allocated FROM leave_policy_rules WHERE policy_id = $1",
                [invitation.policy_id]
            );
            for (const rule of rules.rows) {
                await pool.query(
                    `INSERT INTO leave_balances (user_id, leave_type_id, total_allocated, used) VALUES ($1, $2, $3, 0)`,
                    [userId, rule.leave_type_id, rule.total_allocated]
                );
            }
        }

        const jwt = await import("jsonwebtoken");
        const newUser = userResult.rows[0];
        const jwtToken = jwt.sign(
            { id: newUser.id, role: newUser.role, name: newUser.name, email: newUser.email },
            process.env.JWT_SECRET as string,
            { expiresIn: process.env.JWT_EXPIRES_IN as any }
        );

        res.json({ success: true, token: jwtToken, user: newUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to accept invitation" });
    }
};


