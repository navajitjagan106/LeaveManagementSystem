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
    approved_at?: string;
    rejection_reason?: string;
};