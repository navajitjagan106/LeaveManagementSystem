export interface ApplyLeaveDTO {
    user_id: number;
    leave_type_id: number;
    from_date: string;
    to_date: string;
    reason: string;
}