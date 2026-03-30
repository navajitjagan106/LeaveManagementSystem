import { LeaveBalance } from "./leave";

export interface TeamMember {
    name: string;
    from_date: string;
    to_date: string;
}

export interface DashboardData {
    leave_balance: LeaveBalance[];
    pending_requests: number;
    approved_requests: number;
    team_on_leave: TeamMember[];
}