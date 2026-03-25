import { pool } from "../config/db";

export const createNotification = async (
  user_id: number,
  message: string
) => {
  await pool.query(
    `INSERT INTO notifications (user_id, message)
     VALUES ($1, $2)`,
    [user_id, message]
  );
};