import React, { useEffect, useState } from 'react';
import StatCard from "../common/cards/StatCard";
import { getDashboard } from "../../api/leaveApi";
import { getUserLocal } from '../../utils/getUser';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { DashboardData, User } from "../../types";
import PageHeader from '../common/PageHeader';
import Loader from '../common/Loader';
import { CalendarCheck, CalendarMinus, Clock, BookOpen, FileText, Users, ChevronRight } from "lucide-react";
import { PieChart, Pie, Label } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#14b8a6", "#f97316"];

const DashBoard: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { holidays } = useOutletContext<{ holidays: any[] }>();
    const navigate = useNavigate();

    useEffect(() => { setUser(getUserLocal()); }, []);
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
        { label: "Available",      value: data.leave_balance.reduce((s, i) => s + i.remaining, 0),       icon: CalendarCheck, accent: "#10b981", bg: "#d1fae5" },
        { label: "Used This Year", value: data.leave_balance.reduce((s, i) => s + i.used, 0),            icon: CalendarMinus, accent: "#f59e0b", bg: "#fef3c7" },
        { label: "Pending",        value: data.pending_requests,                                           icon: Clock,         accent: "#3b82f6", bg: "#dbeafe" },
        { label: "Total Entitled", value: data.leave_balance.reduce((s, i) => s + i.total_allocated, 0), icon: BookOpen,      accent: "#5746AF", bg: "#ede9fe" },
    ];

    const totalUsed  = data.leave_balance.reduce((s, i) => s + i.used, 0);
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
    const hour       = today.getHours();
    const greeting   = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    return (
        <div className="flex flex-col gap-5 pb-6">
            <PageHeader title="Dashboard" subtitle="Overview of your leave activity" />

            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-[#5746AF] to-[#302178] text-white px-8 py-7 rounded-2xl flex items-center justify-between">
                <div>
                    <p className="text-sm text-purple-200 mb-1">
                        {today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <h1 className="text-2xl font-bold mb-1">
                        {greeting}, {user?.name?.split(" ")[0] || "there"}!
                    </h1>
                    <p className="text-purple-200 text-sm">
                        {data.pending_requests > 0
                            ? `You have ${data.pending_requests} pending leave request${data.pending_requests > 1 ? "s" : ""}.`
                            : "No pending requests — all caught up!"}
                    </p>
                </div>
                <CalendarCheck size={44} className="text-purple-300 opacity-40 hidden md:block" />
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s) => (
                    <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} accent={s.accent} bg={s.bg} />
                ))}
            </div>

            {/* Leave Balance + Side column */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                {/* Leave Balance — 3 cols */}
                <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-semibold text-gray-800">Leave Balance</h3>
                        <span className="text-xs px-3 py-1 rounded-full font-medium bg-purple-50 text-purple-600">
                            {totalAlloc - totalUsed} / {totalAlloc} remaining
                        </span>
                    </div>
                    <div className="flex gap-8 items-start">
                        {/* Donut — shadcn ChartContainer */}
                        <ChartContainer
                            config={donutConfig}
                            className="flex-shrink-0"
                            style={{ width: 130, height: 130 }}
                        >
                            <PieChart>
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                <Pie
                                    data={donutData}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={38}
                                    outerRadius={52}
                                    strokeWidth={2}
                                    stroke="white"
                                >
                                    <Label
                                        content={({ viewBox }) => {
                                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                return (
                                                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                                        <tspan x={viewBox.cx} y={viewBox.cy} style={{ fontSize: 20, fontWeight: 700, fill: "#1f2937" }}>
                                                            {totalUsed}
                                                        </tspan>
                                                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 18} style={{ fontSize: 10, fill: "#9ca3af" }}>
                                                            used
                                                        </tspan>
                                                    </text>
                                                );
                                            }
                                        }}
                                    />
                                </Pie>
                            </PieChart>
                        </ChartContainer>

                        {/* Breakdown bars */}
                        <div className="flex-1 space-y-3.5">
                            {data.leave_balance.map((item, i) => {
                                const pct = item.total_allocated > 0 ? (item.used / item.total_allocated) * 100 : 0;
                                const color = COLORS[i % COLORS.length];
                                return (
                                    <div key={item.name}>
                                        <div className="flex justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                                                <span className="text-xs text-gray-500">{item.name}</span>
                                            </div>
                                            <span className="text-xs font-semibold text-gray-700">{item.used}/{item.total_allocated}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                            <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right col — 2 cols */}
                <div className="lg:col-span-2 flex flex-col gap-5">
                    {/* Apply Leave CTA */}
                    <div
                        className="rounded-2xl p-6 flex flex-col justify-between cursor-pointer group"
                        style={{ background: "linear-gradient(135deg, #5746AF 0%, #302178 100%)", minHeight: 150 }}
                        onClick={() => navigate("/apply-leave")}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-white/20">
                                    <FileText size={17} className="text-white" />
                                </div>
                                <h3 className="text-sm font-semibold text-white mb-1">Apply for Leave</h3>
                                <p className="text-xs text-purple-200">Submit a new leave request</p>
                            </div>
                            <ChevronRight size={16} className="text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>

                    {/* Upcoming Holidays */}
                    <div className="bg-white rounded-2xl p-5 flex-1 shadow-sm border border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-800 mb-4">Upcoming Holidays</h3>
                        {upcomingHolidays.length === 0
                            ? <p className="text-xs text-gray-400">No upcoming holidays</p>
                            : (
                                <div className="space-y-3">
                                    {upcomingHolidays.slice(0, 3).map((h, i) => {
                                        const d = new Date(h.date);
                                        return (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-purple-50 flex flex-col items-center justify-center flex-shrink-0">
                                                    <span className="text-[9px] font-bold text-purple-400 uppercase leading-none">
                                                        {d.toLocaleDateString("en-GB", { month: "short" })}
                                                    </span>
                                                    <span className="text-base font-bold text-purple-700 leading-tight">{d.getDate()}</span>
                                                </div>
                                                <span className="text-xs text-gray-600">{h.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                    </div>
                </div>
            </div>

            {/* Team on Leave */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">Team Members on Leave</h3>
                {todayHoliday ? (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100">
                        <span>🎉</span>
                        <p className="text-sm font-medium text-amber-700">Today is a holiday — {todayHoliday.name}</p>
                    </div>
                ) : data.team_on_leave.length === 0 ? (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-100">
                        <Users size={15} className="text-green-500" />
                        <p className="text-sm text-green-600">Everyone is in today</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
                        {data.team_on_leave.map((member, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <div
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                                    style={{ background: `${COLORS[i % COLORS.length]}20`, color: COLORS[i % COLORS.length] }}
                                >
                                    {member.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">{member.name}</p>
                                    <p className="text-xs text-gray-400">
                                        {new Date(member.from_date).toLocaleDateString("en-GB")} → {new Date(member.to_date).toLocaleDateString("en-GB")}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashBoard;
