import React, { useEffect, useState } from 'react';
import { getHistory, getLeaveInitData } from '../../api/leaveApi';
import { LeaveType, LeaveHistory as Leave } from '../../types';
import PageHeader from '../common/PageHeader';
import Loader from '../common/Loader';
const LeaveHistory: React.FC = () => {
    const [filters, setFilters] = useState({
        leaveType: '',
        status: '',
        search: '',
    });
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [leaveHistory, setLeaveHistory] = useState<Leave[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    type Status = "approved" | "pending" | "rejected";

    const statusOptions = [
        { label: "Approved", value: "approved" },
        { label: "Pending", value: "pending" },
        { label: "Rejected", value: "rejected" },
    ];
    const columns = [
        { key: "dates", label: "Leave Dates" },
        { key: "leave_type", label: "Leave Type" },
        { key: "status", label: "Status" },
        { key: "requested_by", label: "Requested By" },
        { key: "created_at", label: "Action Taken On" },
        { key: "reason", label: "Leave Note" },
    ];
    useEffect(() => {
        fetchLeaveTypes();
    }, []);

    const fetchLeaveTypes = async () => {
        try {
            const res = await getLeaveInitData();
            console.log(res.data);
            setLeaveTypes(res.data.data.leaveTypes);
        } catch (err) {
            console.error("Failed to fetch leave types", err);
        }
    };


    useEffect(() => {
        const fetchLeaveHistory = async () => {
            try {
                setLoading(true);

                const params: any = {};
                if (filters.status) params.status = filters.status;
                if (filters.leaveType) params.leave_type_id = filters.leaveType;
                if (filters.search) params.search = filters.search;


                const response = await getHistory({
                    ...params,
                    page,
                    limit: 5
                });

                setLeaveHistory(response.data.data || []);
                setTotalPages(response.data.totalPages);


            } catch (error) {
                console.error('Failed to fetch leave history:', error);
                alert('Failed to load leave history');
            } finally {
                setLoading(false);
            }
        };
        fetchLeaveHistory();
    }, [filters, page]);

    const handleFilterChange = (key: string, value: string) => {
        setPage(1);
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setPage(1);
        setFilters({ leaveType: '', status: '', search: '' });
    };
    const hasActiveFilters = filters.leaveType || filters.status || filters.search;


    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const StatusBadge = ({ status }: { status: Status }) => {
        const styles: Record<Status, string> = {
            approved: "bg-green-100 text-green-700",
            pending: "bg-yellow-100 text-yellow-700",
            rejected: "bg-red-100 text-red-700",
        };

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
                {status}
            </span>
        );
    };

    if (loading) {
        return <div className="text-center py-8"><Loader /></div>;
    }

    return (
        <div>
            <PageHeader
                title="Leave History"
                subtitle="View all your past leave requests"
            />

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-wrap gap-4 items-center">

                <select
                    value={filters.leaveType}
                    onChange={(e) => handleFilterChange('leaveType', e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2"
                >
                    <option value="">All Types</option>
                    {leaveTypes.map((lt) => (
                        <option key={lt.id} value={lt.id}>
                            {lt.name}
                        </option>
                    ))}
                </select>

                <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2"
                >
                    <option value="">All Status</option>
                    {statusOptions.map((s) => (
                        <option key={s.value} value={s.value}>
                            {s.label}
                        </option>
                    ))}
                </select>

                <input
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Search by reason"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                />

                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="text-sm text-red-500 hover:underline whitespace-nowrap"
                    >
                        Clear filters
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {leaveHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No leave history found
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 text-xs uppercase text-gray-500">
                            <tr>
                                {columns.map((col, i) => (
                                    <th key={i} className="px-6 py-3 text-left">
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {leaveHistory.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50">

                                    <td className="px-6 py-4">
                                        <div className="font-medium">
                                            {formatDate(row.from_date)}
                                            {row.from_date !== row.to_date && (
                                                <> - {formatDate(row.to_date)}</>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {row.total_days} Day{row.total_days > 1 ? "s" : ""}
                                        </div>
                                    </td>


                                    <td className="px-6 py-4">
                                        <div className="font-medium">{row.leave_type}</div>
                                        <div className="text-sm text-gray-500">
                                            Requested on {row.created_at ? formatDate(row.created_at) : "-"}
                                        </div>
                                    </td>

                                    {/* ✅ Status */}
                                    <td className="px-6 py-4">
                                        <StatusBadge status={row.status as "approved" | "pending" | "rejected"} />
                                        {row.status === "approved" && (
                                            <div className="text-sm text-gray-500">
                                                by Manager
                                            </div>
                                        )}
                                    </td>

                                    {/* 👤 Requested By */}
                                    <td className="px-6 py-4">
                                        {row.user_name || "You"}
                                    </td>

                                    {/* 📅 Action Taken */}
                                    <td className="px-6 py-4">
                                        {row.created_at ? formatDate(row.created_at) : "-"}
                                    </td>

                                    {/* 📝 Reason */}
                                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                                        {row.reason}
                                    </td>

                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="flex justify-center gap-4 mt-4">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(prev => prev - 1)}
                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                >
                    Prev
                </button>

                <span className="px-4 py-2">
                    Page {page} of {totalPages}
                </span>

                <button
                    disabled={page === totalPages}
                    onClick={() => setPage(prev => prev + 1)}
                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>

    );
};
export default LeaveHistory;