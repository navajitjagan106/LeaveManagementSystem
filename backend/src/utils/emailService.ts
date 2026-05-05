import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, 
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    family: 4, 
    connectionTimeout: 10000, 
    greetingTimeout: 10000,
} as any);

function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
    });
}

const BRAND_COLOR = "#5746AF";
const BG_COLOR = "#f4f7f9";

function emailWrapper(content: string) {
    return `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: ${BG_COLOR}; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <div style="background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #7c3aed 100%); padding: 32px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">LeaveMS</h1>
                </div>
                <div style="padding: 40px;">
                    ${content}
                </div>
                <div style="padding: 24px; text-align: center; background-color: #f9fafb; border-top: 1px solid #f1f5f9;">
                    <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                        This is an automated message from LeaveMS. Please do not reply to this email.
                    </p>
                </div>
            </div>
        </div>
    `;
}

export async function sendLeaveApplicationEmail(params: {
    managerEmail: string; managerName: string; employeeName: string;
    leaveType: string; fromDate: Date | string; toDate: Date | string;
    totalDays: number; reason: string;
}) {
    const { managerEmail, managerName, employeeName, leaveType, fromDate, toDate, totalDays, reason } = params;

    const html = emailWrapper(`
        <h2 style="margin-top: 0; color: #1e293b; font-size: 20px;">New Leave Request</h2>
        <p style="color: #475569;">Hi ${managerName},</p>
        <p style="color: #475569;"><strong>${employeeName}</strong> has submitted a leave request that requires your review.</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; width: 100px;">Type</td>
                    <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${leaveType}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Duration</td>
                    <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${totalDays} day${totalDays === 1 ? "" : "s"}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Dates</td>
                    <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${formatDate(fromDate)} - ${formatDate(toDate)}</td>
                </tr>
                <tr>
                    <td style="padding: 16px 0 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;" colspan="2">Reason</td>
                </tr>
                <tr>
                    <td style="padding: 0 0 8px 0; color: #475569; font-size: 14px;" colspan="2">${reason}</td>
                </tr>
            </table>
        </div>

        <div style="text-align: center; margin-top: 32px;">
            <a href="${process.env.FRONTEND_URL}/approvals" style="background-color: ${BRAND_COLOR}; color: #ffffff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">Review Request</a>
        </div>
    `);

    await transporter.sendMail({
        from: `"LeaveMS" <${process.env.SMTP_USER}>`,
        to: managerEmail,
        subject: `Leave Request: ${employeeName}`,
        html,
    });
}

export async function sendLeaveApprovedEmail(params: {
    employeeEmail: string; employeeName: string; managerName: string;
    leaveType: string; fromDate: Date | string; toDate: Date | string; totalDays: number;
}) {
    const { employeeEmail, employeeName, managerName, leaveType, fromDate, toDate, totalDays } = params;

    const html = emailWrapper(`
        <div style="text-align: center; margin-bottom: 24px;">
            <div style="background-color: #ecfdf5; color: #059669; width: 48px; height: 48px; line-height: 48px; border-radius: 50%; font-size: 24px; margin: 0 auto 16px;">✓</div>
            <h2 style="margin: 0; color: #1e293b; font-size: 20px;">Leave Request Approved</h2>
        </div>
        <p style="color: #475569;">Hi ${employeeName},</p>
        <p style="color: #475569;">Good news! Your leave request has been approved by <strong>${managerName}</strong>.</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; width: 100px;">Type</td>
                    <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${leaveType}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Duration</td>
                    <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${totalDays} day${totalDays === 1 ? "" : "s"}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Dates</td>
                    <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${formatDate(fromDate)} - ${formatDate(toDate)}</td>
                </tr>
            </table>
        </div>

        <p style="color: #64748b; font-size: 14px; text-align: center;">Your leave balance has been updated automatically.</p>
    `);

    await transporter.sendMail({
        from: `"LeaveMS" <${process.env.SMTP_USER}>`,
        to: employeeEmail,
        subject: `Leave Request Approved`,
        html,
    });
}

