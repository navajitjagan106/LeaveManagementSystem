import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { getAllLeaves, getEmployees, getInvitations } from "../../api/managementApi";
import { getHolidays } from "../../api/leaveApi";
import PageHeader from "../common/PageHeader";
import { useAsync } from "../../hooks/useAsync";
import {
    Users, Mail, CalendarDays, Umbrella,
    UserCheck, Clock, CalendarCheck, BookOpen, ShieldCheck,
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const MONTH_ORDER = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const StatCard = ({ icon: Icon, label, value, sub, color }: any) => (
    <div className="bg-gray-50 rounded-2xl border p-5 flex items-start gap-4">
        <div className={`p-3 rounded-xl ${color}`}>
            <Icon size={20} className="text-white" />
        </div>
        <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
    </div>
);

const ShortcutCard = ({ icon: Icon, label, desc, to, color }: any) => {
    const navigate = useNavigate();
    return (
        <button
            onClick={() => navigate(to)}
            className="bg-gray-50 rounded-2xl border p-5 text-left hover:bg-white hover:shadow-sm hover:border-primary-light transition w-full"
        >
            <div className={`p-2.5 rounded-xl inline-flex mb-3 ${color}`}>
                <Icon size={18} className="text-white" />
            </div>
            <p className="font-semibold text-gray-800 text-sm">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
        </button>
    );
};

const processChartData = (leaves: any[]) => {
    if (!Array.isArray(leaves)) return MONTH_ORDER.map(month => ({ month, leaves: 0 }));
    const monthMap: Record<string, number> = {};
    leaves.forEach((leave) => {
        if (leave.status?.toLowerCase() !== "approved") return;
        const month = new Date(leave.from_date).toLocaleString("default", { month: "short" });
        monthMap[month] = (monthMap[month] || 0) + 1;
    });
    return MONTH_ORDER.map((month) => ({ month, leaves: monthMap[month] || 0 }));
};

const fetchDashboardData = async () => {
    const [emp, inv, leaves, hols] = await Promise.all([
        getEmployees(),
        getInvitations("pending"),
        getAllLeaves(),
        getHolidays(),
    ]);
    return {
        employees: emp.data.data || [],
        invitations: inv.data.data || [],
        leaves: leaves.data.data || [],
        holidays: hols.data || []
    };
};

const AdminDashboard = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const isAdmin = user?.role === "admin";
    const hasPage = (key: string) => isAdmin || user?.permissions?.[key]?.can_view === true;

    const { data, LoadingScreen, execute: loadDashboard } = useAsync(fetchDashboardData, true);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    // Derived stats from api payload
    const stats = useMemo(() => {
        const empList = data?.employees || [];
        const invList = data?.invitations || [];
        const leaveList = data?.leaves || [];
        const holidayList = data?.holidays || [];

        const pendingLeavesCount = leaveList.filter((l: any) => l.status === "pending").length;
        const activeHolsCount = holidayList.filter((h: any) => new Date(h.date) >= new Date()).length;

        return {
            employees: empList.length,
            pendingInvites: invList.length,
            pendingLeaves: pendingLeavesCount,
            holidays: activeHolsCount
        };
    }, [data]);

    // Derived chart data
    const chartData = useMemo(() => {
        return processChartData(data?.leaves || []);
    }, [data]);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6 relative min-h-[400px] h-fit flex-shrink-0 pb-10">
            <LoadingScreen />

            <div className="flex items-center gap-3">
                <PageHeader title="Admin Overview" subtitle="Your system at a glance" divider={false} />
                {/* Small cute Admin illustration next to title */}
                <img 
                    src="/Admin-rafiki.svg" 
                    className="w-10 h-10 object-contain select-none opacity-85 hover:scale-110 transition-transform duration-300 hidden sm:block flex-shrink-0" 
                    alt="Admin Graphic" 
                />
            </div>
            <hr className="border-gray-100" />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={UserCheck} label="Total Employees" value={stats.employees} sub="active accounts" color="bg-primary" />
                <StatCard icon={Mail} label="Pending Invites" value={stats.pendingInvites} sub="awaiting acceptance" color="bg-secondary" />
                <StatCard icon={Clock} label="Pending Leaves" value={stats.pendingLeaves} sub="need approval" color="bg-primary-dark" />
                <StatCard icon={CalendarCheck} label="Upcoming Holidays" value={stats.holidays} sub="this year" color="bg-primary" />
            </div>

            {chartData.length > 0 && (() => {
                const chartHasData = chartData.some(d => d.leaves > 0);
                return (
                    <div className="bg-gray-50 rounded-2xl border p-6 relative">
                        <div className="mb-4 flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold text-gray-800">Approved Leaves by Month</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Number of approved leaves per month</p>
                            </div>
                            {!chartHasData && (
                                <span className="px-2.5 py-1 bg-gray-200/60 text-gray-500 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                                    Skeleton View (No Data)
                                </span>
                            )}
                        </div>
                        <div className="relative">
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={chartHasData ? chartData : chartData.map(d => ({ ...d, leaves: 0.15 }))} barSize={28}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                    {chartHasData && (
                                        <Tooltip
                                            contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 13 }}
                                            formatter={(v: any) => [`${v} leaves`, "Approved"]}
                                        />
                                    )}
                                    <Bar dataKey="leaves" fill={chartHasData ? "#7c3aed" : "#E2E8F0"} radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                            {!chartHasData && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="bg-white/80 border border-gray-100 px-4 py-2.5 rounded-xl shadow-lg backdrop-blur-sm text-center">
                                        <p className="text-xs font-bold text-gray-600">No Approved Leaves Yet</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">Active data will populate automatically</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}

            <div>
                <p className="text-sm font-semibold text-gray-600 mb-3">Quick Actions</p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {(hasPage("team_access") || hasPage("manage_employees")) && (
                        <ShortcutCard icon={Users} label="Manage Employees" desc="View, edit or remove employees" to="/employees" color="bg-primary" />
                    )}
                    {hasPage("manage_invitations") && (
                        <ShortcutCard icon={Mail} label="Invitations" desc="Invite new team members" to="/management/invitations" color="bg-blue-500" />
                    )}
                    {hasPage("manage_leave_types") && (
                        <ShortcutCard icon={CalendarDays} label="Leave Types" desc="Configure leave categories" to="/management/leave-types" color="bg-violet-500" />
                    )}
                    {(hasPage("manage_holidays") || !isAdmin) && (
                        <ShortcutCard icon={Umbrella} label="Holidays" desc="Add or remove holidays" to="/holidays" color="bg-emerald-500" />
                    )}
                    {hasPage("manage_policies") && (
                        <ShortcutCard icon={BookOpen} label="Policies" desc="Define leave entitlements by level" to="/management/policies" color="bg-indigo-500" />
                    )}
                    {isAdmin && (
                        <ShortcutCard icon={ShieldCheck} label="Permissions" desc="Control page access per user" to="/management/permissions" color="bg-rose-500" />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
