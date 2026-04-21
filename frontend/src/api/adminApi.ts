import API from "./axios";

export const getEmployees = () => API.get("/admin/users");
export const createEmployee = (data: any) => API.post("/admin/users", data);
export const updateEmployee = (id: number, data: any) =>
    API.patch(`/admin/users/${id}`, data);

export const deleteEmployee = (id: number) =>
    API.delete(`/admin/users/${id}`);

export const updateManager = (id: number, manager_id: number) =>
    API.patch(`/admin/users/${id}/manager`, { manager_id });


export const addLeaveType = (data: any) =>
    API.post("/admin/leave-types", data);

export const addHoliday = (data: any) =>
    API.post("/admin/holidays", data);

export const deleteHoliday = (id: number) =>
    API.delete(`/admin/holidays/${id}`);

export const updateLeaveType=(id:number,max_days:number)=>
    API.patch(`/admin/leave-types/${id}`,{max_days})

export const getAllLeaves=()=>
    API.get("/admin/leaves")

export const getuserBalance=(id:number)=>
    API.get(`/admin/user-balance/${id}`)

export const updateLeaveBalance=(data:{user_id:number,leave_type_id:number,change:number})=>
    API.patch(`/admin/user-balance`,data)

export const exportLeaves = (params?: Record<string, string>) =>
    API.get('/admin/export', { params, responseType: 'blob' })
