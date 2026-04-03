
// utils/getUserLocal.ts
export const getUserLocal = () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
};