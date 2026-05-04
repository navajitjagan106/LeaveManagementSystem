import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllLeaves, getEmployees, getInvitations } from "../../api/adminApi";
import { getHolidays } from "../../api/leaveApi";
import PageHeader from "../common/PageHeader";
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
            className="bg-gray-50 rounded-2xl border p-5 text-left hover:bg-white hover:shadow-sm hover:border-purple-300 transition w-full"
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
    if (!Array.isArray(leaves)) return [];
    const monthMap: Record<string, number> = {};
    leaves.forEach((leave) => {
        if (leave.status?.toLowerCase() !== "approved") return;
        const month = new Date(leave.from_date).toLocaleString("default", { month: "short" });
        monthMap[month] = (monthMap[month] || 0) + 1;
    });
    return MONTH_ORDER.filter((m) => monthMap[m]).map((month) => ({ month, leaves: monthMap[month] }));
};


const AdminDashboard = () => {
    const [stats, setStats] = useState({ employees: 0, pendingInvites: 0, pendingLeaves: 0, holidays: 0 });
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        Promise.all([
            getEmployees(),
            getInvitations("pending"),
            getAllLeaves(),
            getHolidays(),
        ]).then(([emp, inv, leaves, hols]) => {
            const allLeaves = leaves.data.data || [];
            const pendingLeaves = allLeaves.filter((l: any) => l.status === "pending").length;
            setStats({
                employees: (emp.data.data || []).length,
                pendingInvites: (inv.data.data || []).length,
                pendingLeaves,
                holidays: (Array.isArray(hols.data) ? hols.data : []).filter(
                    (h: any) => new Date(h.date) >= new Date()
                ).length,
            });
            setChartData(processChartData(allLeaves));
        });
    }, []);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            <PageHeader title="Admin Overview" subtitle="Your system at a glance" divider />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={UserCheck} label="Total Employees" value={stats.employees} sub="active accounts" color="bg-purple-500" />
                <StatCard icon={Mail} label="Pending Invites" value={stats.pendingInvites} sub="awaiting acceptance" color="bg-blue-500" />
                <StatCard icon={Clock} label="Pending Leaves" value={stats.pendingLeaves} sub="need approval" color="bg-amber-500" />
                <StatCard icon={CalendarCheck} label="Upcoming Holidays" value={stats.holidays} sub="this year" color="bg-emerald-500" />
            </div>

            {chartData.length > 0 && (
                <div className="bg-gray-50 rounded-2xl border p-6">
                    <div className="mb-4">
                        <h3 className="font-semibold text-gray-800">Approved Leaves by Month</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Number of approved leaves per month</p>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={chartData} barSize={28}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 13 }}
                                formatter={(v: any) => [`${v} leaves`, "Approved"]}
                            />
                            <Bar dataKey="leaves" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}


            <div>
                <p className="text-sm font-semibold text-gray-600 mb-3">Quick Actions</p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <ShortcutCard icon={Users} label="Manage Employees" desc="View, edit or remove employees" to="/employees" color="bg-purple-500" />
                    <ShortcutCard icon={Mail} label="Invitations" desc="Invite new team members" to="/admin/invitations" color="bg-blue-500" />
                    <ShortcutCard icon={CalendarDays} label="Leave Types" desc="Configure leave categories" to="/admin/leave-types" color="bg-violet-500" />
                    <ShortcutCard icon={Umbrella} label="Holidays" desc="Add or remove holidays" to="/admin/holidays" color="bg-emerald-500" />
                    <ShortcutCard icon={BookOpen} label="Policies" desc="Define leave entitlements by level" to="/admin/policies" color="bg-indigo-500" />
                    <ShortcutCard icon={ShieldCheck} label="Permissions" desc="Control page access per user" to="/admin/permissions" color="bg-rose-500" />
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
