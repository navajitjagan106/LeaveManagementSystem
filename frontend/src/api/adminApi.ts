import API from "./axios";

export const getEmployees = () => API.get("/admin/users");
export const createEmployee = (data: any) => API.post("/admin/users", data);
export const updateEmployee = (id: number, data: any) => API.patch(`/admin/users/${id}`, data);
export const deleteEmployee = (id: number) => API.delete(`/admin/users/${id}`);
export const updateManager = (id: number, manager_id: number | null) => API.patch(`/admin/users/${id}/manager`, { manager_id });
export const reassignPolicy = (id: number, policy_id: number | null) => API.patch(`/admin/users/${id}/policy`, { policy_id });
export const resetLeaveBalance = (id: number) => API.post(`/admin/users/${id}/reset-balance`);

export const addLeaveType = (data: { name: string; description?: string }) => API.post("/admin/leave-types", data);
export const updateLeaveType = (id: number, name: string) => API.patch(`/admin/leave-types/${id}`, { name });

export const getPolicies = () => API.get("/admin/policies");
export const createPolicy = (data: { name: string; description?: string }) => API.post("/admin/policies", data);
export const deletePolicy = (id: number) => API.delete(`/admin/policies/${id}`);
export const getPolicyRules = (id: number) => API.get(`/admin/policies/${id}/rules`);
export const setPolicyRules = (id: number, rules: { leave_type_id: number; total_allocated: number }[]) =>
    API.put(`/admin/policies/${id}/rules`, { rules });

export const addHoliday = (data: any) => API.post("/admin/holidays", data);
export const deleteHoliday = (id: number) => API.delete(`/admin/holidays/${id}`);

export const getAllLeaves = () => API.get("/admin/leaves");
export const getuserBalance = (id: number) => API.get(`/admin/user-balance/${id}`);
export const updateLeaveBalance = (data: { user_id: number; leave_type_id: number; change: number }) =>
    API.patch(`/admin/user-balance`, data);
export const exportLeaves = (params?: Record<string, string>) =>
    API.get("/admin/export", { params, responseType: "blob" });

export const sendInvitation = (data: {
    name: string; email: string; role: string;
    department?: string; manager_id?: number; policy_id?: number;
}) => API.post("/admin/invitations", data);

export const getInvitations = (status?: string) =>
    API.get("/admin/invitations", { params: status ? { status } : {} });
export const resendInvitation = (id: number) => API.post(`/admin/invitations/${id}/resend`);
export const cancelInvitation = (id: number) => API.delete(`/admin/invitations/${id}`);
