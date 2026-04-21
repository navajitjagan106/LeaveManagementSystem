export interface LeaveType {
    id: number;
    name: string;
    max_days: number;
}

export interface LeaveBalance {
    leave_type_id: number;
    name: string;
    total_allocated: number;
    used: number;
    remaining: number;
}

export type LeaveStatus = "pending" | "approved" | "rejected";

export interface LeaveHistory {
    id: number;
    leave_type: string;
    from_date: string;
    to_date: string;
    total_days: number;
    reason: string;
    status: LeaveStatus;
    created_at?: string;
    updated_at?: string;
    user_name?: string;
    rejection_reason?: string;
    approved_at?: string;
    approved_by_name?: string;
}