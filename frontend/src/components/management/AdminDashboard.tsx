import { useEffect, useMemo, useState } from "react";
import { getAdminDashboardStats } from "../../api/managementApi";
import PageHeader from "../common/PageHeader";
import { useAsync } from "../../hooks/useAsync";
import {
    Mail,
    UserCheck, Clock, CalendarCheck, Network, ArrowRight
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import AdminOrgChartModal from "../modals/AdminOrgChartModal";

const MONTH_ORDER = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const StatCard = ({ icon: Icon, label, value, sub, color }: any) => (
    <div className="bg-gray-50 rounded-2xl border p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-all duration-300 group">
        <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform`}>
            <Icon size={20} className="text-white" />
        </div>
        <div>
            <p className="text-sm text-gray-500 font-medium">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
    </div>
);

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
    const res = await getAdminDashboardStats();
    return res.data;
};

const AdminDashboard = () => {
    const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
    const { data, LoadingScreen, execute: loadDashboard } = useAsync(fetchDashboardData, true);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const stats = useMemo(() => ({
        employees: data?.stats?.employees ?? 0,
        pendingInvites: data?.stats?.pendingInvites ?? 0,
        pendingLeaves: data?.stats?.pendingLeaves ?? 0,
        holidays: data?.stats?.holidays ?? 0
    }), [data]);

    const chartData = useMemo(() => processChartData(data?.leaves || []), [data]);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6 relative min-h-[400px] h-fit flex-shrink-0 pb-10">
            <LoadingScreen />

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <PageHeader title="Admin Overview" subtitle="Your system at a glance" divider={false} />
                    <img 
                        src="/Admin-rafiki.svg" 
                        className="w-10 h-10 object-contain select-none opacity-85 hover:scale-110 transition-transform duration-300 hidden sm:block flex-shrink-0" 
                        alt="Admin Graphic" 
                    />
                </div>
            </div>
            <hr className="border-gray-100" />

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={UserCheck} label="Total Employees" value={stats.employees} sub="active accounts" color="bg-primary" />
                <StatCard icon={Mail} label="Pending Invites" value={stats.pendingInvites} sub="awaiting acceptance" color="bg-[#6096BA]" />
                <StatCard icon={Clock} label="Pending Leaves" value={stats.pendingLeaves} sub="need approval" color="bg-primary-dark" />
                <StatCard icon={CalendarCheck} label="Upcoming Holidays" value={stats.holidays} sub="this year" color="bg-primary" />
            </div>

            {/* Chart Section */}
            <div className="bg-gray-50 rounded-2xl border p-6 relative">
                <div className="mb-4 flex justify-between items-start">
                    <div>
                        <h3 className="font-semibold text-gray-800">Approved Leaves by Month</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Approved leaves per month</p>
                    </div>
                </div>
                <div className="relative">
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={chartData.some(d => d.leaves > 0) ? chartData : chartData.map(d => ({ ...d, leaves: 0.15 }))} barSize={28}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 13 }}
                                formatter={(v: any) => [`${v} leaves`, "Approved"]}
                            />
                            <Bar dataKey="leaves" fill="#274C77" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Corporate Hierarchy Shortcut - Sleek Compact Bar */}
            <div 
                onClick={() => setIsOrgModalOpen(true)}
                className="group relative h-14 rounded-2xl overflow-hidden bg-gradient-to-r from-primary to-primary-dark cursor-pointer shadow-sm hover:shadow-md transition-all duration-500"
            >
                <div className="absolute top-0 right-0 w-96 h-full bg-white/5 rounded-full blur-3xl transform translate-x-20 group-hover:scale-125 transition-transform duration-700" />
                
                <div className="relative h-full px-6 flex items-center justify-between z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-xl group-hover:bg-white group-hover:text-primary transition-all duration-500">
                            <Network size={18} className="group-hover:rotate-12 transition-transform duration-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white tracking-tight">Corporate Hierarchy</h3>
                            <p className="text-[10px] text-primary-light font-medium opacity-70">Org Tree View</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-white/50 group-hover:text-white text-[10px] font-bold group-hover:translate-x-1 transition-transform duration-300">
                        View Tree <ArrowRight size={12} />
                    </div>
                </div>
            </div>

            <AdminOrgChartModal 
                isOpen={isOrgModalOpen} 
                onClose={() => setIsOrgModalOpen(false)} 
            />
        </div>
    );
};

export default AdminDashboard;