export async function sendLeaveRejectedEmail(params: {
    employeeEmail: string; employeeName: string; managerName: string;
    leaveType: string; fromDate: Date | string; toDate: Date | string;
    totalDays: number; rejectionReason: string;
}) {
    const { employeeEmail, employeeName, managerName, leaveType, fromDate, toDate, totalDays, rejectionReason } = params;

    const html = emailWrapper(`
        <div style="text-align: center; margin-bottom: 24px;">
            <div style="background-color: #fef2f2; color: #ef4444; width: 48px; height: 48px; line-height: 48px; border-radius: 50%; font-size: 24px; margin: 0 auto 16px;">✕</div>
            <h2 style="margin: 0; color: #1e293b; font-size: 20px;">Leave Request Rejected</h2>
        </div>
        <p style="color: #475569;">Hi ${employeeName},</p>
        <p style="color: #475569;">Your leave request was reviewed by <strong>${managerName}</strong> and has been rejected.</p>
        
        <div style="background-color: #fffafb; border: 1px solid #fee2e2; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; color: #991b1b; font-size: 13px; font-weight: 600; text-transform: uppercase; width: 100px;">Dates</td>
                    <td style="padding: 8px 0; color: #991b1b; font-weight: 500;">${formatDate(fromDate)} - ${formatDate(toDate)}</td>
                </tr>
                <tr>
                    <td style="padding: 16px 0 8px 0; color: #991b1b; font-size: 13px; font-weight: 600; text-transform: uppercase;" colspan="2">Reason for Rejection</td>
                </tr>
                <tr>
                    <td style="padding: 0 0 8px 0; color: #b91c1c; font-size: 14px;" colspan="2">${rejectionReason || "No reason provided"}</td>
                </tr>
            </table>
        </div>

        <p style="color: #64748b; font-size: 14px; text-align: center;">Please contact your manager or HR if you have any questions.</p>
    `);

    await transporter.sendMail({
        from: `"LeaveMS" <${process.env.SMTP_USER}>`,
        to: employeeEmail,
        subject: `Update on Leave Request`,
        html,
    });
}

export async function sendInvitationEmail(params: {
    name: string;
    email: string; inviterName: string; role: string;
    token: string; frontendUrl: string;
}) {
    const { name, email, inviterName, role, token, frontendUrl } = params;
    const link = `${frontendUrl}/accept-invitation/${token}`;

    const html = emailWrapper(`
        <h2 style="margin-top: 0; color: #1e293b; font-size: 20px;">Welcome to the Team!</h2>
        <p style="color: #475569;">Hi ${name},</p>
        <p style="color: #475569;"><strong>${inviterName}</strong> has invited you to join the LeaveMS platform as a <strong>${role}</strong>.</p>
        
        <p style="color: #475569; margin-top: 24px;">To get started, please click the button below to set up your account and password. This link will remain active for 48 hours.</p>

        <div style="text-align: center; margin: 40px 0;">
            <a href="${link}" style="background-color: ${BRAND_COLOR}; color: #ffffff; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 10px rgba(87, 70, 175, 0.2);">Accept Invitation</a>
        </div>

        <p style="color: #94a3b8; font-size: 13px; text-align: center;">If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="${link}" style="color: ${BRAND_COLOR}; text-decoration: none; word-break: break-all;">${link}</a></p>
    `);

    await transporter.sendMail({
        from: `"LeaveMS" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Join your team on LeaveMS`,
        html,
    });
}

export async function sendOTPEmail(params: {
    email: string; name: string; code: string;
}) {
    const { email, name, code } = params;

    const html = emailWrapper(`
        <h2 style="margin-top: 0; color: #1e293b; font-size: 20px;">Your Login Code</h2>
        <p style="color: #475569;">Hi ${name},</p>
        <p style="color: #475569;">Use the one-time code below to complete your login. For security, do not share this code with anyone.</p>
        
        <div style="background-color: #f1f5f9; border-radius: 12px; padding: 32px; text-align: center; margin: 32px 0;">
            <div style="font-family: 'Courier New', Courier, monospace; font-size: 40px; font-weight: 800; letter-spacing: 12px; color: ${BRAND_COLOR}; margin: 0;">${code}</div>
        </div>

        <p style="color: #94a3b8; font-size: 13px; text-align: center;">This code will expire in 10 minutes.</p>
    `);

    await transporter.sendMail({
        from: `"LeaveMS" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Your Login Code: ${code}`,
        html,
    });
}
