import { getCookie } from "./cookies";

export const getUserLocal = () => {
    const user = getCookie("user") || localStorage.getItem("user");
    if (!user) return null;
    try {
        return JSON.parse(user);
    } catch {
        return null;
    }
};
