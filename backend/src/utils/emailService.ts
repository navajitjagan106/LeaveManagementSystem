import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const toAlias = (_email: string): string => {
    return process.env.EMAIL_ALIAS || _email;
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
        `.trim(),
    });
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

export async function sendInvitationEmail(params: {
    name: string;
    email: string; inviterName: string; role: string;
    token: string; frontendUrl: string;
}) {
    const { name, email, inviterName, role, token, frontendUrl } = params;
    const link = `${frontendUrl}/accept-invitation/${token}`;

    const { error } = await resend.emails.send({
        from: "noreply@resend.dev",
        to: toAlias(email),
        subject: `[To: ${email}] You've been invited to LeaveMS`,
        text: `
        Hi ${name},

        ${inviterName} has invited you to join LeaveMS as a ${role}.

        Click the link below to set up your account (valid for 48 hours):
        ${link}

        If you did not expect this invitation, please ignore this email.

        ---
        This is an automated message. Please do not reply.
            `.trim(),
    });
    if (error) throw new Error(`Resend error: ${error.message}`);
}


export async function sendOTPEmail(params: {
    email: string; name: string; code: string;
}) {
    const { email, name, code } = params;
    const { error } = await resend.emails.send({
        from: "noreply@resend.dev",
        to: toAlias(email),
        subject: `[To: ${email}] Your LeaveMS login code`,
        text: `
Hi ${name},

Your one-time login code is:

  ${code}

This code expires in 10 minutes. Do not share it with anyone.

---
This is an automated message. Please do not reply.
        `.trim(),
    });
    if (error) throw new Error(`Resend error: ${error.message}`);
}

