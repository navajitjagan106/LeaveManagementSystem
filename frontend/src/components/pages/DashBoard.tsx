import React from 'react';
import Card from '../cards/Card';
import StatCard from "../cards/StatCard"

const stats = [
    { label: "Available leaves", value: 12 },
    { label: "Used this year", value: 8 },
    { label: "Pending approval", value: 2 },
    { label: "Total entitled", value: 20 },
];
const balances = [
    { label: "Casual leave", value: "5 of 10" },
    { label: "Sick leave", value: "4 of 5" },
    { label: "Privilege leave", value: "3 of 5" },
];

const holidays = [
    "April 3 (Good Friday)",
    "April 14 (Tamil New Year)",
];

const DashBoard: React.FC = () => {
    return (
        <div>

            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-8 rounded-xl mb-6">
                <h1 className="text-3xl font-bold mb-2">Welcome, Navajit!</h1>
                <p className="text-purple-100">Your leave dashboard</p>
            </div>

            {/* Stats Grid */}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {stats.map((stat, index) => (
                    <StatCard key={index} label={stat.label} value={stat.value} />
                ))}
            </div>


            {/* Main Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Apply Leave Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Apply for leave</h3>
                    <button className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition">
                        + New leave request
                    </button>
                </div>

                {/* Leave Balance */}
                <Card>
                    <h3 className="text-lg font-semibold mb-4">Leave balance</h3>
                    <div className="space-y-3">
                        {balances.map((item, i) => (
                            <div key={i} className="flex justify-between">
                                <span className="text-gray-600">{item.label}</span>
                                <span className="font-semibold">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Upcoming Holidays & Team */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-lg font-semibold mb-4">Upcoming holidays</h3>
                    {holidays.map((h, i) => (
                        <p key={i} className="text-gray-700">{h}</p>
                    ))}
                </Card>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Team members on leave</h3>
                    <p className="text-gray-500">No one is on leave today</p>
                </div>
            </div>
        </div>
    );
};

export default DashBoard;