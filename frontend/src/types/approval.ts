export interface ApprovalRequest {
    id: number;
    employee_name: string;
    role: string;
    leave_type: string;
    from_date: string;
    to_date: string;
    total_days:number,
    reason: string;
}