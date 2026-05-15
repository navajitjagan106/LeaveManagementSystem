import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { cancelLeave, getHistory } from '../../api/leaveApi';
import { LeaveHistory as Leave } from '../../types';
import PageHeader from '../common/PageHeader';
import Loader from '../common/Loader';
import { MoreVertical, X } from 'lucide-react';
import { useToast } from '../common/ToastContext';
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "../ui/sheet";

type Status = 'approved' | 'pending' | 'rejected' | 'cancelled';
type DrawerField = {
    label: string;
    key: keyof Leave;
    format?: boolean;
};
const STATUS_STYLES: Record<Status, string> = {
    approved: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
};

const STATUS_OPTIONS = [
    { label: 'Approved', value: 'approved' },
    { label: 'Pending', value: 'pending' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Cancelled', value: 'cancelled' },
];

const COLUMNS = [
    { key: 'dates', label: 'Leave Dates' },
    { key: 'leave_type', label: 'Leave Type' },
    { key: 'status', label: 'Status' },
    { key: 'requested_by', label: 'Requested By' },
    { key: 'created_at', label: 'Applied On' },
    { key: 'reason', label: 'Note' },
    { key: 'actions', label: 'Actions' },
];

const FIELDS: DrawerField[] = [
    { label: 'Leave Type', key: 'leave_type' },
    { label: 'From', key: 'from_date', format: true },
    { label: 'To', key: 'to_date', format: true },
    { label: 'Applied On', key: 'created_at', format: true },
    { label: 'Reviewed At', key: 'approved_at', format: true },
    { label: 'Reviewed By', key: 'approved_by_name' },
];

const formatDate = (dateString: string) =>
    dateString
        ? new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
        : '-';

const StatusBadge = ({ status }: { status: Status }) => (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}>
        {STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status}
    </span>
);

