

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
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">DayOff</h1>
                </div>
                <div style="padding: 40px;">
                    ${content}
                </div>
                <div style="padding: 24px; text-align: center; background-color: #f9fafb; border-top: 1px solid #f1f5f9;">
                    <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                        This is an automated message from DayOff. Please do not reply to this email.
                    </p>
                </div>
            </div>
        </div>
    `;
}

async function sendMail(options: { to: string; subject: string; html: string; otpCode?: string; throwOnFailure?: boolean }) {
    const apiKey = process.env.SENDGRID_API_KEY;
    const sender = process.env.SENDER_EMAIL;

    if (!apiKey || !sender) {
        console.warn("⚠️ Email Configuration Missing (SENDGRID_API_KEY or SENDER_EMAIL)");
        if (process.env.NODE_ENV === "development" && options.otpCode) {
            console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log(`  LOCAL DEV OTP FOR ${options.to}: ${options.otpCode}`);
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        }
        return;
    }

    try {
        const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                personalizations: [{ to: [{ email: options.to }] }],
                from: { email: sender, name: "DayOff" },
                subject: options.subject,
                content: [{ type: "text/html", value: options.html }],
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(JSON.stringify(errorData));
        }

        console.log(`Email sent successfully via Fetch API to ${options.to}`);
    } catch (error: any) {
        console.error(`Email API delivery failed to ${options.to}:`, error.message);

        // Local Fallback for OTP
        if (process.env.NODE_ENV === "development" && options.otpCode) {
            console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log(`  LOCAL DEV OTP FOR ${options.to}: ${options.otpCode}`);
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        } // REMOVE THIS:
        else if (process.env.NODE_ENV !== "development") {
            throw error;
        }

        // REPLACE WITH THIS:
        else if (options.throwOnFailure) {
            throw error;
        }
    }
}

export async function sendLeaveApplicationEmail(params: {
    managerEmail: string; managerName: string; employeeName: string;
    leaveType: string; fromDate: Date | string; toDate: Date | string;
    totalDays: number; reason: string;
}) {
    const html = emailWrapper(`
        <h2 style="margin-top: 0; font-size: 20px; color: ${BRAND_COLOR};">New Leave Request</h2>
        <p>Hello <strong>${params.managerName}</strong>,</p>
        <p><strong>${params.employeeName}</strong> has submitted a new leave application.</p>
        <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #e2e8f0;">
            <p><strong>Type:</strong> ${params.leaveType}</p>
            <p><strong>Dates:</strong> ${formatDate(params.fromDate)} to ${formatDate(params.toDate)} (${params.totalDays} days)</p>
            <p><strong>Reason:</strong> "${params.reason}"</p>
        </div>
    `);
    await sendMail({ to: params.managerEmail, subject: `Leave Request: ${params.employeeName}`, html });
}

export async function sendLeaveStatusEmail(params: {
    employeeEmail: string; employeeName: string; leaveType: string;
    status: "approved" | "rejected"; fromDate: Date | string;
    toDate: Date | string; rejectionReason?: string;
}) {
    const isApproved = params.status === "approved";
    const statusColor = isApproved ? "#10b981" : "#ef4444";
    const html = emailWrapper(`
        <h2 style="margin-top: 0; font-size: 20px; color: ${statusColor};">Leave Request ${params.status.charAt(0).toUpperCase() + params.status.slice(1)}</h2>
        <p>Hello <strong>${params.employeeName}</strong>,</p>
        <p>Your leave request for <strong>${params.leaveType}</strong> has been <strong>${params.status}</strong>.</p>
        ${params.rejectionReason ? `<p style="color: #ef4444;"><strong>Reason:</strong> ${params.rejectionReason}</p>` : ""}
    `);
    await sendMail({ to: params.employeeEmail, subject: `Leave Request ${params.status}: ${params.leaveType}`, html });
}

export async function sendOTPEmail(params: { email: string; name: string; code: string }) {
    const html = emailWrapper(`
        <h2 style="margin-top: 0; font-size: 20px; color: ${BRAND_COLOR};">Verify Your Login</h2>
        <p>Hello <strong>${params.name}</strong>,</p>
        <p>Your verification code is:</p>
        <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; color: ${BRAND_COLOR}; letter-spacing: 5px; background: #eee; padding: 10px 20px; border-radius: 8px;">${params.code}</span>
        </div>
    `);
await sendMail({ to: params.email, subject: `${params.code} is your verification code`, html, otpCode: params.code, throwOnFailure: true });
}

export async function sendInvitationEmail(params: {
    email: string; name: string; token: string; role: string; department?: string; inviterName?: string;
}) {
    const baseUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "");
    const acceptUrl = `${baseUrl}/accept-invitation/${params.token}`;
    const html = emailWrapper(`
        <h2 style="margin-top: 0; font-size: 20px; color: ${BRAND_COLOR};">Welcome to DayOff!</h2>
        <p>Hello <strong>${params.name}</strong>,</p>
        <p>You have been invited by <strong>${params.inviterName || "an Administrator"}</strong> to join as a <strong>${params.role}</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${acceptUrl}" style="background: ${BRAND_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Set Up Your Account</a>
        </div>
    `);
await sendMail({ to: params.email, subject: `Welcome to DayOff: Set up your account`, html, throwOnFailure: false });
}
