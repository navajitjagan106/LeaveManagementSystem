import React, { useEffect, useState } from "react";
import { getBalance, updateUserProfile } from "../../api/leaveApi";
import { getMe } from "../../api/authApi";
import { User } from "../../types";
import {
    Mail, Building2, Users, BookOpen, Shield,
    Phone, MapPin, UserRound, CalendarDays, Pencil, Check, X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Input } from "../ui/input";
import { useToast } from "../common/ToastContext";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
    ChartContainer, ChartTooltip, ChartTooltipContent,
    ChartLegend, ChartLegendContent,
} from "../ui/chart";

const PALETTE = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#14b8a6", "#f97316"];
const LIGHT_PALETTE = ["#eef2ff", "#d1fae5", "#fef3c7", "#fee2e2", "#dbeafe", "#fce7f3", "#ccfbf1", "#ffedd5"];

const AVATAR_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#3b82f6", "#ec4899"];
function avatarColor(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]; }

function calcAge(dob: string | null | undefined): string {
    if (!dob) return "";
    const diff = Date.now() - new Date(dob).getTime();
    return `(${Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))} yrs)`;
}

function fmtDob(dob: string | null | undefined): string {
    if (!dob) return "—";
    return new Date(dob).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"];

const getRoleStyle = (role: string) => {
    const r = role.toLowerCase();
    if (r === 'admin') return { bg: "#fee2e2", text: "#ef4444" };
    if (r === 'manager') return { bg: "#ede9fe", text: "#5746AF" };
    if (r === 'hr') return { bg: "#fce7f3", text: "#db2777" };
    if (r === 'employee') return { bg: "#dbeafe", text: "#3b82f6" };
    
    // Deterministic random hex colors matching the modal palette
    const colors = [
        { bg: "#fee2e2", text: "#b91c1c" }, // red
        { bg: "#ffedd5", text: "#c2410c" }, // orange
        { bg: "#fef3c7", text: "#b45309" }, // amber
        { bg: "#d1fae5", text: "#047857" }, // emerald
        { bg: "#ccfbf1", text: "#0f766e" }, // teal
        { bg: "#cffafe", text: "#0e7490" }, // cyan
        { bg: "#e0f2fe", text: "#0369a1" }, // sky
        { bg: "#e0e7ff", text: "#4338ca" }, // indigo
        { bg: "#ede9fe", text: "#6d28d9" }, // violet
        { bg: "#fae8ff", text: "#a21caf" }, // fuchsia
        { bg: "#ffe4e6", text: "#be123c" }  // rose
    ];
    let hash = 0;
    for (let i = 0; i < role.length; i++) {
        hash = role.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

type BalanceItem = { leave_type_id: number; type: string; total_allocated: number; used: number; remaining: number; is_unlimited: boolean };
type WeekDay = { day: string; value: number };

const balanceChartConfig = {
    used: { label: "Used", color: "#f59e0b" },
    remaining: { label: "Remaining", color: "#5746AF" },
};
const weeklyChartConfig = { value: { label: "Days", color: "#5746AF" } };

const Profile: React.FC = () => {
    const toast = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [balance, setBalance] = useState<BalanceItem[]>([]);
    const [weeklyPattern, setWeeklyPattern] = useState<WeekDay[]>([]);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ phone: "", gender: "", date_of_birth: "", location: "" });

    useEffect(() => {
        Promise.all([getMe(), getBalance()])
            .then(([userRes, balRes]) => {
                const u = userRes.data.data;
                setUser(u);
                setForm({
                    phone: u.phone ?? "",
                    gender: u.gender ?? "",
                    date_of_birth: u.date_of_birth ? u.date_of_birth.slice(0, 10) : "",
                    location: u.location ?? "",
                });
                setBalance(balRes.data.leaveBalances ?? []);
                setWeeklyPattern(balRes.data.weeklyPattern ?? []);
            })
            .catch(() => toast.error("Failed to load profile"));
        // eslint-disable-next-line
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateUserProfile({
                phone: form.phone || null,
                gender: form.gender || null,
                date_of_birth: form.date_of_birth || null,
                location: form.location || null,
            });
            setUser(prev => prev ? { ...prev, ...form } : prev);
            setEditing(false);
            toast.success("Profile updated");
        } catch {
            toast.error("Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setForm({
            phone: user?.phone ?? "",
            gender: user?.gender ?? "",
            date_of_birth: user?.date_of_birth ? user.date_of_birth.slice(0, 10) : "",
            location: user?.location ?? "",
        });
        setEditing(false);
    };

    if (!user) return <p className="text-center py-8 text-gray-400">Loading profile…</p>;

    const initials = user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    const color = avatarColor(user.name);
    const roleStyle = getRoleStyle(user.role);

    const employmentFields = [
        { icon: Mail, label: "Email", value: user.email, cls: "break-all" },
        { icon: Shield, label: "Role", value: user.role, cls: "capitalize" },
        { icon: Building2, label: "Department", value: user.department || "—", cls: "" },
        { icon: Users, label: "Reports To", value: (user as any).manager_name || "—", cls: "" },
        { icon: BookOpen, label: "Leave Policy", value: (user as any).policy_name || "—", cls: "" },
    ];

    const personalFields = [
        {
            icon: Phone, label: "Phone",
            iconCls: "text-blue-500", bgCls: "bg-blue-50",
            view: user.phone || "—",
            edit: <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91-XXXXXXXXXX" className="h-7 text-sm px-2" />,
        },
        {
            icon: UserRound, label: "Gender",
            iconCls: "text-pink-500", bgCls: "bg-pink-50",
            view: user.gender || "—",
            edit: (
                <select
                    value={form.gender}
                    onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                    className="w-full h-7 text-sm border border-gray-200 rounded-md px-2 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                    <option value="">Select…</option>
                    {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
            ),
        },
        {
            icon: CalendarDays, label: "Date of Birth",
            iconCls: "text-amber-500", bgCls: "bg-amber-50",
            view: user.date_of_birth ? `${fmtDob(user.date_of_birth)} ${calcAge(user.date_of_birth)}` : "—",
            edit: <Input type="date" value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} className="h-7 text-sm px-2" />,
        },
        {
            icon: MapPin, label: "Location",
            iconCls: "text-emerald-500", bgCls: "bg-emerald-50",
            view: user.location || "—",
            edit: <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="City, State" className="h-7 text-sm px-2" />,
        },
    ];

    const balanceChartData = balance
        .filter(b => !b.is_unlimited)
        .map(b => ({ name: b.type, used: Number(b.used), remaining: Number(b.remaining) }));

    const hasWeekly = weeklyPattern.some(d => d.value > 0);
    const weeklyChartData = weeklyPattern.filter(d => !["Sun", "Sat"].includes(d.day));

    return (
        <div className="flex flex-col gap-3 h-full min-h-0">
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">

                {/* ── LEFT: Profile sidebar ── */}
                <Card className="flex flex-col overflow-hidden shadow-sm border-gray-100">
                    {/* Gradient header */}
                    <div
                        className="flex flex-col items-center text-center px-6 py-8 flex-shrink-0"
                        style={{ background: "linear-gradient(160deg, #5746AF 0%, #302178 100%)" }}
                    >
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white/20 mb-3"
                            style={{ background: color }}
                        >
                            {initials}
                        </div>
                        <h1 className="text-white font-bold text-lg leading-tight">{user.name}</h1>
                        <p className="text-primary-light text-xs mt-1 break-all">{user.email}</p>
                        <span
                            className="mt-3 text-xs font-semibold px-3 py-1 rounded-full capitalize"
                            style={{ background: roleStyle.bg, color: roleStyle.text }}
                        >
                            {user.role}
                        </span>
                    </div>

                    {/* Details — scrollable */}
                    <CardContent className="flex-1 min-h-0 p-5 overflow-y-auto">

                        {/* Employment */}
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Employment</p>
                        <div className="flex flex-col gap-4 mb-6">
                            {employmentFields.map(({ icon: Icon, label, value, cls }) => (
                                <div key={label} className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
                                        <Icon size={13} className="text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
                                        <p className={`text-sm text-gray-800 font-medium mt-0.5 break-words ${cls}`}>{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Personal info */}
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Personal</p>
                            {!editing ? (
                                <button
                                    onClick={() => setEditing(true)}
                                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-dark transition-colors"
                                >
                                    <Pencil size={12} /> Edit
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button onClick={handleCancel} className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors">
                                        <X size={12} /> Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center gap-1 text-xs font-semibold text-white bg-primary hover:bg-primary-dark px-3 py-1 rounded-lg transition-colors disabled:opacity-60"
                                    >
                                        <Check size={12} /> {saving ? "Saving…" : "Save"}
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-4">
                            {personalFields.map(({ icon: Icon, label, iconCls, bgCls, view, edit }) => (
                                <div key={label} className="flex items-start gap-3">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${bgCls}`}>
                                        <Icon size={13} className={iconCls} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                                        {editing ? edit : <p className="text-sm font-medium text-gray-800 break-words">{view}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* ── RIGHT: Balance cards + charts ── */}
                <div className="flex flex-col gap-3 min-h-0">

                    {/* Leave balance mini-cards */}
                    {balance.length > 0 && (
                        <div className="flex-shrink-0">
                            <p className="text-sm font-semibold text-gray-700 mb-2">Leave Balance</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                                {balance.map((item, i) => {
                                    const pct = item.total_allocated > 0 ? Math.round((item.used / item.total_allocated) * 100) : 0;
                                    const col = PALETTE[i % PALETTE.length];
                                    const light = LIGHT_PALETTE[i % LIGHT_PALETTE.length];
                                    return (
                                        <div
                                            key={item.leave_type_id}
                                            className="bg-white border border-gray-100 rounded-xl p-3"
                                            style={{ borderTop: `3px solid ${col}` }}
                                        >
                                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: light, color: col }}>
                                                {item.type}
                                            </span>
                                            {item.is_unlimited ? (
                                                <>
                                                    <div className="mt-2">
                                                        <span className="text-sm font-bold" style={{ color: col }}>Unlimited</span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-400 mt-1">{item.used} days used</p>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="mt-2 flex items-baseline gap-1">
                                                        <span className="text-2xl font-bold" style={{ color: col }}>{item.remaining}</span>
                                                        <span className="text-xs text-gray-400">/ {item.total_allocated}</span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-400 mb-2">days remaining</p>
                                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: col }} />
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 mt-1">{item.used} used · {pct}%</p>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Charts */}
                    <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-2 gap-3">

                        {/* Balance breakdown */}
                        {balanceChartData.length > 0 && (
                            <Card className="shadow-none border border-gray-100 flex flex-col min-h-0">
                                <CardHeader className="pb-1 pt-4 px-5 flex-shrink-0">
                                    <CardTitle className="text-sm">Balance Breakdown</CardTitle>
                                    <CardDescription className="text-xs">Used vs Remaining by leave type</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 min-h-0 px-2 pb-4">
                                    <ChartContainer config={balanceChartConfig} className="h-full w-full">
                                        <BarChart data={balanceChartData} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
                                            <CartesianGrid vertical={false} stroke="#f0f0f0" />
                                            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} tickFormatter={v => v.split(" ")[0]} />
                                            <ChartTooltip content={<ChartTooltipContent className="w-40" />} />
                                            <ChartLegend content={<ChartLegendContent />} />
                                            <Bar dataKey="used" fill={balanceChartConfig.used.color} radius={[3, 3, 0, 0]} maxBarSize={32} />
                                            <Bar dataKey="remaining" fill={balanceChartConfig.remaining.color} radius={[3, 3, 0, 0]} maxBarSize={32} />
                                        </BarChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>
                        )}

                        {/* Weekly leave pattern */}
                        <Card className="shadow-none border border-gray-100 flex flex-col min-h-0">
                            <CardHeader className="pb-1 pt-4 px-5 flex-shrink-0">
                                <CardTitle className="text-sm">Weekly Leave Pattern</CardTitle>
                                <CardDescription className="text-xs">Approved leave frequency by day of week</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 min-h-0 px-2 pb-4">
                                <div className="relative h-full w-full">
                                    <ChartContainer config={weeklyChartConfig} className="h-full w-full">
                                        <BarChart 
                                            data={hasWeekly ? weeklyChartData : ["Mon", "Tue", "Wed", "Thu", "Fri"].map(d => ({ day: d, value: 0.15 }))} 
                                            margin={{ left: 0, right: 8, top: 4, bottom: 4 }}
                                        >
                                            <CartesianGrid vertical={false} stroke="#f0f0f0" />
                                            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                                            <YAxis hide />
                                            {hasWeekly && <ChartTooltip content={<ChartTooltipContent className="w-36" />} />}
                                            <Bar 
                                                dataKey="value" 
                                                fill={hasWeekly ? weeklyChartConfig.value.color : "#E2E8F0"} 
                                                radius={[3, 3, 0, 0]} 
                                                maxBarSize={32} 
                                            />
                                        </BarChart>
                                    </ChartContainer>
                                    {!hasWeekly && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="bg-white/80 border border-gray-100 px-3 py-2 rounded-xl shadow-md backdrop-blur-sm text-center">
                                                <p className="text-xs font-bold text-gray-500">No Approved Leaves Yet</p>
                                                <p className="text-[10px] text-gray-400">Activity will populate here</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
