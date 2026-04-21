import React, { useEffect, useState } from "react";
import AdminEmployees from "./AdminEmployees";
import LeaveSection from "./sections/LeaveSection";
import HolidaySection from "./sections/HolidaySection";
import { getAllLeaves, exportLeaves } from "../../api/adminApi";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import PageHeader from "../common/PageHeader";
import Loader from "../common/Loader";
import { Download, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const MONTH_ORDER = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];


const AdminDashboard = () => {

    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    const handleExportCsv = async () => {
        try {
            setExporting(true);
            const res = await exportLeaves();
            const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = 'leaves_export.csv';
            a.click();
            URL.revokeObjectURL(url);
        } finally {
            setExporting(false);
        }
    };

    const handleExportPdf = async () => {
        try {
            setExporting(true);
            const res = await getAllLeaves();
            const leaves: any[] = res.data.data || [];
            const doc = new jsPDF({ orientation: 'landscape' });
            doc.setFontSize(14);
            doc.text('Leave Report', 14, 15);
            autoTable(doc, {
                startY: 22,
                head: [['Employee', 'Leave Type', 'From', 'To', 'Days', 'Status', 'Applied On']],
                body: leaves.map((l) => [
                    l.employee_name,
                    l.leave_type,
                    new Date(l.from_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                    new Date(l.to_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                    l.total_days,
                    l.status,
                    new Date(l.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                ]),
                styles: { fontSize: 9 },
                headStyles: { fillColor: [87, 70, 175] },
                alternateRowStyles: { fillColor: [245, 243, 255] },
            });
            doc.save('leaves_export.pdf');
        } finally {
            setExporting(false);
        }
    };

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

        return MONTH_ORDER.filter((m) => monthMap[m]).map((month) => ({
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
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Leave Statistics</h3>
                            <div className="flex gap-2">
                                {[
                                    { label: 'CSV', icon: <Download size={14} />, onClick: handleExportCsv },
                                    { label: 'PDF', icon: <FileText size={14} />, onClick: handleExportPdf },
                                ].map(({ label, icon, onClick }) => (
                                    <button
                                        key={label}
                                        onClick={onClick}
                                        disabled={exporting}
                                        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-purple-600 text-purple-600 hover:bg-purple-50 disabled:opacity-50 transition"
                                    >
                                        {icon}
                                        {exporting ? '...' : `Export ${label}`}
                                    </button>
                                ))}
                            </div>
                        </div>
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