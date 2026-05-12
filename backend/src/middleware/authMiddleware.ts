import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../config/db";

export const authenticate = async (req: any, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.token;
    
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    
    const userRow = await pool.query(
        `SELECT u.id, u.role_id, r.name as role, u.name 
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.id = $1`, 
        [decoded.id]
    );

    if (userRow.rows.length === 0) {
        return res.status(401).json({ error: "User associated with this token does not exist." });
    }

    req.user = userRow.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
