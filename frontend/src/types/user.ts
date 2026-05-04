export interface PagePermission {
    can_view: boolean;
    can_edit: boolean;
    can_delete: boolean;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    manager_id: number | null;
    manager_name?: string;
    department?: string;
    policy_name?: string;
    phone?: string | null;
    gender?: string | null;
    date_of_birth?: string | null;
    location?: string | null;
    permissions?: Record<string, PagePermission>;
}
