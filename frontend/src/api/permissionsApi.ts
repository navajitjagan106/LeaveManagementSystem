import API from "./axios";
import { PagePermission } from "../types/user";

export const getPageDefinitions = () => API.get("/admin/pages");

export const getUserPermissions = (userId: number) =>
    API.get(`/admin/users/${userId}/permissions`);

export const setUserPermissions = (
    userId: number,
    permissions: Record<string, PagePermission>
) => API.put(`/admin/users/${userId}/permissions`, { permissions });
