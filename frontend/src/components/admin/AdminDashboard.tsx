import React, { useEffect, useState } from "react";
import AdminEmployees from "./AdminEmployees";
import LeaveSection from "./sections/LeaveSection";
import HolidaySection from "./sections/HolidaySection";
import { getAllLeaves, getEmployees } from "../../api/adminApi";
import { getHolidays, getLeaveTypes } from "../../api/leaveApi";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import PageHeader from "../common/PageHeader";


const AdminDashboard = () => {
    const [employees, setEmployees] = useState<any[]>([]);
    const [holidays, setHolidays] = useState<any[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);

    const fetchChartData = async () => {
        const res = await getAllLeaves();
        const processed = processChartData(res.data.data || []);
        setChartData(processed);
    };
    const fetchEmployees = async () => {
        const res = await getEmployees();
        setEmployees(res.data.data);
    };
    const fetchHolidays = async () => {
        const res = await getHolidays();
        setHolidays(res.data);
    };
    const fetchTypes = async () => {
        const res = await getLeaveTypes();
        setLeaveTypes(res.data.data);
    };


    useEffect(() => {
        fetchEmployees();
        fetchHolidays();
        fetchTypes();
        fetchChartData()
    }, []);


    const stats = [
        { label: "Employees", value: employees.length },
        { label: "Managers", value: employees.filter(e => e.role === "manager").length },
        { label: "Leave Types", value: leaveTypes.length },
        { label: "Holidays", value: holidays.length },
    ];

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

    return (
        <div className="space-y-6">
            <PageHeader
                title="Employee Management"
                subtitle="Manage users, roles and departments"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-5 rounded-xl shadow-sm">
                        <p className="text-gray-500 text-sm">{s.label}</p>
                        <p className="text-2xl font-bold text-purple-600">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Top Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="font-semibold mb-4">Leave Statistics</h3>

                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={chartData}>
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="leaves" stroke="#7c3aed" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <LeaveSection />
                <HolidaySection />
                {/* Employees */}
                <AdminEmployees />
            </div>



        </div>
    );
};




export default AdminDashboard;