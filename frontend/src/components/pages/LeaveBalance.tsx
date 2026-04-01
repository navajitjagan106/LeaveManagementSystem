import React, { useEffect, useState } from 'react';
import Card from '../cards/Card';
import { getBalance } from '../../api/leaveApi';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

const LeaveBalance: React.FC = () => {
    type LeaveBalanceType = {
        type: string;
        used: number;
        total_allocated: number;
        remaining: number
    };

    const [leaveBalances, setLeaveBalances] = useState<LeaveBalanceType[]>([])
    const [weeklyData, setWeeklyData] = useState([])
    useEffect(() => {
        fetchBalances();
    }, []);

    const fetchBalances = async () => {
        try {
            const res = await getBalance();
            console.log(res.data)
            setLeaveBalances(res.data.leaveBalances || []);
            setWeeklyData(res.data.weeklyPattern || [])
        } catch (err) {
            console.error("Failed to fetch leave balance", err);
        }
    };

    const columns = [
        { key: "type", label: "Type" },
        { key: "used", label: "Used" },
        { key: "balance", label: "Balance" },
        { key: "total_allocated", label: "Total" },
    ];

    const COLORS: Record<string, string> = {
        "Sick Leave": "#ef4444",
        "Casual Leave": "#3b82f6",
        "Earned Leave": "#10b981",
    };

    const chartDatarem = leaveBalances.map((lb) => ({
        name: lb.type,
        value: lb.remaining,
    }));
    const chartDataused = leaveBalances.map((lb) => ({
        name: lb.type,
        value: lb.used,
    }));
    return (
        <div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {leaveBalances.map((item, i) => {
                    const remaining = item.total_allocated - item.used;

                    return (
                        <Card key={i} className="text-center">
                            <h3 className="text-lg font-semibold mb-2">{item.type}</h3>
                            <p className="text-4xl font-bold text-purple-600">
                                {remaining}/{item.total_allocated}
                            </p>
                        </Card>
                    );
                })}
            </div>

            {/* Charts Section */}
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <h3 className="text-lg font-semibold mb-4">Weekly Pattern</h3>

                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={weeklyData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />

                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#8b5cf6"
                                        strokeWidth={3}
                                        dot={{ r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                    {/* Pie Chart Placeholder */}
                    <Card>
                        <h3 className="text-lg font-semibold mb-4">Leave Balances</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartDatarem}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label
                                    >
                                        {chartDatarem.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[entry.name] || "#9333ea"}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Detailed Table */}

                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <h3 className="text-lg font-semibold mb-4">Leave Used</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartDataused}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label
                                    >
                                        {chartDataused.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[entry.name] || "#9333ea"}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card>
                        <h3 className="text-lg font-semibold mb-4">Detailed Leave</h3>

                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    {columns.map((col, i) => (
                                        <th key={i} className="text-left py-2 text-sm font-semibold">
                                            {col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody className="divide-y">
                                {leaveBalances.map((item, i) => {
                                    const balance = item.total_allocated - item.used;

                                    return (
                                        <tr key={i}>
                                            {columns.map((col, j) => (
                                                <td key={j} className="py-2 text-sm">
                                                    {col.key === "balance"
                                                        ? balance
                                                        : item[col.key as keyof LeaveBalanceType]}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default LeaveBalance;