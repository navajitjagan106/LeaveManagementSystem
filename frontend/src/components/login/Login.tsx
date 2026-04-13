import React, { useEffect, useState } from "react";
import { login } from "../../api/authApi";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) navigate("/dashboard");
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            const res = await login({ email, password });
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user));
            navigate("/dashboard");
        } catch (err) {
            setError("Invalid email or password ");
        }
    };

    return (
        <div className="flex h-screen">
            <div className="hidden md:block w-2/3 relative">
                <img
                    src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&auto=format&fit=crop"
                    alt="background"
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="w-full md:w-1/3 flex flex-col justify-between px-12 py-10 bg-white">
                
                <div className="flex flex-col justify-center flex-1">
            
                    <h2 className="text-2xl font-semibold text-gray-800 mb-8">
                        Login to LeaveMS
                    </h2>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="text-sm text-gray-600 mb-1 block">Email</label>
                            <input
                                type="email"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
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
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                                required
                            />
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm">{error}</p>
                        )}

                        <button
                            type="submit"
                            className="w-full py-2.5 rounded-lg text-white text-sm font-medium mt-2"
                            style={{ background: "var(--theme-color, #5746AF)" }}
                        >
                            Login
                        </button>
                    </form>
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