import React, { useEffect, useState } from 'react';
import StatCard from "../common/cards/StatCard";
import { getDashboard } from "../../api/leaveApi";
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { DashboardData } from "../../types";
import PageHeader from '../common/PageHeader';
import Loader from '../common/Loader';
import { CalendarCheck, CalendarMinus, Clock, BookOpen, FileText, Users, ChevronRight, Network, ArrowRight } from "lucide-react";
import { PieChart, Pie, Label } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";
import OrgChartModal from "../modals/OrgChartModal";

const COLORS = ["#274C77", "#6096BA", "#A3CEF1", "#1B3655", "#64748B"];

const DashBoard: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
    const { holidays } = useOutletContext<{ holidays: any[] }>();
    const navigate = useNavigate();

    useEffect(() => {
        getDashboard()
            .then((res) => setData(res.data))
            .catch(() => setError("Failed to load dashboard"))
            .finally(() => setLoading(false));
    }, []);

    const today = new Date();
    const toLocalStr = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const todayHoliday = holidays.find((h) => toLocalStr(new Date(h.date)) === toLocalStr(today));
    const upcomingHolidays = holidays.filter((h) => new Date(h.date) >= today);

    if (error) return <p className="text-red-500 p-6">{error}</p>;
    if (loading || !data) return <div className="flex justify-center items-center h-48"><Loader /></div>;

    const stats = [
        { label: "Available", value: data.leave_balance.reduce((s, i) => s + ((i as any).is_unlimited ? 0 : Math.max(i.remaining, 0)), 0), icon: CalendarCheck, accent: "#274C77", bg: "#E8F1F5" },
        { label: "Used This Year", value: data.leave_balance.reduce((s, i) => s + i.used, 0), icon: CalendarMinus, accent: "#274C77", bg: "#E8F1F5" },
        { label: "Pending", value: data.pending_requests, icon: Clock, accent: "#274C77", bg: "#E8F1F5" },
        { label: "Total Entitled", value: data.leave_balance.reduce((s, i) => s + ((i as any).is_unlimited ? 0 : i.total_allocated), 0), icon: BookOpen, accent: "#274C77", bg: "#E8F1F5" },
    ];

    const totalUsed = data.leave_balance.reduce((s, i) => s + i.used, 0);
    const totalAlloc = data.leave_balance.reduce((s, i) => s + i.total_allocated, 0);

    const pieData = data.leave_balance
        .filter(lb => lb.used > 0)
        .map((lb, i) => ({ name: lb.name, value: lb.used, fill: COLORS[i % COLORS.length] }));
    const emptyPie = [{ name: "unused", value: 1, fill: "#e5e7eb" }];
    const donutData = pieData.length > 0 ? pieData : emptyPie;
    const donutConfig = data.leave_balance.reduce((acc, item, i) => {
        acc[item.name] = { label: item.name, color: COLORS[i % COLORS.length] };
        return acc;
    }, {} as Record<string, { label: string; color: string }>);

    const hour = today.getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    const leaveCount = data.leave_balance.length;
    const donutSize = Math.min(220, Math.max(160, 130 + leaveCount * 12));
    const innerRadius = Math.round(donutSize * 0.30);
    const outerRadius = Math.round(donutSize * 0.46);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3">
            <PageHeader title="Dashboard" subtitle="Overview of your leave activity" divider />

            <div className="bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-5 rounded-2xl flex items-center justify-between relative overflow-hidden min-h-[130px]">
                <div className="absolute top-0 right-0 w-64 h-full bg-white/5 rounded-full blur-2xl transform translate-x-20 pointer-events-none" />
                <div className="z-10 max-w-[65%] sm:max-w-[75%]">
                    <p className="text-xs text-primary-light mb-1">
                        {today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <h1 className="text-2xl font-bold mb-1">
                        {greeting}, {user?.name?.split(" ")[0] || "there"}!
                    </h1>
                    <p className="text-primary-light text-xs sm:text-sm">
                        {data.pending_requests > 0
                            ? `You have ${data.pending_requests} pending leave request${data.pending_requests > 1 ? "s" : ""}.`
                            : "No pending requests — all caught up!"}
                    </p>
                </div>
                <div className="absolute right-4 bottom-0 top-0 hidden md:flex items-center justify-center w-44 z-10 pointer-events-none">
                    <img src="/Dashboard.svg" className="h-[120%] object-contain transform translate-y-3 select-none" alt="Dashboard Illustration" />
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {stats.map((s) => (
                    <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} accent={s.accent} bg={s.bg} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                <div className="lg:col-span-3 flex flex-col gap-3">
                    {/* Leave Balance Chart */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-800">Leave Balance</h3>
                            <span className="text-xs px-3 py-1 rounded-full font-medium bg-primary-light text-primary">
                                {totalAlloc - totalUsed} / {totalAlloc} remaining
                            </span>
                        </div>

                        <div className="flex items-center gap-4 flex-1">
                            <ChartContainer
                                config={donutConfig}
                                style={{ width: donutSize, height: donutSize, flexShrink: 0 }}
                            >
                                <PieChart>
                                    {pieData.length > 0 && <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />}
                                    <Pie
                                        data={donutData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={innerRadius}
                                        outerRadius={outerRadius}
                                        strokeWidth={3}
                                        stroke="white"
                                    >
                                        <Label
                                            content={({ viewBox }) => {
                                                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                    return (
                                                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                                            <tspan x={viewBox.cx} y={viewBox.cy} style={{ fontSize: Math.round(donutSize * 0.15), fontWeight: 700, fill: "#1f2937" }}>{totalUsed}</tspan>
                                                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) + Math.round(donutSize * 0.1)} style={{ fontSize: Math.round(donutSize * 0.07), fill: "#9ca3af" }}>used</tspan>
                                                        </text>
                                                    );
                                                }
                                            }}
                                        />
                                    </Pie>
                                </PieChart>
                            </ChartContainer>

                            <div className="flex-1 space-y-2">
                                {data.leave_balance.map((item, i) => {
                                    const color = COLORS[i % COLORS.length];
                                    const isUnlimited = (item as any).is_unlimited;
                                    const pct = isUnlimited ? 100 : item.total_allocated > 0 ? (item.used / item.total_allocated) * 100 : 0;
                                    return (
                                        <div key={item.name}>
                                            <div className="flex justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                                                    <span className="text-xs text-gray-500">{item.name}</span>
                                                </div>
                                                <span className="text-xs font-semibold text-gray-700">
                                                    {item.used}{isUnlimited ? " (∞)" : `/${item.total_allocated}`}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: isUnlimited ? `${Math.min(item.used * 10, 100)}%` : `${pct}%`, background: color }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Org Tree Shortcut - Smaller Size */}
                    <div
                        onClick={() => setIsOrgModalOpen(true)}
                        className="group relative h-20 rounded-2xl overflow-hidden bg-gradient-to-r from-primary to-primary-dark cursor-pointer shadow-md hover:shadow-lg transition-all duration-500"
                    >
                        <div className="absolute top-0 right-0 w-64 h-full bg-white/5 rounded-full blur-3xl transform translate-x-20 group-hover:scale-110 transition-transform duration-700" />
                        <div className="relative h-full px-6 flex items-center justify-between z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-xl group-hover:bg-white group-hover:text-primary transition-all duration-500">
                                    <Network size={20} className="group-hover:rotate-12 transition-transform duration-500" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white tracking-tight">Organization Structure</h3>
                                    <p className="text-[10px] text-primary-light font-medium">Explore company hierarchy</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-white/50 group-hover:text-white text-[10px] font-bold group-hover:translate-x-1 transition-transform duration-300">
                                View Tree <ArrowRight size={12} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 flex flex-col gap-3">
                    {/* Apply Leave Shortcut - Smaller Size */}
                    <div
                        onClick={() => navigate("/apply-leave")}
                        className="group relative h-20 rounded-2xl overflow-hidden bg-gradient-to-r from-primary to-primary-dark shadow-md hover:shadow-lg transition-all duration-500"
                    >
                        <div className="relative h-full px-6 flex items-center justify-between z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 transition-all group-hover:scale-110">
                                    <FileText size={20} className="text-white group-hover:rotate-12 transition-transform duration-500" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white tracking-tight">Apply for Leave</h3>
                                    <p className="text-[10px] text-primary-light font-medium">Submit new request</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>

                    {/* Upcoming Holidays - 2 Items */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-800">Upcoming Holidays</h3>
                            <button onClick={() => navigate("/holidays")} className="text-xs text-primary hover:text-primary-dark font-medium hover:underline">View All →</button>
                        </div>
                        {upcomingHolidays.length === 0
                            ? <p className="text-xs text-gray-400">No upcoming holidays</p>
                            : (
                                <div className="space-y-2">
                                    {upcomingHolidays.slice(0, 2).map((h, i) => {
                                        const d = new Date(h.date);
                                        return (
                                            <div key={i} className="flex items-center gap-3 group cursor-pointer">
                                                <div className="w-9 h-9 rounded-lg bg-primary-light flex flex-col items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
                                                    <span className="text-[7px] font-bold text-primary uppercase leading-none">{d.toLocaleDateString("en-GB", { month: "short" })}</span>
                                                    <span className="text-xs font-bold text-primary-dark leading-tight">{d.getDate()}</span>
                                                </div>
                                                <span className="text-xs text-gray-600 font-medium group-hover:text-primary transition-colors">{h.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                    </div>

                    {/* Team Members on Leave - Integrated Here */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex-1 min-h-[140px]">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3">Team Absence</h3>
                        {todayHoliday ? (
                            <div className="text-[11px] font-medium text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-100">Holiday: {todayHoliday.name}</div>
                        ) : data.team_on_leave.length === 0 ? (
                            <div className="flex items-center gap-2 text-xs text-green-600 font-medium"><Users size={14} /> Everyone present</div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex -space-x-2 overflow-hidden">
                                    {data.team_on_leave.slice(0, 5).map((member, i) => (
                                        <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-primary-light text-primary  items-center justify-center text-[10px] font-bold border border-white" title={member.name}>
                                            {member.name.charAt(0).toUpperCase()}
                                        </div>
                                    ))}
                                    {data.team_on_leave.length > 5 && (
                                        <div className="flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 text-gray-400 text-[9px] font-bold">+{data.team_on_leave.length - 5}</div>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-400 font-medium">
                                    {data.team_on_leave.length} team member{data.team_on_leave.length > 1 ? 's' : ''} out today
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <OrgChartModal isOpen={isOrgModalOpen} onClose={() => setIsOrgModalOpen(false)} />
        </div>
    );
};

export default DashBoard;
