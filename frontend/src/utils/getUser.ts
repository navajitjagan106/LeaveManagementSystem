import { getCookie } from "./cookies";

export const getUserLocal = () => {
    const user = getCookie("user");
    return user ? JSON.parse(user) : null;
};
