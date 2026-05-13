import API from "./axios";

export const getEmployees = () => API.get("/management/users");
export const updateEmployee = (id: number, data: any) => API.patch(`/management/users/${id}`, data);
export const deleteEmployee = (id: number) => API.delete(`/management/users/${id}`);
export const reassignPolicy = (id: number, policy_id: number | null) => API.patch(`/management/users/${id}/policy`, { policy_id });
export const resetLeaveBalance = (id: number) => API.post(`/management/users/${id}/reset-balance`);

export const addLeaveType = (data: { name: string; description?: string }) => API.post("/management/leave-types", data);
export const updateLeaveType = (id: number, data: { name: string; description?: string }) => API.patch(`/management/leave-types/${id}`, data);
export const deleteLeaveType = (id: number) => API.delete(`/management/leave-types/${id}`);

export const getPolicies = () => API.get("/management/policies");
export const createPolicy = (data: { name: string; description?: string }) => API.post("/management/policies", data);
export const updatePolicy = (id: number, data: { name: string; description?: string }) => API.patch(`/management/policies/${id}`, data);
export const deletePolicy = (id: number) => API.delete(`/management/policies/${id}`);
export const getPolicyRules = (id: number) => API.get(`/management/policies/${id}/rules`);
export const setPolicyRules = (id: number, rules: { leave_type_id: number; total_allocated: number }[]) =>
    API.put(`/management/policies/${id}/rules`, { rules });

export const addHoliday = (data: any) => API.post("/management/holidays", data);
export const updateHoliday = (id: number, data: any) => API.patch(`/management/holidays/${id}`, data);
export const deleteHoliday = (id: number) => API.delete(`/management/holidays/${id}`);

export const getAllLeaves = () => API.get("/management/leaves");
export const getuserBalance = (id: number) => API.get(`/management/user-balance/${id}`);
export const updateLeaveBalance = (data: { user_id: number; leave_type_id: number; change: number }) =>
    API.patch(`/management/user-balance`, data);
export const exportLeaves = (params?: Record<string, string>) =>
    API.get("/management/export", { params, responseType: "blob" });

export const sendInvitation = (data: {
    name: string; email: string; role?: string; role_id?: number;
    department?: string; manager_id?: number; policy_id?: number; expires_in_hours?: number;
}) => API.post("/management/invitations", data);

export const getInvitations = (status?: string) =>
    API.get("/management/invitations", { params: status ? { status } : {} });
export const resendInvitation = (id: number) => API.post(`/management/invitations/${id}/resend`);
export const cancelInvitation = (id: number) => API.delete(`/management/invitations/${id}`);

export const bulkUpload = (csvText: string) => API.post("/management/bulk-upload", { csvText });

export const getAdminDashboardStats = () => API.get("/management/dashboard-stats");
