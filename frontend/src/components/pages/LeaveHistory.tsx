import React, { useEffect, useState } from 'react';
import { getHistory, getLeaveTypes } from '../../api/leaveApi';
import { LeaveType,LeaveHistory as Leave } from '../../types';
const LeaveHistory: React.FC = () => {
    const [filters, setFilters] = useState({
        leaveType: '',
        status: '',
        search: '',
    });
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [leaveHistory, setLeaveHistory] = useState<Leave[]>([]);
    const [loading, setLoading] = useState(true);
    type Status = "approved" | "pending" | "rejected";

    const statusOptions = [
        { label: "Approved", value: "approved" },
        { label: "Pending", value: "pending" },
        { label: "Rejected", value: "rejected" },
    ];
    const columns = [
        { key: "leave_type", label: "Leave Type" },
        { key: "from_date", label: "From Date" },
        { key: "to_date", label: "To Date" },
        { key: "total_days", label: "Days" },
        { key: "reason", label: "Reason" },
        { key: "status", label: "Status" },
    ];
    useEffect(() => {
        fetchLeaveTypes();
    }, []);

    const fetchLeaveTypes = async () => {
        try {
            const res = await getLeaveTypes();
            setLeaveTypes(res.data.data);
        } catch (err) {
            console.error("Failed to fetch leave types", err);
        }
    };


    useEffect(() => {
        fetchLeaveHistory();
    }, [filters]);
    const fetchLeaveHistory = async () => {
    try {
        setLoading(true);

        const params: any = {};

        if (filters.status) {
            params.status = filters.status;
        }

        if (filters.leaveType) {
            params.leave_type_id = filters.leaveType; // ✅ direct ID
        }

        if (filters.search) {
            params.search = filters.search;
        }

        const response = await getHistory(); // ✅ PASS PARAMS

        setLeaveHistory(response.data.data || []);
    } catch (error) {
        console.error('Failed to fetch leave history:', error);
        alert('Failed to load leave history');
    } finally {
        setLoading(false);
    }
};

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
        return <div className="text-center py-8">Loading...</div>;
    }

    return (
        <div>
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex gap-4">

                <select
                    value={filters.leaveType}
                    onChange={(e) =>
                        setFilters({ ...filters, leaveType: e.target.value })
                    }
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
                    onChange={(e) =>
                        setFilters({ ...filters, status: e.target.value })
                    }
                    className="border border-gray-300 rounded-lg px-4 py-2"
                >
                    <option value="">All Types</option>
                    {statusOptions.map((lt) => (
                        <option key={lt.value} value={lt.value}>
                            {lt.label}
                        </option>
                    ))}
                </select>

                <input
                    value={filters.search}
                    onChange={(e) =>
                        setFilters({ ...filters, search: e.target.value })
                    }
                    placeholder="Search by reason"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                />
            </div>
                    
            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {leaveHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No leave history found
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-600">
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
                                    {columns.map((col, i) => (
                                        <td key={i} className="px-6 py-4 text-sm text-gray-800">
                                            {col.key === "status" ? (
                                                <StatusBadge status={row.status} />
                                            ) : col.key === "from_date" || col.key === "to_date" ? (
                                                formatDate(row[col.key])
                                            ) : (
                                                row[col.key as keyof typeof row]
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
export default LeaveHistory;