const LeaveHistory: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [filters, setFilters] = useState({ leaveType: '', status: '', search: '' });
    const leaveTypes = user?.leave_types || [];
    const [leaveHistory, setLeaveHistory] = useState<Leave[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
    const [cancelling, setCancelling] = useState(false);
    const toast = useToast();

    useEffect(() => {
        const fetchLeaveHistory = async () => {
            try {
                setLoading(true);
                const params: Record<string, unknown> = {
                    limit: 5
                };
                if (filters.status) params.status = filters.status;
                if (filters.leaveType) params.leave_type_id = filters.leaveType;
                if (filters.search) params.search = filters.search;

                const response = await getHistory({ ...params, page });
                setLeaveHistory(response.data.data || []);
                setTotalPages(response.data.totalPages || 1);
            } catch {
                toast.error('Failed to load leave history');
            } finally {
                setLoading(false);
            }
        };
        fetchLeaveHistory();
    }, [filters, page, toast]);

    const handleFilterChange = (key: string, value: string) => {
        setPage(1);
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setPage(1);
        setFilters({ leaveType: '', status: '', search: '' });
    };

    const handleCancel = async () => {
        if (!selectedLeave || !window.confirm('Cancel this leave request?')) return;
        try {
            setCancelling(true);
            await cancelLeave(selectedLeave.id);
            toast.success("Leave request cancelled");
            // Refresh to show the new status
            const params: any = { limit: 5, page };
            if (filters.status) params.status = filters.status;
            if (filters.leaveType) params.leave_type_id = filters.leaveType;
            if (filters.search) params.search = filters.search;
            const response = await getHistory(params);
            setLeaveHistory(response.data.data || []);
            setSelectedLeave(null);
        } catch {
            toast.error('Failed to cancel leave');
        } finally {
            setCancelling(false);
        }
    };

    const hasActiveFilters = Object.values(filters).some(Boolean);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <PageHeader
                title="Leave History"
                subtitle="View all your past leave requests"
                divider
            />

            <div className="flex flex-wrap gap-4 items-center pb-4 mb-4 border-b border-gray-100">
                <select
                    value={filters.leaveType}
                    onChange={(e) => handleFilterChange('leaveType', e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2"
                >
                    <option value="">All Types</option>
                    {leaveTypes.map((lt) => (
                        <option key={lt.id} value={lt.id}>{lt.name}</option>
                    ))}
                </select>

                <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2"
                >
                    <option value="">All Status</option>
                    {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                </select>

                <input
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Search by reason"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                />

                {hasActiveFilters && (
                    <button onClick={clearFilters} className="text-sm text-red-500 hover:underline whitespace-nowrap">
                        Clear filters
                    </button>
                )}
            </div>

            <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="text-center py-8"><Loader /></div>
                ) : leaveHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <img
                            src="/empty.svg"
                            className="w-40 h-40 mb-4 object-contain opacity-80 select-none"
                            alt="No leave history"
                        />
                        <p className="font-bold text-slate-800 text-lg">No leave history yet</p>
                        <p className="text-sm text-slate-400 mt-1 max-w-sm leading-relaxed">Your past requests, approved leaves, and balances will appear here once submitted.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 text-xs uppercase text-gray-500">
                            <tr>
                                {COLUMNS.map((col) => (
                                    <th
                                        key={col.key}
                                        className={`px-6 py-3 text-left ${col.key === 'actions' ? 'text-center' : ''}`}
                                    >
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
                                            {row.from_date !== row.to_date && <> → {formatDate(row.to_date)}</>}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {row.total_days} day{row.total_days > 1 ? 's' : ''}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium">{row.leave_type}</td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={row.status as Status} />
                                        {row.approved_by_name && row.status !== 'pending' && (
                                            <div className="text-xs text-gray-400 mt-1">
                                                by {row.approved_by_name}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">{row.user_name || 'You'}</td>
                                    <td className="px-6 py-4 text-gray-500">{formatDate(row.created_at || '')}</td>
                                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{row.reason}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => setSelectedLeave(row)}
                                            className="p-1 rounded hover:bg-gray-100 text-gray-500"
                                        >
                                            <MoreVertical size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="flex justify-center gap-4 mt-4">
                {[
                    { label: 'Prev', disabled: page === 1, onClick: () => setPage((p) => p - 1) },
                    { label: 'Next', disabled: page === totalPages, onClick: () => setPage((p) => p + 1) },
                ].map(({ label, disabled, onClick }) => (
                    <button
                        key={label}
                        disabled={disabled}
                        onClick={onClick}
                        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 text-sm font-semibold"
                    >
                        {label}
                    </button>
                ))}
                <span className="px-4 py-2 self-center text-sm font-semibold text-gray-600">Page {page} of {totalPages}</span>
            </div>

            <Sheet open={!!selectedLeave} onOpenChange={(open) => { if (!open) setSelectedLeave(null); }}>
                <SheetContent className="overflow-y-auto sm:max-w-[540px] w-full p-0 flex flex-col border-l-0 shadow-2xl bg-white animate-in slide-in-from-right duration-300">
                    {selectedLeave && (
                        <>
                            <div className="px-6 py-8 border-b border-gray-100 bg-white sticky top-0 z-10">
                                <SheetHeader className="text-left">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5746AF] to-primary-dark flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-primary-light flex-shrink-0">
                                                {selectedLeave.user_name?.charAt(0).toUpperCase() || "Y"}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <SheetTitle className="text-xl font-bold text-gray-900 truncate">Leave Details</SheetTitle>
                                                    <StatusBadge status={selectedLeave.status as Status} />
                                                </div>
                                                <SheetDescription className="text-sm font-medium text-gray-500 mt-1 truncate">
                                                    {selectedLeave.leave_type} · Requested by {selectedLeave.user_name || "You"}
                                                </SheetDescription>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedLeave(null)}
                                            className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors shrink-0 text-gray-400 hover:text-gray-600"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </SheetHeader>
                            </div>

                            <div className="px-8 py-8 space-y-8 flex-1 overflow-y-auto bg-white">
                                <div className="grid grid-cols-1 gap-4">
                                    {FIELDS.filter(({ key }) => selectedLeave[key as keyof Leave]).map(({ label, key, format }) => (
                                        <div key={key} className="bg-gray-50 rounded-2xl px-5 py-4 flex flex-col gap-1 transition-colors hover:bg-gray-100/70 border border-gray-100/50">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
                                            <span className="text-sm font-semibold text-gray-800">
                                                {format
                                                    ? formatDate(selectedLeave[key as keyof Leave] as string)
                                                    : selectedLeave[key as keyof Leave] as string}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="bg-gray-50 rounded-2xl px-5 py-4 flex flex-col gap-1 border border-gray-100/50">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Days</span>
                                        <span className="text-sm font-semibold text-gray-800">
                                            {selectedLeave.total_days} day{selectedLeave.total_days > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100/50">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Reason for Leave</p>
                                    <p className="text-sm text-gray-700 leading-relaxed font-medium italic">"{selectedLeave.reason}"</p>
                                </div>

                                {selectedLeave.rejection_reason && (
                                    <div className="p-6 rounded-2xl bg-red-50 border border-red-100/50">
                                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-3">Manager's Note</p>
                                        <p className="text-sm text-red-700 leading-relaxed font-medium italic">"{selectedLeave.rejection_reason}"</p>
                                    </div>
                                )}
                            </div>

                            {selectedLeave.status === 'pending' && (
                                <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50">
                                    <button
                                        onClick={handleCancel}
                                        disabled={cancelling}
                                        className="w-full py-3.5 rounded-2xl bg-red-600 text-white text-sm font-bold shadow-lg shadow-red-100 hover:bg-red-700 transition-all disabled:opacity-50"
                                    >
                                        {cancelling ? 'Cancelling Request...' : 'Cancel Leave Request'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default LeaveHistory;