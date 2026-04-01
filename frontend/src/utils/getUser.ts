import API from "../api/axios";

export const getUser = () =>
    API.get("/leaves/getuserdata")

// utils/getUserLocal.ts
export const getUserLocal = () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
};