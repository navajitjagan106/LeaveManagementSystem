export type ApprovalRequest = {
    id: number;
    employee_name: string;
    department: string;
    leave_type: string;
    from_date: string;
    to_date: string;
    total_days: number;
    reason: string;
    status: "pending" | "approved" | "rejected";
    duration_type: "full" | "half";
    manager_id?: number;
    manager_name?: string;
    approved_by?: number;
    approved_by_name?: string;
    approved_at?: string;
    rejection_reason?: string;
    applied_at?: string;
};