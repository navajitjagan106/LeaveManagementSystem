import React, { useState } from 'react';

const LeaveHistory: React.FC = () => {
    const [filters, setFilters] = useState({
        leaveType: '',
        status: '',
        search: '',
    });
    type Status = "approved" | "pending" | "rejected";

    type Leave = {
        id: number;
        leaveType: string;
        fromDate: string;
        toDate: string;
        days: number;
        reason: string;
        status: Status;
    };
    const filterOptions = [
        {
            type: "select",
            key: "leaveType",
            options: [ "Sick", "Casual", "Earned"],
        },
        {
            type: "select",
            key: "status",
            options: [ "Approved", "Pending", "Rejected"],
        },
    ];
    const columns = [
        { key: "leaveType", label: "Leave Type" },
        { key: "fromDate", label: "From Date" },
        { key: "toDate", label: "To Date" },
        { key: "days", label: "Days" },
        { key: "reason", label: "Reason" },
        { key: "status", label: "Status" },
    ];


    const leaveHistory:Leave[] = [
        {
            id: 1,
            leaveType: 'Casual Leave',
            fromDate: '2026-03-20',
            toDate: '2026-03-22',
            days: 3,
            reason: 'Family function',
            status: 'approved',
        },
        {
            id: 2,
            leaveType: 'Sick Leave',
            fromDate: '2026-03-15',
            toDate: '2026-03-15',
            days: 1,
            reason: 'Fever',
            status: 'approved',
        },
        {
            id: 3,
            leaveType: 'Earned Leave',
            fromDate: '2026-04-01',
            toDate: '2026-04-05',
            days: 5,
            reason: 'Vacation',
            status: 'pending',
        },
    ];


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


    return (
        <div >

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex gap-4">

                {filterOptions.map((f, i) => (
                    <select
                        key={i}
                        value={filters[f.key as keyof typeof filters]}
                        onChange={(e) =>
                            setFilters({ ...filters, [f.key]: e.target.value })
                        }
                        className="border border-gray-300 rounded-lg px-4 py-2"
                    >
                        <option value="">All</option>
                        {f.options.map((opt, idx) => (
                            <option key={idx} value={opt.toLowerCase()}>
                                {opt}
                            </option>
                        ))}
                    </select>
                ))}

                <input
                    value={filters.search}
                    onChange={(e) =>
                        setFilters({ ...filters, search: e.target.value })
                    }
                    placeholder="Search"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
                                        ) : (
                                            row[col.key as keyof typeof row]
                                        )}

                                    </td>
                                ))}

                            </tr>
                        ))}
                    </tbody>

                </table>
            </div>
        </div>
    );
};

export default LeaveHistory;