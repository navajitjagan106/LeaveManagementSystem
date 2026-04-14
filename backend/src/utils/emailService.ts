import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
    });
}

// ── 1. To Manager: new leave applied 
export async function sendLeaveApplicationEmail(params: {
    managerEmail: string; managerName: string; employeeName: string;
    leaveType: string; fromDate: Date | string; toDate: Date | string;
    totalDays: number; reason: string;
}) {
    const { managerEmail, managerName, employeeName, leaveType, fromDate, toDate, totalDays, reason } = params;

    await resend.emails.send({
        from: "onboarding@resend.dev",
        to: managerEmail,
        subject: `Leave Request from ${employeeName} – ${formatDate(fromDate)} to ${formatDate(toDate)}`,
        html: `
        <h2>New Leave Request</h2>
        <p>Hi <strong>${managerName}</strong>, a new leave application needs your approval.</p>
        <table>
        <tr><td><b>Employee</b></td><td>${employeeName}</td></tr>
        <tr><td><b>Leave Type</b></td><td>${leaveType}</td></tr>
        <tr><td><b>From</b></td><td>${formatDate(fromDate)}</td></tr>
        <tr><td><b>To</b></td><td>${formatDate(toDate)}</td></tr>
        <tr><td><b>Duration</b></td><td>${totalDays} day${totalDays === 1 ? "" : "s"}</td></tr>
        <tr><td><b>Reason</b></td><td>${reason}</td></tr>
        </table>
        <p>Please log in to review and take action.</p>
    `,
    });
}

// ── 2. To Employee: leave approved 
export async function sendLeaveApprovedEmail(params: {
    employeeEmail: string; employeeName: string; managerName: string;
    leaveType: string; fromDate: Date | string; toDate: Date | string; totalDays: number;
}) {
    const { employeeEmail, employeeName, managerName, leaveType, fromDate, toDate, totalDays } = params;

    await resend.emails.send({
        from: "onboarding@resend.dev",
        to: employeeEmail,
        subject: `Your Leave Request Has Been Approved`,
        html: `
        <h2>✅ Leave Approved</h2>
        <p>Hi <strong>${employeeName}</strong>, your leave has been approved!</p>
        <table>
        <tr><td><b>Leave Type</b></td><td>${leaveType}</td></tr>
        <tr><td><b>From</b></td><td>${formatDate(fromDate)}</td></tr>
        <tr><td><b>To</b></td><td>${formatDate(toDate)}</td></tr>
        <tr><td><b>Duration</b></td><td>${totalDays} day${totalDays === 1 ? "" : "s"}</td></tr>
        <tr><td><b>Approved By</b></td><td>${managerName}</td></tr>
        </table>
    `,
    });
}

// ── 3. To Employee: leave rejected ───────────────────────────────────────
export async function sendLeaveRejectedEmail(params: {
    employeeEmail: string; employeeName: string; managerName: string;
    leaveType: string; fromDate: Date | string; toDate: Date | string;
    totalDays: number; rejectionReason: string;
}) {
    const { employeeEmail, employeeName, managerName, leaveType, fromDate, toDate, totalDays, rejectionReason } = params;

    await resend.emails.send({
        from: "onboarding@resend.dev",
        to: employeeEmail,
        subject: `Your Leave Request Has Been Rejected`,
        html: `
        <h2>❌ Leave Rejected</h2>
        <p>Hi <strong>${employeeName}</strong>, your leave request was not approved.</p>
        <table>
        <tr><td><b>Leave Type</b></td><td>${leaveType}</td></tr>
        <tr><td><b>From</b></td><td>${formatDate(fromDate)}</td></tr>
        <tr><td><b>To</b></td><td>${formatDate(toDate)}</td></tr>
        <tr><td><b>Duration</b></td><td>${totalDays} day${totalDays === 1 ? "" : "s"}</td></tr>
        <tr><td><b>Reviewed By</b></td><td>${managerName}</td></tr>
        <tr><td><b>Reason</b></td><td>${rejectionReason || "No reason provided"}</td></tr>
        </table>
        <p>Please contact your manager or HR for more information.</p>
    `,
    });
}