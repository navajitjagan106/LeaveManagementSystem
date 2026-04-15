import { Request, Response } from "express";
import { pool } from "../config/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (name, email, password, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, role`,
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

        const user = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (user.rows.length === 0) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const dbUser = user.rows[0];

        const isMatch = await bcrypt.compare(password, dbUser.password);

        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }
        const token = jwt.sign(
            {
                id: dbUser.id,
                role: dbUser.role,
                name: dbUser.name,
                email: dbUser.email,
            },
            process.env.JWT_SECRET as string,
            {
                expiresIn: process.env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
            }
        );

        res.json({
            token,
            user: {
                id: dbUser.id,
                name: dbUser.name,
                email: dbUser.email,
                role: dbUser.role,
                manager_id: dbUser.manager_id,
                department: dbUser.department
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Login failed" });
    }
};

