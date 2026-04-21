import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getInvitationByToken, acceptInvitation } from "../../api/authApi";

const AcceptInvitation: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [invitation, setInvitation] = useState<any>(null);
    const [form, setForm] = useState({ password: "", confirmPassword: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [tokenError, setTokenError] = useState("");

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
            const res = await acceptInvitation(token!, { password: form.password });
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user));
            navigate("/dashboard");
        } catch (err: any) {
            setError(err?.response?.data?.error || "Failed to set up account");
        } finally {
            setLoading(false);
        }
    };

    if (tokenError) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-2xl shadow border max-w-sm">
                    <p className="text-red-500 font-semibold mb-2">Invalid Invitation</p>
                    <p className="text-sm text-gray-500">{tokenError}</p>
                </div>
            </div>
        );
    }

    if (!invitation) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p className="text-gray-500 text-sm">Loading invitation...</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow border">
                <h2 className="text-xl font-semibold text-gray-800 mb-1">Set Up Your Password</h2>
                <p className="text-sm text-gray-500 mb-6">
                    Welcome, <span className="font-medium text-gray-700">{invitation.name}</span>! You've been invited as a{" "}
                    <span className="font-medium text-purple-600">{invitation.role}</span>
                    {invitation.department ? ` in ${invitation.department}` : ""}.
                </p>

                <div className="bg-gray-50 rounded-xl px-4 py-3 mb-6 text-sm text-gray-600">
                    <span className="text-gray-400 text-xs block mb-0.5">Account email</span>
                    {invitation.email}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-600 block mb-1">Password</label>
                        <input
                            type="password"
                            placeholder="Create a password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-600 block mb-1">Confirm Password</label>
                        <input
                            type="password"
                            placeholder="Confirm your password"
                            value={form.confirmPassword}
                            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                        style={{ background: "#5746AF" }}
                    >
                        {loading ? "Setting up..." : "Create Account"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AcceptInvitation;
