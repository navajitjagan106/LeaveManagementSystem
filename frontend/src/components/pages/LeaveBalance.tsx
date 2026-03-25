import React from 'react';
import Card from '../cards/Card';


const LeaveBalance: React.FC = () => {
    type LeaveBalanceType = {
        type: string;
        used: number;
        total: number;
    };

    const leaveBalances: LeaveBalanceType[] = [
        { type: "Sick Leave", used: 5, total: 10 },
        { type: "Casual Leave", used: 6, total: 12 },
        { type: "Earned Leave", used: 12, total: 16 },
    ];
    const columns = [
        { key: "type", label: "Type" },
        { key: "used", label: "Used" },
        { key: "balance", label: "Balance" },
        { key: "total", label: "Total" },
    ];
    return (
        <div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {leaveBalances.map((item, i) => {
                    const remaining = item.total - item.used;

                    return (
                        <Card key={i} className="text-center">
                            <h3 className="text-lg font-semibold mb-2">{item.type}</h3>
                            <p className="text-4xl font-bold text-purple-600">
                                {remaining}/{item.total}
                            </p>
                        </Card>
                    );
                })}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pie Chart Placeholder */}
                <Card>
                    <h3 className="text-lg font-semibold mb-4">Leave Balances</h3>
                    <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded">
                        <p className="text-gray-400">Pie Chart (add later)</p>
                    </div>
                </Card>

                {/* Detailed Table */}
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
                                const balance = item.total - item.used;

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
    );
};

export default LeaveBalance;