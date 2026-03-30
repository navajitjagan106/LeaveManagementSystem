import API from "./axios";

// Apply leave
export const applyLeave = (data: any) =>
    API.post("/leaves/apply", data);

// Get dashboard
export const getDashboard = () =>
    API.get("/leaves/dashboard");

export const getHolidays = () =>
    API.get("/leaves/holidays")

// Get leave history
export const getHistory = () =>
    API.get("/leaves/history");

export const getManager = () =>
    API.get("/leaves/users/manager");

export const getLeaveTypes = () =>
    API.get("/leaves/types");

// Get pending approvals (manager)
export const getPending = () =>
    API.get("/leaves/pending");

// Approve leave
export const approveLeave = (id: number, status: string) =>
    API.patch(`/leaves/approve/${id}`, { status });

// Leave balance
export const getBalance = () =>
    API.get("/leaves/balance");

// Team leaves
export const getTeamLeaves = () =>
    API.get("/leaves/team");

export const calculateDays = (data: {
    from_date: string;
    to_date: string;
    duration_type: string;
}) =>
    API.post("/leaves/calculatedays",data)

export const getLeaveInitData=()=>
    API.get("/leaves/getinitdata")

export const getuserdata=()=>
    API.get("/leaves/getuserdata")