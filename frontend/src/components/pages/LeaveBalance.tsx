import React, { useEffect, useState } from 'react';
import { getBalance } from '../../api/leaveApi';
import {
    PieChart, Pie, Label,
    AreaChart, Area,
    XAxis, CartesianGrid,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import PageHeader from '../common/PageHeader';
import { Loader } from 'lucide-react';

type LeaveBalanceType = {
    type: string;
    used: number;
    total_allocated: number;
    remaining: number;
    is_unlimited: boolean;
};

const PALETTE       = ["#6366f1","#10b981","#f59e0b","#ef4444","#3b82f6","#ec4899","#14b8a6","#f97316"];
const LIGHT_PALETTE = ["#eef2ff","#d1fae5","#fef3c7","#fee2e2","#dbeafe","#fce7f3","#ccfbf1","#ffedd5"];

/* ── Slim Ring card — horizontal strip, fixed ~68px tall ── */
const RingCard: React.FC<{ item: LeaveBalanceType; color: string; light: string }> = ({ item, color, light }) => {
    const used      = Number(item.used);
    const allocated = Number(item.total_allocated);
    const remaining = item.is_unlimited ? null : allocated - used;
    const pct       = item.is_unlimited
        ? Math.min(used / Math.max(used * 2, 1), 1)  // visual only — fill half ring per used day
        : allocated > 0 ? used / allocated : 0;
    const size = 52; const r = 20;
    const circ   = 2 * Math.PI * r;
    const offset = circ * (1 - pct);

    return (
        <div
            className="bg-gray-50 rounded-xl border border-gray-100 p-2.5 hover:bg-white transition-colors flex items-center gap-3"
            style={{ borderLeft: `3px solid ${color}` }}
        >
            {/* Mini ring */}
            <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90" style={{ display: "block" }}>
                    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth="4" />
                    <circle
                        cx={size/2} cy={size/2} r={r}
                        fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
                        strokeDasharray={circ} strokeDashoffset={offset}
                        style={{ transition: "stroke-dashoffset 0.6s ease" }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    {item.is_unlimited
                        ? <span className="text-[11px] font-bold" style={{ color }}>∞</span>
                        : <span className="text-[10px] font-bold" style={{ color }}>{Math.round(pct * 100)}%</span>
                    }
                </div>
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
                <span
                    className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full inline-block mb-1 truncate max-w-full"
                    style={{ background: light, color }}
                >
                    {item.type}
                </span>
                {item.is_unlimited ? (
                    <>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold leading-none" style={{ color }}>{used}</span>
                            <span className="text-[10px] text-gray-400">days used</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">no cap</p>
                    </>
                ) : (
                    <>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold leading-none" style={{ color }}>{remaining}</span>
                            <span className="text-[10px] text-gray-400">/ {allocated}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">days left</p>
                    </>
                )}
            </div>
        </div>
    );
};

/* ── Page ── */
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

    // For unlimited types (LOP): remaining is meaningless — show used so the segment always appears
    const chartDatarem  = leaveBalances.map((lb, i) => ({
        name: lb.type,
        value: lb.is_unlimited ? Math.max(Number(lb.used), 0.5) : Math.max(Number(lb.remaining), 0),
        fill: PALETTE[i % PALETTE.length],
    }));
    const chartDataused = leaveBalances.map((lb, i) => ({
        name: lb.type,
        value: Math.max(Number(lb.used), 0),
        fill: PALETTE[i % PALETTE.length],
    }));

    const pieConfig = leaveBalances.reduce((acc, lb, i) => {
        acc[lb.type] = { label: lb.type, color: PALETTE[i % PALETTE.length] };
        return acc;
    }, {} as Record<string, { label: string; color: string }>);

    const totalRemaining = leaveBalances.reduce((s, lb) => s + (lb.is_unlimited ? 0 : Math.max(Number(lb.remaining), 0)), 0);
    const totalUsed      = leaveBalances.reduce((s, lb) => s + Number(lb.used), 0);

    if (loading) return (
        <div className="flex justify-center items-center h-full">
            <Loader className="animate-spin text-purple-500" />
        </div>
    );

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3 h-full min-h-0">
            <PageHeader title="Leave Balance" subtitle="View your leave balance" divider />

            {/* Ring cards — fixed height strips, 4 cols, no wrap overflow */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 flex-shrink-0">
                {leaveBalances.map((item, i) => (
                    <RingCard key={i} item={item} color={PALETTE[i % PALETTE.length]} light={LIGHT_PALETTE[i % LIGHT_PALETTE.length]} />
                ))}
            </div>

            {/* Charts — fill all remaining space */}
            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-3">

                {/* Weekly Pattern */}
                <Card className="bg-gray-50 shadow-none flex flex-col min-h-0">
                    <CardHeader className="pb-1 pt-3 px-4 flex-shrink-0">
                        <CardTitle className="text-sm">Weekly Pattern</CardTitle>
                        <CardDescription className="text-xs">Days taken per weekday</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0 px-2 pb-3">
                        <ChartContainer
                            config={{ value: { label: "Days", color: "#5746AF" } }}
                            className="w-full h-full"
                        >
                            <AreaChart data={weeklyData} margin={{ left: 8, right: 8, top: 8, bottom: 4 }}>
                                <CartesianGrid vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={6} tick={{ fontSize: 10 }} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                                <Area dataKey="value" type="natural" fill="#5746AF" fillOpacity={0.15} stroke="#5746AF" strokeWidth={2} />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Remaining by Type */}
                <Card className="bg-gray-50 shadow-none flex flex-col min-h-0">
                    <CardHeader className="pb-1 pt-3 px-4 flex-shrink-0">
                        <CardTitle className="text-sm">Remaining by Type</CardTitle>
                        <CardDescription className="text-xs">Days left per leave type</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0 pb-3 px-3">
                        <ChartContainer config={pieConfig} className="w-full h-full">
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                                <Pie
                                    data={chartDatarem}
                                    dataKey="value" nameKey="name"
                                    cx="50%" cy="50%"
                                    outerRadius="72%" innerRadius="42%"
                                    strokeWidth={2} stroke="white"
                                >
                                    <Label
                                        content={({ viewBox }) => {
                                            if (viewBox && "cx" in viewBox && "cy" in viewBox) return (
                                                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                                    <tspan x={viewBox.cx} y={viewBox.cy} style={{ fontSize: 20, fontWeight: 700, fill: "#1f2937" }}>{totalRemaining}</tspan>
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

                {/* Used by Type */}
                <Card className="bg-gray-50 shadow-none flex flex-col min-h-0">
                    <CardHeader className="pb-1 pt-3 px-4 flex-shrink-0">
                        <CardTitle className="text-sm">Used by Type</CardTitle>
                        <CardDescription className="text-xs">Days consumed per leave type</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0 pb-3 px-3">
                        <ChartContainer config={pieConfig} className="w-full h-full">
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                                <Pie
                                    data={chartDataused}
                                    dataKey="value" nameKey="name"
                                    cx="50%" cy="50%"
                                    outerRadius="72%" innerRadius="42%"
                                    strokeWidth={2} stroke="white"
                                >
                                    <Label
                                        content={({ viewBox }) => {
                                            if (viewBox && "cx" in viewBox && "cy" in viewBox) return (
                                                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                                    <tspan x={viewBox.cx} y={viewBox.cy} style={{ fontSize: 20, fontWeight: 700, fill: "#1f2937" }}>{totalUsed}</tspan>
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
            </div>
        </div>
    );
};

export default LeaveBalance;
