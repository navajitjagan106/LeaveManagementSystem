import API from "./axios";

export const applyLeave = (data: any) =>
    API.post("/leaves/apply", data);

export const getDashboard = () =>
    API.get("/leaves/dashboard");

export const getHolidays = () =>
    API.get("/leaves/holidays")

export const getHistory = (params:any) =>
    API.get("/leaves/history",{params});

export const getManager = () =>
    API.get("/leaves/users/manager");

export const getLeaveTypes = () =>
    API.get("/leaves/types");

export const getPending = (params:any) =>
    API.get("/leaves/pending",{params});

export const approveLeave = (id: number, status: string) =>
    API.patch(`/leaves/approve/${id}`, { status });

export const getBalance = () =>
    API.get("/leaves/balance");

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