import API from "./axios";
import { PagePermission } from "../types/user";

export const getPageDefinitions = () => API.get("/management/pages");

export const getAvailableRoles = () => API.get("/management/roles");

export const getRolePermissions = (role: string) =>
    API.get(`/management/roles/${role}/permissions`);

export const setRolePermissions = (
    role: string,
    permissions: Record<string, PagePermission>
) => API.put(`/management/roles/${role}/permissions`, { permissions });

export const deleteRole = (role: string) => API.delete(`/management/roles/${role}`);

export const createRole = (name: string, label: string, description: string) => 
    API.post("/management/roles", { name, label, description });
