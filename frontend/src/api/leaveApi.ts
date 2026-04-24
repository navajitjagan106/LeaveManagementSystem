import API from "./axios";

export const applyLeave = (data: any) =>
    API.post("/leaves/apply", data);

export const getDashboard = () =>
    API.get("/leaves/dashboard");

export const getHolidays = () =>
    API.get("/leaves/holidays")

export const getHistory = (params: any) =>
    API.get("/leaves/history", { params });

export const getManager = () =>
    API.get("/leaves/users/manager");

export const getLeaveTypes = () =>
    API.get("/leaves/types");

export const getPending = (params: any) =>
    API.get("/leaves/pending", { params });

export const approveLeave = (id: number, status: string, rejection_reason?: string) =>
    API.patch(`/leaves/approve/${id}`, { status, rejection_reason });

export const getBalance = () =>
    API.get("/leaves/balance");

export const getTeamLeaves = () =>
    API.get("/leaves/team");

export const calculateDays = (data: {
    from_date: string;
    to_date: string;
    duration_type: string;
}) =>
    API.post("/leaves/calculatedays", data)

export const getLeaveInitData = () =>
    API.get("/leaves/getinitdata")

export const getuserdata = () =>
    API.get("/leaves/getuserdata")

export const cancelLeave = (id: number) =>
    API.delete(`/leaves/cancel/${id}`);


export const getNotifications = () =>
    API.get("/leaves/notifications");

export const markNotificationsRead = () =>
    API.patch("/leaves/notifications/read");

export const getTeamOnLeave = (from_date: string, to_date: string) =>
    API.get("/leaves/teamonleave", { params: { from_date, to_date } });

export const getTeamMembers = () =>
    API.get("/leaves/team-members");

export const getTeamMemberBalance = (id: number) =>
    API.get(`/leaves/team-member-balance/${id}`);

export const getTeamBalanceSummary = () =>
    API.get("/leaves/team-balance-summary");

export const getLeaveTrend = () =>
  API.get("/leaves/leave-trend");