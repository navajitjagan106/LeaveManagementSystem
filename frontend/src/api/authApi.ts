import API from "./axios";

export const login = (data: { email: string; password: string }) =>
    API.post("/auth/login", data);

export const verifyOtp = (data: { email: string; code: string }) =>
    API.post("/auth/verify-otp", data);

export const getInvitationByToken = (token: string) =>
    API.get(`/auth/invitation/${token}`);

export const acceptInvitation = (token: string, data: { password: string }) =>
    API.post(`/auth/accept-invitation/${token}`, data);
