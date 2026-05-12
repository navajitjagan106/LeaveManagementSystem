import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminDashboardStats } from "../../api/managementApi";
import { getAvatarGradient } from "../../utils/avatar";
import PageHeader from "../common/PageHeader";
import { useAsync } from "../../hooks/useAsync";
import {
    Mail,
    UserCheck, Clock, CalendarCheck, Network, ChevronUp, ChevronDown
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const MONTH_ORDER = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const StatCard = ({ icon: Icon, label, value, sub, color }: any) => (
    <div className="bg-gray-50 rounded-2xl border p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-all duration-300">
        <div className={`p-3 rounded-xl ${color}`}>
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
    const [expanded, setExpanded] = useState(false);
    const navigate = useNavigate();

    const { data, LoadingScreen, execute: loadDashboard } = useAsync(fetchDashboardData, true);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    // Derived stats from api payload
    const stats = useMemo(() => {
        return {
            employees: data?.stats?.employees ?? 0,
            pendingInvites: data?.stats?.pendingInvites ?? 0,
            pendingLeaves: data?.stats?.pendingLeaves ?? 0,
            holidays: data?.stats?.holidays ?? 0
        };
    }, [data]);

    // Derived chart data
    const chartData = useMemo(() => {
        return processChartData(data?.leaves || []);
    }, [data]);

    const renderTreeNode = (node: any, level: number = 1): React.ReactNode => {
        const shouldRenderChildren = expanded || level < 2;
        const hasHiddenChildren = !expanded && node.children && node.children.length > 0 && level >= 2;

        const initials = node.name 
            ? node.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() 
            : "?";

        const getRoleStyles = (roleName: string) => {
            const r = roleName.toLowerCase();
            if (r.includes("admin")) return "bg-rose-50 text-rose-600 border-rose-100";
            if (r.includes("manager")) return "bg-blue-50 text-blue-600 border-blue-100";
            return "bg-slate-50 text-slate-600 border-slate-100";
        };

        const hasChildren = node.children && node.children.length > 0 && shouldRenderChildren;

        return (
            <div key={node.id} className="flex flex-col items-center flex-1">
                {/* Node Card */}
                <div className="flex flex-col items-center relative">
                    <div 
                        onClick={() => navigate(`/employees/${node.id}`)}
                        className="bg-white border border-gray-100 rounded-2xl p-2 shadow-sm hover:shadow-md hover:border-primary-light hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 w-38 group relative flex flex-col items-center text-center cursor-pointer select-none"
                    >
                        {/* Premium Avatar */}
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${getAvatarGradient(node.id)} text-white font-bold text-xs flex items-center justify-center shadow-sm select-none group-hover:scale-105 transition-transform mb-1.5`}>
                            {initials}
                        </div>

                        <p className="text-xs font-bold text-gray-800 group-hover:text-primary transition-colors truncate w-full">{node.name}</p>
                        <p className="text-[10px] text-gray-400 font-medium mb-1.5 truncate w-full">{node.email}</p>

                        <div className="flex items-center gap-1.5 flex-wrap justify-center">
                            {node.department && (
                                <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                    {node.department}
                                </span>
                            )}
                            <span className={`px-2 py-0.5 border rounded-full text-[9px] font-bold uppercase tracking-wider ${getRoleStyles(node.role)}`}>
                                {node.role}
                            </span>
                        </div>

                        {hasHiddenChildren && (
                            <span className="mt-2 px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full text-[9px] font-extrabold shadow-sm animate-pulse">
                                +{node.children.length} reports
                            </span>
                        )}
                    </div>

                    {/* Vertical line going down from the parent node */}
                    {hasChildren && (
                        <div className="w-0.5 h-4 bg-slate-300" />
                    )}
                </div>

                {/* Children Row with Branching Connection Lines */}
                {hasChildren && (
                    <div className="flex relative">
                        {node.children.map((child: any, index: number) => {
                            const isFirst = index === 0;
                            const isLast = index === node.children.length - 1;
                            return (
                                <div key={child.id} className="relative flex flex-col items-center flex-1 px-3">
                                    {/* Horizontal connector lines */}
                                    {node.children.length > 1 && (
                                        <div className="absolute top-0 left-0 right-0 flex">
                                            {/* Left half of the connector */}
                                            <div className={`flex-1 h-0.5 ${isFirst ? "bg-transparent" : "bg-slate-300"}`} />
                                            {/* Right half of the connector */}
                                            <div className={`flex-1 h-0.5 ${isLast ? "bg-transparent" : "bg-slate-300"}`} />
                                        </div>
                                    )}
                                    {/* Vertical line coming up from child to meet the horizontal branch line */}
                                    <div className="w-0.5 h-4 bg-slate-300 relative z-10" />
                                    {renderTreeNode(child, level + 1)}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6 relative min-h-[400px] h-fit flex-shrink-0 pb-10">
            <LoadingScreen />

            <div className="flex items-center gap-3">
                <PageHeader title="Admin Overview" subtitle="Your system at a glance" divider={false} />
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

            {/* Collapsible Corporate Structure (Organization Tree) */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden mt-6">
                <div 
                    onClick={() => setExpanded(!expanded)}
                    className="px-6 py-5 border-b border-gray-100 bg-white flex items-center justify-between cursor-pointer select-none hover:bg-gray-50/50 transition duration-300"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center text-primary shadow-sm">
                            <Network size={20} className="stroke-[2.5px]" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-base">
                                Corporate Reporting Hierarchy
                            </h3>
                            <p className="text-xs text-gray-400 font-medium mt-0.5">
                                {expanded ? "Showing complete organization structure" : "Showing top 2 levels (Admin/Managers → Direct Reports)"}
                            </p>
                        </div>
                    </div>
                    <button className="w-9 h-9 rounded-xl bg-white border border-gray-200 hover:border-primary-light text-gray-500 hover:text-primary shadow-sm hover:shadow flex items-center justify-center transition-all">
                        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                </div>

                <div className="p-6 overflow-x-auto">
                    {data?.orgTree && data.orgTree.length > 0 ? (
                        <div className="flex justify-center p-4 min-w-[max-content]">
                            {data.orgTree.map((root: any) => renderTreeNode(root, 1))}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-gray-400">
                            <p className="text-sm font-medium">No corporate hierarchy data found</p>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 bg-white border-t border-gray-100 flex justify-center">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:border-primary-light text-xs font-bold text-gray-700 hover:text-primary rounded-xl shadow-sm hover:shadow transition-all"
                    >
                        {expanded ? (
                            <>
                                <ChevronUp size={14} className="stroke-[2.5px]" />
                                Collapse Tree View
                            </>
                        ) : (
                            <>
                                <ChevronDown size={14} className="stroke-[2.5px]" />
                                View Full Organization Tree
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
