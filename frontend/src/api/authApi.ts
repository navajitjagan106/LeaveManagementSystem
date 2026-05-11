import API from "./axios";

export const login = (data: { email: string; password: string }) =>
    API.post("/auth/login", data);

export const verifyOtp = (data: { email: string; code: string }) =>
    API.post("/auth/verify-otp", data);

export const getInvitationByToken = (token: string) =>
    API.get(`/auth/invitation/${token}`);

export const acceptInvitation = (token: string, data: { password: string }) =>
    API.post(`/auth/accept-invitation/${token}`, data);

export const logoutApi = () => API.post("/auth/logout");
export const getMe = () => API.get("/auth/me");

export const forgotPasswordApi = (data: { email: string }) =>
    API.post("/auth/forgot-password", data);

export const resetPasswordApi = (data: { token: string; password: string }) =>
    API.post("/auth/reset-password", data);

export const changePasswordApi = (data: { oldPassword: string; newPassword: string }) =>
    API.post("/auth/change-password", data);
