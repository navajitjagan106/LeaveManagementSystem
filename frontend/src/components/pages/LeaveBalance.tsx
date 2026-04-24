import React, { useEffect, useState } from 'react';
import { getBalance } from '../../api/leaveApi';
import {
    PieChart, Pie, Label,
    AreaChart, Area,
    XAxis, CartesianGrid,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import PageHeader from '../common/PageHeader';
import { Loader, TrendingUp } from 'lucide-react';

type LeaveBalanceType = {
    type: string;
    used: number;
    total_allocated: number;
    remaining: number;
};

const PALETTE      = ["#6366f1","#10b981","#f59e0b","#ef4444","#3b82f6","#ec4899","#14b8a6","#f97316"];
const LIGHT_PALETTE= ["#eef2ff","#d1fae5","#fef3c7","#fee2e2","#dbeafe","#fce7f3","#ccfbf1","#ffedd5"];

/* ── Ring card ─────────────────────────────────────────────────── */
const RingCard: React.FC<{ item: LeaveBalanceType; color: string; light: string }> = ({ item, color, light }) => {
    const remaining = Number(item.total_allocated) - Number(item.used);
    const pct       = item.total_allocated > 0 ? Number(item.used) / Number(item.total_allocated) : 0;
    const size = 68; const radius = 27;
    const circ   = 2 * Math.PI * radius;
    const offset = circ * (1 - pct);

    return (
        <div
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col gap-4"
            style={{ borderTop: `3px solid ${color}` }}
        >
            <div className="flex items-start justify-between">
                <div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: light, color }}>
                        {item.type}
                    </span>
                    <p className="text-xs text-gray-400 mt-2">{item.used} of {item.total_allocated} used</p>
                </div>
                <div className="relative" style={{ width: size, height: size }}>
                    <svg width={size} height={size} className="-rotate-90" style={{ display: "block" }}>
                        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#f3f4f6" strokeWidth="5" />
                        <circle
                            cx={size/2} cy={size/2} r={radius}
                            fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
                            strokeDasharray={circ} strokeDashoffset={offset}
                            style={{ transition: "stroke-dashoffset 0.6s ease" }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[11px] font-bold" style={{ color }}>{Math.round(pct * 100)}%</span>
                    </div>
                </div>
            </div>
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-4xl font-bold leading-none" style={{ color }}>{remaining}</p>
                    <p className="text-xs text-gray-400 mt-1">days remaining</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-semibold text-gray-600">{item.total_allocated}</p>
                    <p className="text-xs text-gray-400">total</p>
                </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round(pct * 100)}%`, background: color }}
                />
            </div>
        </div>
    );
};

/* ── Page ──────────────────────────────────────────────────────── */
const LeaveBalance: React.FC = () => {
    const [leaveBalances, setLeaveBalances] = useState<LeaveBalanceType[]>([]);
    const [weeklyData, setWeeklyData]       = useState<{ day: string; value: number }[]>([]);
    const [loading, setLoading]             = useState(true);

    useEffect(() => {
        getBalance()
            .then(res => {
                setLeaveBalances(res.data.leaveBalances || []);
                setWeeklyData(res.data.weeklyPattern   || []);
            })
            .catch(err => console.error("Failed to fetch leave balance", err))
            .finally(() => setLoading(false));
    }, []);

    const columns = [
        { key: "type",             label: "Type"      },
        { key: "used",             label: "Used"      },
        { key: "balance",          label: "Remaining" },
        { key: "total_allocated",  label: "Total"     },
    ];

    const chartDatarem  = leaveBalances.map((lb, i) => ({ name: lb.type, value: Number(lb.remaining), fill: PALETTE[i % PALETTE.length] }));
    const chartDataused = leaveBalances.map((lb, i) => ({ name: lb.type, value: Number(lb.used),      fill: PALETTE[i % PALETTE.length] }));

    const pieConfig = leaveBalances.reduce((acc, lb, i) => {
        acc[lb.type] = { label: lb.type, color: PALETTE[i % PALETTE.length] };
        return acc;
    }, {} as Record<string, { label: string; color: string }>);

    const totalRemaining = leaveBalances.reduce((s, lb) => s + Number(lb.remaining), 0);
    const totalUsed      = leaveBalances.reduce((s, lb) => s + Number(lb.used),      0);

    if (loading) return (
        <div className="flex justify-center items-center h-48">
            <Loader className="animate-spin text-purple-500" />
        </div>
    );

    return (
        <div className="flex flex-col gap-6 pb-6">
            <PageHeader title="Leave Balance" subtitle="View your leave balance" />

            {/* Ring cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {leaveBalances.map((item, i) => (
                    <RingCard key={i} item={item} color={PALETTE[i % PALETTE.length]} light={LIGHT_PALETTE[i % LIGHT_PALETTE.length]} />
                ))}
            </div>

            {/* Charts row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* ── Area chart — Weekly Pattern ── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Weekly Pattern</CardTitle>
                        <CardDescription>Leave days taken per day of the week</CardDescription>
                    </CardHeader>
                    <CardContent className="px-2 pb-0">
                        <ChartContainer
                            config={{ value: { label: "Days", color: "#5746AF" } }}
                            className="h-56 w-full"
                        >
                            <AreaChart data={weeklyData} margin={{ left: 12, right: 12 }}>
                                <CartesianGrid vertical={false} stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="day"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tick={{ fontSize: 12 }}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent indicator="line" />}
                                />
                                <Area
                                    dataKey="value"
                                    type="natural"
                                    fill="#5746AF"
                                    fillOpacity={0.15}
                                    stroke="#5746AF"
                                    strokeWidth={2.5}
                                />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                    <CardFooter className="pt-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <TrendingUp size={14} className="text-purple-500" />
                            Leave distribution across the week
                        </div>
                    </CardFooter>
                </Card>

                {/* ── Donut — Remaining by type ── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Remaining by Type</CardTitle>
                        <CardDescription>How many days are left per leave type</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center pb-0">
                        <ChartContainer config={pieConfig} className="h-56 w-full">
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                                <Pie
                                    data={chartDatarem}
                                    dataKey="value" nameKey="name"
                                    cx="50%" cy="50%"
                                    outerRadius={90} innerRadius={50}
                                    strokeWidth={2} stroke="white"
                                >
                                    <Label
                                        content={({ viewBox }) => {
                                            if (viewBox && "cx" in viewBox && "cy" in viewBox) return (
                                                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                                    <tspan x={viewBox.cx} y={viewBox.cy} style={{ fontSize: 22, fontWeight: 700, fill: "#1f2937" }}>{totalRemaining}</tspan>
                                                    <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 18} style={{ fontSize: 10, fill: "#9ca3af" }}>remaining</tspan>
                                                </text>
                                            );
                                        }}
                                    />
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Charts row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* ── Donut — Used by type ── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Used by Type</CardTitle>
                        <CardDescription>Days consumed per leave type</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center pb-0">
                        <ChartContainer config={pieConfig} className="h-56 w-full">
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                                <Pie
                                    data={chartDataused}
                                    dataKey="value" nameKey="name"
                                    cx="50%" cy="50%"
                                    outerRadius={90} innerRadius={50}
                                    strokeWidth={2} stroke="white"
                                >
                                    <Label
                                        content={({ viewBox }) => {
                                            if (viewBox && "cx" in viewBox && "cy" in viewBox) return (
                                                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                                    <tspan x={viewBox.cx} y={viewBox.cy} style={{ fontSize: 22, fontWeight: 700, fill: "#1f2937" }}>{totalUsed}</tspan>
                                                    <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 18} style={{ fontSize: 10, fill: "#9ca3af" }}>used</tspan>
                                                </text>
                                            );
                                        }}
                                    />
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* ── Summary table ── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Summary</CardTitle>
                        <CardDescription>Full breakdown of your leave entitlements</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    {columns.map(col => (
                                        <th key={col.key} className="text-left py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                            {col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {leaveBalances.map((item, i) => {
                                    const balance = Number(item.total_allocated) - Number(item.used);
                                    const color   = PALETTE[i % PALETTE.length];
                                    const light   = LIGHT_PALETTE[i % LIGHT_PALETTE.length];
                                    return (
                                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                                            {columns.map(col => (
                                                <td key={col.key} className="py-2.5">
                                                    {col.key === "type" ? (
                                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: light, color }}>
                                                            {item.type}
                                                        </span>
                                                    ) : col.key === "balance" ? (
                                                        <span className="font-semibold" style={{ color }}>{balance}</span>
                                                    ) : (
                                                        <span className="text-gray-700">{item[col.key as keyof LeaveBalanceType]}</span>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default LeaveBalance;
