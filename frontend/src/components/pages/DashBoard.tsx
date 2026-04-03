import React, { useEffect, useState } from 'react';
import Card from '../cards/Card';
import StatCard from "../cards/StatCard";
import { getDashboard, getHolidays } from "../../api/leaveApi";
import { getUserLocal } from '../../utils/getUser';
import { useNavigate } from 'react-router-dom';
import { DashboardData, User } from "../../types";
import PageHeader from '../common/PageHeader';

type Balance = {
    label: string;
    value: string;
};

const DashBoard: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    useEffect(() => {
        const user = getUserLocal();
        setUser(user);
    }, []);
    const [data, setData] = useState<DashboardData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [holidays, setHolidays] = useState<any[]>([]);

    const navigate = useNavigate()

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await getDashboard();
                setData(res.data);
            } catch (err) {
                console.error(err);
                setError("Failed to load dashboard");
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        fetchHolidays();
    }, []);
    const fetchHolidays = async () => {
        try {
            const res = await getHolidays();
            setHolidays(res.data);
        } catch (err) {
            console.error("Failed to fetch holidays", err);
        }
    };
    const today = new Date()
    const upcomingHolidays = holidays.filter((h) => {
        return new Date(h.date) >= today
    })

    if (error) return <p className="text-red-500">{error}</p>;
    if (!data) return <p>Loading...</p>;


    const stats = [
        {
            label: "Available leaves",
            value: data.leave_balance.reduce(
                (sum, item) => sum + item.remaining,
                0
            ),
        },
        {
            label: "Used this year",
            value: data.leave_balance.reduce(
                (sum, item) => sum + item.used,
                0
            ),
        },
        {
            label: "Pending approval",
            value: data.pending_requests,
        },
        {
            label: "Total entitled",
            value: data.leave_balance.reduce(
                (sum, item) => sum + item.total_allocated,
                0
            ),
        },
    ];

    const balances: Balance[] = data.leave_balance.map((item) => ({
        label: item.name,
        value: `${item.used} of ${item.total_allocated}`,
    }));

    return (
        <div>
            <PageHeader
                title="Dashboard"
                subtitle="Overview of your leave activity"
            />

            <div className="bg-gradient-to-r from-[#5746AF] to-[#302178] text-white p-8 rounded-xl mb-6">
                <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name || "User"}!</h1>
                <p className="text-purple-100">Your leave dashboard</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {stats.map((stat) => (
                    <StatCard key={stat.label} label={stat.label} value={stat.value} />
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Apply for leave</h3>
                    <button className="w-full bg-[#5746AF] text-white py-3 rounded-lg hover:bg-purple-700 transition"
                        onClick={() => navigate("/apply-leave")}>
                        + New leave request
                    </button>
                </div>

                <Card>
                    <h3 className="text-lg font-semibold mb-4">Leave balance</h3>
                    <div className="space-y-3">
                        {balances.map((item) => (
                            <div key={item.label} className="flex justify-between">
                                <span className="text-gray-600">{item.label}</span>
                                <span className="font-semibold">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Holidays */}
                <Card>
                    <h3 className="text-lg font-semibold mb-4">Upcoming holidays</h3>
                    {upcomingHolidays.slice(0, 4).map((h, i) => (
                        <p key={i} className="text-gray-700">{h.name} ({new Date(h.date).toLocaleDateString("en-GB")})</p>
                    ))}
                </Card>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Team members on leave</h3>

                    {data.team_on_leave.length === 0 ? (
                        <p className="text-gray-500">No one is on leave today</p>
                    ) : (
                        data.team_on_leave.map((member, i) => (
                            <p key={i} className="text-gray-700">
                                {member.name} ( {new Date(member.from_date).toLocaleDateString("en-GB")} →
                                {new Date(member.to_date).toLocaleDateString("en-GB")})
                            </p>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashBoard;