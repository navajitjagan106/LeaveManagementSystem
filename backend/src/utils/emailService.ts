import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const toAlias = (_email: string): string => {
    return "leavemsmail2026@gmail.com";
};

function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
    });
}

export async function sendLeaveApplicationEmail(params: {
    managerEmail: string; managerName: string; employeeName: string;
    leaveType: string; fromDate: Date | string; toDate: Date | string;
    totalDays: number; reason: string;
}) {
    const { managerEmail, managerName, employeeName, leaveType, fromDate, toDate, totalDays, reason } = params;

    const { error } = await resend.emails.send({
        from: "noreply@resend.dev",
        to: toAlias(managerEmail),
        subject: `[To: ${managerName}] Leave Request from ${employeeName}`,
        text: `
        Hi ${managerName},

        ${employeeName} has submitted a leave request that requires your approval.

        Details:
        Employee   : ${employeeName}
        Leave Type : ${leaveType}
        From       : ${formatDate(fromDate)}
        To         : ${formatDate(toDate)}
        Duration   : ${totalDays} day${totalDays === 1 ? "" : "s"}
        Reason     : ${reason}

        Please log in to the system to approve or reject this request.

        ---
        This is an automated message. Please do not reply.   
        `.trim(),});
    if (error) throw new Error(`Resend error: ${error.message}`);
}

export async function sendLeaveApprovedEmail(params: {
    employeeEmail: string; employeeName: string; managerName: string;
    leaveType: string; fromDate: Date | string; toDate: Date | string; totalDays: number;
}) {
    const { employeeEmail, employeeName, managerName, leaveType, fromDate, toDate, totalDays } = params;

    const { error } = await resend.emails.send({
        from: "noreply@resend.dev",
        to: toAlias(employeeEmail),
        subject: `[To: ${employeeName}] Your Leave Request Has Been Approved`,
        text: `
        Hi ${employeeName},

        Your leave request has been approved.

        Details:
        Leave Type  : ${leaveType}
        From        : ${formatDate(fromDate)}
        To          : ${formatDate(toDate)}
        Duration    : ${totalDays} day${totalDays === 1 ? "" : "s"}
        Approved By : ${managerName}

        Your leave balance has been updated accordingly.

        ---
        This is an automated message. Please do not reply.
        `.trim(),
    });
    if (error) throw new Error(`Resend error: ${error.message}`);
}

export async function sendLeaveRejectedEmail(params: {
    employeeEmail: string; employeeName: string; managerName: string;
    leaveType: string; fromDate: Date | string; toDate: Date | string;
    totalDays: number; rejectionReason: string;
}) {
    const { employeeEmail, employeeName, managerName, leaveType, fromDate, toDate, totalDays, rejectionReason } = params;

    const { error } = await resend.emails.send({
        from: "noreply@resend.dev",
        to: toAlias(employeeEmail),
        subject: `[To: ${employeeName}] Your Leave Request Has Been Rejected`,
        text: `
        Hi ${employeeName},

        Your leave request has been rejected.

        Details:
        Leave Type  : ${leaveType}
        From        : ${formatDate(fromDate)}
        To          : ${formatDate(toDate)}
        Duration    : ${totalDays} day${totalDays === 1 ? "" : "s"}
        Reviewed By : ${managerName}
        Reason      : ${rejectionReason || "No reason provided"}

        Please contact ${managerName} or HR for more information.

        ---
        This is an automated message. Please do not reply.
        `.trim(),
    });
    if (error) throw new Error(`Resend error: ${error.message}`);
}