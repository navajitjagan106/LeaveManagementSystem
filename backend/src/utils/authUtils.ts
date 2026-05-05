import { Response } from "express";

const isProduction = process.env.NODE_ENV === "production";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

export const setAuthCookies = (res: Response, token: string, user: object) => {
    res.cookie("token", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax", // 'none' is required for cross-domain (Netlify -> Render)
        maxAge: COOKIE_MAX_AGE,
        path: "/",
    });
    res.cookie("user", JSON.stringify(user), {
        httpOnly: false,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: COOKIE_MAX_AGE,
        path: "/",
    });
};
