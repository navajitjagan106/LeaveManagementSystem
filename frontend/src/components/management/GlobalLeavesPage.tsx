import React, { useEffect, useMemo, useState } from "react";
import { getAllLeaves, exportLeaves } from "../../api/managementApi";
import PageHeader from "../common/PageHeader";
import { useToast } from "../common/ToastContext";
import { Card } from "../ui/card";
import { useAsync } from "../../hooks/useAsync";
import {
    FileDown, Search, Filter, CalendarDays, ClipboardList,
    CheckCircle2, Clock, XCircle, ChevronLeft, ChevronRight,
    RefreshCw, BarChart2, ChevronDown
} from "lucide-react";

interface LeaveRecord {
    id: number;
    from_date: string;
    to_date: string;
    total_days: string | number;
    status: "pending" | "approved" | "rejected";
    created_at: string;
    employee_name: string;
    leave_type: string;
}

interface ColumnDef<T> {
    header: string;
    key: string;
    className?: string;
    render?: (item: T) => React.ReactNode;
}

const STATUS_BADGE = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

const getAvatarBg = (name: string) => {
    const colors = [
        "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm shadow-blue-100",
        "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-100",
        "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm shadow-violet-100",
        "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm shadow-amber-100",
        "bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-sm shadow-rose-100",
        "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-sm shadow-cyan-100",
        "bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white shadow-sm shadow-fuchsia-100",
    ];
    let hash = 0;
    const cleanName = name || "";
    for (let i = 0; i < cleanName.length; i++) {
        hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

const GlobalLeavesPage: React.FC = () => {
    const toast = useToast();
    const { data, LoadingScreen, execute: fetchAllData } = useAsync(getAllLeaves, true);

    // Filters state
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageInputVal, setPageInputVal] = useState("1");
    const itemsPerPage = 10;

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    useEffect(() => {
        setPageInputVal(currentPage.toString());
    }, [currentPage]);

    const allRecords = useMemo<LeaveRecord[]>(() => {
        return data?.data || [];
    }, [data]);

    // Filtered data
    const filteredRecords = useMemo(() => {
        return allRecords.filter((rec) => {
            const matchesSearch =
                rec.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
                rec.leave_type?.toLowerCase().includes(search.toLowerCase());

            const matchesStatus =
                statusFilter === "all" || rec.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [allRecords, search, statusFilter]);

    // Derived statistics
    const stats = useMemo(() => {
        let pending = 0;
        let approved = 0;
        let rejected = 0;
        let totalDaysApproved = 0;

        allRecords.forEach((r) => {
            if (r.status === "pending") pending++;
            else if (r.status === "approved") {
                approved++;
                totalDaysApproved += Number(r.total_days || 0);
            } else if (r.status === "rejected") rejected++;
        });

        return {
            total: allRecords.length,
            pending,
            approved,
            rejected,
            totalDaysApproved,
        };
    }, [allRecords]);

    // Paginated records
    const paginatedRecords = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredRecords.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredRecords, currentPage]);

    const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage));

    // Reset pagination on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter]);

    // Export function
    const [exporting, setExporting] = useState(false);
    const handleExport = async () => {
        try {
            setExporting(true);
            const params: Record<string, string> = {};
            if (statusFilter !== "all") params.status = statusFilter;

            const res = await exportLeaves(params);

            // Download Blob CSV
            const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `company_leaves_export_${new Date().toISOString().split("T")[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success("Spreadsheet export downloaded successfully!");
        } catch {
            toast.error("Failed to generate and download leave report");
        } finally {
            setExporting(false);
        }
    };

    const fmtDate = (d: string) => {
        return new Date(d).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    // Columns configuration mapping
    const COLUMNS: ColumnDef<LeaveRecord>[] = [
        {
            header: "Employee",
            key: "employee_name",
            render: (rec) => (
                <div className="flex items-center gap-2 font-bold text-gray-900">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-[11px] ${getAvatarBg(rec.employee_name)}`}>
                        {rec.employee_name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <span>{rec.employee_name}</span>
                </div>
            )
        },
        {
            header: "Leave Category",
            key: "leave_type",
            className: "font-semibold text-gray-600",
            render: (rec) => <span>{rec.leave_type}</span>
        },
        {
            header: "Date Range",
            key: "date_range",
            render: (rec) => (
                <span className="text-gray-500 font-medium">
                    {fmtDate(rec.from_date)} - {fmtDate(rec.to_date)}
                </span>
            )
        },
        {
            header: "Duration",
            key: "total_days",
            className: "text-center font-bold text-gray-800",
            render: (rec) => (
                <span>{rec.total_days} {Number(rec.total_days) === 1 ? "day" : "days"}</span>
            )
        },
        {
            header: "Status",
            key: "status",
            render: (rec) => (
                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${STATUS_BADGE[rec.status]}`}>
                    {rec.status}
                </span>
            )
        },
        {
            header: "Applied On",
            key: "created_at",
            className: "text-gray-400 font-semibold",
            render: (rec) => <span>{fmtDate(rec.created_at)}</span>
        }
    ];

    // Stats configuration mapping
    const STATS_CARDS = [
        {
            key: "total",
            label: "Total Filed",
            value: stats.total,
            icon: ClipboardList,
            iconClass: "text-primary",
            bgClass: "bg-primary-light"
        },
        {
            key: "pending",
            label: "Awaiting Review",
            value: stats.pending,
            icon: Clock,
            iconClass: "text-amber-600",
            bgClass: "bg-amber-50"
        },
        {
            key: "approved",
            label: "Approved Requests",
            value: stats.approved,
            icon: CheckCircle2,
            iconClass: "text-emerald-600",
            bgClass: "bg-emerald-50"
        },
        {
            key: "rejected",
            label: "Rejected Requests",
            value: stats.rejected,
            icon: XCircle,
            iconClass: "text-rose-600",
            bgClass: "bg-rose-50"
        },
        {
            key: "approved_days",
            label: "Approved Days",
            value: `${stats.totalDaysApproved} days`,
            icon: BarChart2,
            iconClass: "text-primary",
            bgClass: "bg-indigo-50"
        }
    ];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6 relative w-full max-w-full flex flex-col mb-12">
            <LoadingScreen />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <PageHeader
                        title="Global Leaves Dashboard"
                        subtitle="Inspect, search, filter and export all company-wide leave transactions"
                    />
                    {/* Minimal decorative Brand Illustration next to title */}
                    <img 
                        src="/Admin-rafiki.svg" 
                        className="w-10 h-10 object-contain select-none opacity-85 hover:scale-110 transition-transform duration-300 hidden sm:block flex-shrink-0" 
                        alt="Admin Graphic" 
                    />
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                    <button
                        type="button"
                        onClick={fetchAllData}
                        className="h-10 w-10 border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center rounded-xl transition-all cursor-pointer"
                        title="Reload records"
                    >
                        <RefreshCw size={15} className="text-gray-500 hover:rotate-180 transition-all duration-500" />
                    </button>

                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={exporting || filteredRecords.length === 0}
                        className="h-10 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary-dark text-white font-semibold flex items-center gap-2 shadow-sm shadow-primary-light px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {exporting ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <FileDown size={16} />
                        )}
                        <span>Export CSV Report</span>
                    </button>
                </div>
            </div>

            <hr className="border-gray-100" />

            {/* Metrics Ribbon - Dynamically Mapped */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {STATS_CARDS.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Card 
                            key={card.key} 
                            className={`border-gray-100 bg-gray-50/40 p-4 flex items-center gap-3.5 shadow-sm ${
                                card.key === "approved_days" ? "col-span-2 lg:col-span-1" : ""
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-xl ${card.bgClass} flex items-center justify-center flex-shrink-0`}>
                                <Icon size={18} className={card.iconClass} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{card.label}</p>
                                <p className="text-xl font-bold text-gray-900 mt-0.5">{card.value}</p>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Filters Area */}
            <div className="flex flex-col sm:flex-row items-center gap-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <div className="relative w-full sm:flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by employee name or leave type..."
                        className="pl-9 h-10 bg-white border border-gray-200 outline-none focus:border-primary rounded-xl w-full text-xs font-medium text-gray-800 transition-colors shadow-inner"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
                    <Filter size={15} className="text-gray-400 hidden md:block" />

                    <div className="relative w-full sm:w-44 flex-shrink-0">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-10 w-full bg-white border border-gray-200 rounded-xl px-3 text-xs font-semibold text-gray-700 outline-none hover:border-gray-300 transition-all cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary appearance-none pr-8"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Leave Records Table */}
            {filteredRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 border rounded-2xl border-dashed border-gray-200 bg-white">
                    <CalendarDays size={42} className="text-gray-300 mb-3 animate-pulse" />
                    <p className="font-semibold text-gray-700 text-sm">No leave records match your filters</p>
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your search queries or status filters</p>
                </div>
            ) : (
                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    {COLUMNS.map((col) => (
                                        <th 
                                            key={col.key} 
                                            className={`px-5 py-4 ${col.key === "total_days" ? "text-center" : ""}`}
                                        >
                                            {col.header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {paginatedRecords.map((rec) => (
                                    <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors text-xs text-gray-700">
                                        {COLUMNS.map((col) => (
                                            <td 
                                                key={col.key} 
                                                className={`px-5 py-4.5 ${col.className || ""}`}
                                            >
                                                {col.render ? col.render(rec) : (rec as any)[col.key]}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {filteredRecords.length > 0 && (
                        <div className="flex items-center justify-between px-5 py-4 bg-gray-50/50 border-t border-gray-100 flex-wrap gap-4 select-none">
                            <span className="text-[11px] font-medium text-gray-400">
                                Showing <span className="font-bold text-gray-700">{paginatedRecords.length}</span> of <span className="font-bold text-gray-700">{filteredRecords.length}</span> records
                            </span>

                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                    className="h-8 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-all text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-600 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={14} />
                                    <span>Prev</span>
                                </button>

                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-gray-500 font-medium">Page</span>
                                    <input
                                        type="number"
                                        min={1}
                                        max={totalPages}
                                        value={pageInputVal}
                                        onChange={(e) => setPageInputVal(e.target.value)}
                                        onBlur={() => {
                                            let num = parseInt(pageInputVal);
                                            if (isNaN(num) || num < 1) num = 1;
                                            if (num > totalPages) num = totalPages;
                                            setPageInputVal(num.toString());
                                            setCurrentPage(num);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                let num = parseInt(pageInputVal);
                                                if (isNaN(num) || num < 1) num = 1;
                                                if (num > totalPages) num = totalPages;
                                                setPageInputVal(num.toString());
                                                setCurrentPage(num);
                                            }
                                        }}
                                        disabled={totalPages <= 1}
                                        className="w-12 h-8 text-center border border-gray-200 rounded-lg text-xs font-bold focus:border-primary outline-none focus:ring-1 focus:ring-primary shadow-inner bg-white text-gray-800 disabled:opacity-50 disabled:bg-gray-50"
                                    />
                                    <span className="text-xs text-gray-400 font-medium">of {totalPages}</span>
                                </div>

                                <button
                                    type="button"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    className="h-8 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-all text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-600 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <span>Next</span>
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalLeavesPage;
