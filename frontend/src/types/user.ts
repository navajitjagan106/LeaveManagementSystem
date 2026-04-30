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
}
