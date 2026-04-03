import React, { useEffect, useState } from "react";
import AdminEmployees from "./AdminEmployees";
import LeaveSection from "./sections/LeaveSection";
import HolidaySection from "./sections/HolidaySection";
import { getAllLeaves, } from "../../api/adminApi";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import PageHeader from "../common/PageHeader";
import Loader from "../common/Loader";


const AdminDashboard = () => {

    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true)
    useEffect(() => {
        const fetchChartData = async () => {
            setLoading(true)
            const res = await getAllLeaves();
            const processed = processChartData(res.data.data || []);
            setChartData(processed);
            setLoading(false)
        };

        fetchChartData()
    }, []);



    const processChartData = (leaves: any[]) => {
        if (!Array.isArray(leaves)) return [];

        const monthMap: any = {};

        leaves.forEach((leave) => {
            if (leave.status?.toLowerCase() !== "approved") return;

            const date = new Date(leave.from_date);
            const month = date.toLocaleString("default", { month: "short" });

            monthMap[month] = (monthMap[month] || 0) + 1;
        });

        return Object.keys(monthMap).map((month) => ({
            month,
            leaves: monthMap[month],
        }));
    };

    if (loading) {
        return <div className="text-center py-8"><Loader /></div>;
    }

    return (
        <div className="space-y-6">

            <PageHeader
                title="Admin Dashboard"
                subtitle="Overview of employees, leaves, and system data"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="lg:col-span-2 space-y-6">

                    <div className="bg-white p-6 rounded-2xl shadow-sm border">
                        <h3 className="font-semibold mb-4">Leave Statistics</h3>
                        <ResponsiveContainer width="100%" height={260}>
                            <LineChart data={chartData}>
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="leaves" stroke="#7c3aed" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border">
                        <h3 className="font-semibold mb-4">Employees</h3>
                        <AdminEmployees />
                    </div>

                </div>

                <div className="space-y-6">

                    <div className="bg-white p-6 rounded-2xl shadow-sm border">
                        <h3 className="font-semibold mb-4">Holidays</h3>
                        <HolidaySection />
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border">
                        <h3 className="font-semibold mb-4">Leave Types</h3>
                        <LeaveSection />
                    </div>

                </div>

            </div>
        </div>
    );
};




export default AdminDashboard;