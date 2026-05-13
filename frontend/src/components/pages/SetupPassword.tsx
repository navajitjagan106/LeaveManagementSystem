import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getInvitationByToken, acceptInvitation, resetPasswordApi } from "../../api/authApi";
import Loader from "../common/Loader";

const PASSWORD_RULES = [
    { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
    { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
    { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
    { label: "One number", test: (p: string) => /[0-9]/.test(p) },
    { label: "One special character", test: (p: string) => /[!@#$%^&*()_\-+={}[\];':"\\|,.<>/?]/.test(p) },
];

const SetupPassword: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [invitation, setInvitation] = useState<any>(null);
    const [form, setForm] = useState({ password: "", confirmPassword: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [tokenError, setTokenError] = useState("");
    const [passwordFocused, setPasswordFocused] = useState(false);

    useEffect(() => {
        if (!token) return;
        getInvitationByToken(token)
            .then((res) => setInvitation(res.data.data))
            .catch(() => setTokenError("This invitation link is invalid or has expired."));
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        try {
            setLoading(true);
            if (invitation?.type === "reset") {
                await resetPasswordApi({ token: token!, password: form.password });
            } else {
                await acceptInvitation(token!, { password: form.password });
            }
            navigate("/dashboard");
        } catch (err: any) {
            setError(err?.response?.data?.error || "Failed to set up account");
        } finally {
            setLoading(false);
        }
    };

    if (tokenError) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-slate-50 to-indigo-50/50 p-6">
                <div className="text-center p-8 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-red-100 max-w-sm w-full transition-all">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                        {/* Error Shield SVG */}
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <p className="text-red-600 font-bold text-lg mb-2">Invalid Invitation</p>
                    <p className="text-sm text-gray-500 leading-relaxed">{tokenError}</p>
                </div>
            </div>
        );
    }

    if (!invitation) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-slate-50 to-indigo-50/50">
                <div className="flex flex-col items-center gap-3">
                    <Loader />
                    <p className="text-indigo-950 font-semibold text-sm tracking-wide">Loading invitation details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-50">
            <div className="hidden md:flex md:w-2/3 bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-slate-50/30 items-center justify-center p-12 relative border-r border-slate-100">
                <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-blue-100/20 blur-3xl" />
                <div className="absolute bottom-20 right-20 w-72 h-72 rounded-full bg-indigo-100/20 blur-3xl" />

                <div className="max-w-lg text-center flex flex-col items-center gap-8 z-10">
                    <img
                        src="/welcome-illustration.svg"
                        className="w-96 h-96 object-contain"
                        alt="Welcome Illustration"
                    />
                    <div className="space-y-3">
                        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                            Your Leaves, Simplified
                        </h1>
                        <p className="text-slate-500 text-sm max-w-md leading-relaxed font-medium">
                            Request time off, view team holiday calendars, and manage your custom allowances with ease and complete clarity.
                        </p>
                    </div>
                </div>
            </div>

            <div className="w-full md:w-1/3 flex items-center justify-center p-6 sm:p-10 bg-slate-50/20">
                <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl border border-slate-100 flex flex-col gap-6">

                    {/* Header */}
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                            {invitation.type === "reset" ? "Reset Password" : "Activate Account"}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                            {invitation.type === "reset" ? (
                                <>
                                    Hello, <span className="font-bold text-indigo-600">{invitation.name}</span>. Please choose a strong, new secure password for your account.
                                </>
                            ) : (
                                <>
                                    Welcome, <span className="font-bold text-indigo-600">{invitation.name}</span>! Set up a secure password to complete your organization setup.
                                </>
                            )}
                        </p>
                    </div>

                    {/* Metadata Badge */}
                    <div className="bg-slate-50/70 border border-slate-100 rounded-xl px-4 py-3 text-sm">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-0.5">Account Email</span>
                        <span className="font-semibold text-slate-700">{invitation.email}</span>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Password</label>
                            <input
                                type="password"
                                placeholder="Create a strong password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                onFocus={() => setPasswordFocused(true)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-sm"
                                required
                            />
                            {passwordFocused && (
                                <ul className="mt-3 p-3 bg-slate-50/50 border border-slate-100 rounded-xl space-y-2">
                                    {PASSWORD_RULES.map((rule) => {
                                        const passed = rule.test(form.password);
                                        return (
                                            <li key={rule.label} className={`flex items-center gap-2 text-xs transition-colors ${passed ? "text-emerald-600" : "text-slate-400"}`}>
                                                {passed ? (
                                                    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                ) : (
                                                    <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0 flex items-center justify-center text-[8px]">•</div>
                                                )}
                                                <span className={passed ? "font-medium" : ""}>{rule.label}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Confirm Password</label>
                            <input
                                type="password"
                                placeholder="Confirm your password"
                                value={form.confirmPassword}
                                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-sm"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-50 hover:shadow-blue-100 hover:translate-y-[-1px] active:translate-y-[1px] transition-all"
                        >
                            {loading ? (
                                invitation.type === "reset" ? "Resetting Password..." : "Completing Setup..."
                            ) : (
                                invitation.type === "reset" ? "Reset Password & Sign In" : "Activate Account & Sign In"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SetupPassword;
