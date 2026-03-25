export interface User {
    id: number;
    name: string;
    email: string;
    role: 'employee' | 'manager';
}

export interface LeaveRequest {
    id: number;
    employeeId: number;
    employeeName: string;
    leaveType: 'sick' | 'casual' | 'earned';
    fromDate: string;
    toDate: string;
    days: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    appliedDate: string;
}

export interface LeaveBalance {
    sick: { used: number; total: number };
    casual: { used: number; total: number };
    earned: { used: number; total: number };
}