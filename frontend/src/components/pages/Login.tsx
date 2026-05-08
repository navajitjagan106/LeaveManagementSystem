import React, { useEffect, useRef, useState } from "react";
import { login, verifyOtp } from "../../api/authApi";
import { useNavigate } from "react-router-dom";
import { OTPInput, SlotProps } from "input-otp";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import { fetchMe } from "../../store/slices/authSlice";

const OtpSlot = (props: SlotProps) => (
    <div
        className={`w-11 h-12 border-2 rounded-xl flex items-center justify-center text-lg font-semibold transition-all
            ${props.isActive ? "border-primary bg-primary-light" : "border-gray-200 bg-white"}
            ${props.char ? "text-gray-900" : "text-gray-300"}`}
    >
        {props.char ?? <span className="text-gray-300">·</span>}
        {props.hasFakeCaret && (
            <span className="animate-pulse text-primary-light0 ml-0.5">|</span>
        )}
    </div>
);

const Login: React.FC = () => {
    const { user, initialized } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch<AppDispatch>();
    const [step, setStep] = useState<"credentials" | "otp">("credentials");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const navigate = useNavigate();
    const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!initialized) {
            dispatch(fetchMe());
        }
    }, [dispatch, initialized]);

    useEffect(() => {
        if (initialized && user) {
            navigate(user.role === "admin" ? "/management" : "/dashboard");
        }
    }, [initialized, user, navigate]);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        cooldownRef.current = setInterval(() => {
            setResendCooldown((c) => {
                if (c <= 1) { clearInterval(cooldownRef.current!); return 0; }
                return c - 1;
            });
        }, 1000);
        return () => clearInterval(cooldownRef.current!);
    }, [resendCooldown]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await login({ email, password });
            if (res.data.step === "otp_required") {
                setStep("otp");
                setResendCooldown(60);
            }
        } catch (err: any) {
            setError(err?.response?.data?.error || "Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.length !== 6) return;
        setError("");
        setLoading(true);
        try {
            const res = await verifyOtp({ email, code: otp });
            const role = res.data.user?.role;
            setTimeout(() => {
                window.location.href = role === "admin" ? "/management" : "/dashboard";
            }, 100);
        } catch (err: any) {
            setError(err?.response?.data?.error || "Invalid or expired OTP");
            setOtp("");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setError("");
        setOtp("");
        setLoading(true);
        try {
            await login({ email, password });
            setResendCooldown(60);
        } catch {
            setError("Failed to resend OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen">
            {/* ── Left Pane: Soft Blue-Tinted Welcome Panel (2/3 Width on Desktop) ── */}
            <div className="hidden md:flex md:w-2/3 bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-slate-50/30 items-center justify-center p-12 relative border-r border-slate-100">
                {/* Clean, subtle geometric elements in matching light tints */}
                <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-blue-100/20 blur-3xl" />
                <div className="absolute bottom-20 right-20 w-72 h-72 rounded-full bg-indigo-100/20 blur-3xl" />
                
                <div className="max-w-lg text-center flex flex-col items-center gap-8 z-10">
                    <img 
                        src="/login-illustration.svg" 
                        className="w-96 h-96 object-contain" 
                        alt="Login Illustration" 
                    />
                    <div className="space-y-3">
                        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                            Access Your Dashboard
                        </h1>
                        <p className="text-slate-500 text-sm max-w-md leading-relaxed font-medium">
                            Secure workspace with automated OTP verification to protect your leave requests, allowances, and team calendars.
                        </p>
                    </div>
                </div>
            </div>

            <div className="w-full md:w-1/3 flex flex-col justify-between px-12 py-10 bg-white">
                <div className="flex flex-col justify-center flex-1">

                    {step === "credentials" ? (
                        <>
                            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Login to LeaveMS</h2>
                            <p className="text-sm text-gray-400 mb-8">Enter your credentials to continue</p>

                            <form onSubmit={handleLogin} className="flex flex-col gap-4">
                                <div>
                                    <label className="text-sm text-gray-600 mb-1 block">Email</label>
                                    <input
                                        type="email"
                                        placeholder="you@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600 mb-1 block">Password</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
                                        required
                                    />
                                </div>

                                {error && <p className="text-red-500 text-sm">{error}</p>}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 rounded-xl text-white text-sm font-bold mt-2 disabled:opacity-60 bg-primary hover:bg-primary-dark shadow-md shadow-blue-50 transition-all"
                                >
                                    {loading ? "Checking…" : "Continue"}
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => { setStep("credentials"); setError(""); setOtp(""); }}
                                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-8 w-fit"
                            >
                                ← Back
                            </button>

                            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Check your email</h2>
                            <p className="text-sm text-gray-400 mb-1">
                                We sent a 6-digit code to
                            </p>
                            <p className="text-sm font-medium text-gray-700 mb-8">{email}</p>

                            <OTPInput
                                maxLength={6}
                                value={otp}
                                onChange={setOtp}
                                onComplete={handleVerifyOtp}
                                render={({ slots }) => (
                                    <div className="flex gap-2 mb-6">
                                        {slots.map((slot, i) => <OtpSlot key={i} {...slot} />)}
                                    </div>
                                )}
                            />

                            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                            <button
                                onClick={handleVerifyOtp}
                                disabled={loading || otp.length !== 6}
                                className="w-full py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50 bg-primary hover:bg-primary-dark shadow-md shadow-blue-50 transition-all"
                            >
                                {loading ? "Verifying…" : "Verify & Login"}
                            </button>

                            <div className="mt-4 text-center">
                                {resendCooldown > 0 ? (
                                    <p className="text-sm text-gray-400">Resend in {resendCooldown}s</p>
                                ) : (
                                    <button
                                        onClick={handleResend}
                                        className="text-sm text-primary hover:underline"
                                    >
                                        Resend code
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="text-xs text-gray-400 text-center">
                    By logging in, you agree to our{" "}
                    <span className="underline cursor-pointer">Terms of Use</span> and{" "}
                    <span className="underline cursor-pointer">Privacy Policy</span>
                </div>
            </div>
        </div>
    );
};

export default Login;
