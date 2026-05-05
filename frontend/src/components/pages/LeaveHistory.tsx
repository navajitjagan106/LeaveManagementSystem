import React, { useEffect, useState } from 'react';
import { cancelLeave, getHistory, getLeaveInitData } from '../../api/leaveApi';
import { LeaveType, LeaveHistory as Leave } from '../../types';
import PageHeader from '../common/PageHeader';
import Loader from '../common/Loader';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { MoreVertical,  Palmtree } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../common/ToastContext';
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "../ui/sheet";

type Status = 'approved' | 'pending' | 'rejected';
type DrawerField = {
    label: string;
    key: keyof Leave;
    format?: boolean;
};
const STATUS_STYLES: Record<Status, string> = {
    approved: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    rejected: 'bg-red-100 text-red-700',
};

const STATUS_COLORS: Record<Status, string> = {
    approved: '#22c55e',
    pending: '#f59e0b',
    rejected: '#ef4444',
};

const STATUS_DOT: Record<Status, string> = {
    approved: 'bg-green-500',
    pending: 'bg-yellow-400',
    rejected: 'bg-red-500',
};

const STATUSES = ['approved', 'pending', 'rejected'] as const;

const STATUS_OPTIONS = STATUSES.map((s) => ({
    label: s.charAt(0).toUpperCase() + s.slice(1),
    value: s,
}));

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
]

const VIEWS = ['table', 'calendar'] as const;
type View = typeof VIEWS[number];


const formatDate = (dateString: string) =>
    dateString
        ? new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
        : '-';

const toISO = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};


const StatusBadge = ({ status }: { status: Status }) => (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}>
        {STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status}
    </span>
);


const getMonthRange = (date = new Date()) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return {
        from: `${y}-${m}-01`,
        to: `${y}-${m}-${new Date(y, date.getMonth() + 1, 0).getDate()}`,
    };
};

const LeaveHistory: React.FC = () => {
    const { holidays } = useOutletContext<{ holidays: any[] }>();
    const [filters, setFilters] = useState({ leaveType: '', status: '', search: '' });
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [leaveHistory, setLeaveHistory] = useState<Leave[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [view, setView] = useState<View>('table');
    const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
    const [cancelling, setCancelling] = useState(false);
    const [calendarRange, setCalendarRange] = useState(getMonthRange());
    const toast = useToast();

    useEffect(() => {
        getLeaveInitData()
            .then((res) => setLeaveTypes(res.data.data.leaveTypes))
            .catch((err) => console.error('Failed to fetch leave types', err));
    }, []);

    useEffect(() => {
        const fetchLeaveHistory = async () => {
            try {
                setLoading(true);
                const params: Record<string, unknown> = {};
                if (filters.status) params.status = filters.status;
                if (filters.leaveType) params.leave_type_id = filters.leaveType;
                if (filters.search) params.search = filters.search;

                if (view === 'calendar') {
                    params.from_date = calendarRange.from;
                    params.to_date = calendarRange.to;
                    params.limit = 100;
                } else {
                    params.limit = 5;
                }

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
    }, [filters, page, view, calendarRange, toast]);

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
            setLeaveHistory((prev) => prev.filter((l) => l.id !== selectedLeave.id));
            setSelectedLeave(null);
        } catch {
            toast.error('Failed to cancel leave');
        } finally {
            setCancelling(false);
        }
    };

    const hasActiveFilters = Object.values(filters).some(Boolean);

    const holidayDates = holidays.map((h: any) => toISO(new Date(h.date)));

    const holidayEvents = holidays.map((h: any) => ({
        title: h.name,
        start: toISO(new Date(h.date)),
        backgroundColor: '#fef3c7',
        borderColor: '#f59e0b',
        textColor: '#92400e',
        display: 'block',
        classNames: ['holiday-event'],
    }));

    const calendarEvents = [
        ...holidayEvents,
        ...leaveHistory.flatMap((leave) => {
            const events: any[] = [];
            let current = new Date(leave.from_date);
            const end = new Date(leave.to_date);
            current.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);

            while (current <= end) {
                const day = current.getDay();
                const dateStr = toISO(current);
                const isWeekend = day === 0 || day === 6;
                const isHoliday = holidayDates.includes(dateStr);

                if (!isWeekend && !isHoliday) {
                    events.push({
                        title: leave.leave_type,
                        start: dateStr,
                        backgroundColor: STATUS_COLORS[leave.status as Status],
                        borderColor: 'transparent',
                        textColor: '#fff',
                        extendedProps: { leave },
                    });
                }
                current.setDate(current.getDate() + 1);
            }
            return events;
        }),
    ];


    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <PageHeader
                title="Leave History"
                subtitle="View all your past leave requests"
                divider
                action={
                    <div className="flex gap-2">
                        {VIEWS.map((v) => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition capitalize
                                    ${view === v ? 'bg-[#5746AF] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                }
            />

            {view === 'table' && (
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
            )}

            {/* Calendar view */}
            {view === 'calendar' && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-lg">
                            <Loader />
                        </div>
                    )}
                    <div className="flex gap-6 text-sm mb-4">
                        {STATUSES.map((s) => (
                            <div key={s} className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full ${STATUS_DOT[s]}`} />
                                <span className="text-gray-600">{STATUS_OPTIONS.find((o) => o.value === s)?.label}</span>
                            </div>
                        ))}
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-yellow-200 border border-yellow-400" />
                            <span className="text-gray-600">Holiday</span>
                        </div>
                    </div>
                    <FullCalendar
                        plugins={[dayGridPlugin]}
                        initialView="dayGridMonth"
                        height="auto"
                        events={calendarEvents}
                        eventDisplay="block"
                        eventClick={(info) => setSelectedLeave(info.event.extendedProps.leave as Leave)}
                        eventContent={(arg) => {
                            const isHoliday = arg.event.classNames.includes('holiday-event');
                            return (
                                <div className="flex items-center gap-1 px-2 py-0.5 w-full cursor-pointer">
                                    {isHoliday && <Palmtree size={12} color="#92400e" />}
                                    <span
                                        style={{ color: isHoliday ? '#92400e' : '#fff' }}
                                        className="text-xs font-medium truncate"
                                    >
                                        {arg.event.title}
                                    </span>
                                </div>
                            );
                        }}
                        dayCellClassNames={(arg) => {
                            const day = arg.date.getDay();
                            const isCurrentMonth = arg.date.getMonth() === arg.view.currentStart.getMonth();
                            return (day === 0 || day === 6) && isCurrentMonth ? ['bg-gray-50'] : [];
                        }}
                        dayCellContent={(arg) => {
                            const day = arg.date.getDay();
                            const isWeekend = day === 0 || day === 6;
                            return (
                                <div className="flex flex-col items-end pr-1 pt-1">
                                    <span className={
                                        arg.isToday
                                            ? 'bg-[#5746AF] text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold'
                                            : isWeekend
                                                ? 'text-sm text-gray-400 font-medium'
                                                : 'text-sm text-gray-600'
                                    }>
                                        {arg.dayNumberText}
                                    </span>
                                    {isWeekend && (
                                        <span className="text-[9px] text-gray-400 mt-0.5">
                                            {day === 6 ? 'Sat' : 'Sun'}
                                        </span>
                                    )}
                                </div>
                            );
                        }}
                        datesSet={(arg) => {
                            const newFrom = toISO(arg.view.currentStart);
                            const newTo = toISO(new Date(arg.view.currentEnd.getTime() - 1));
                            setCalendarRange((prev) =>
                                prev.from === newFrom && prev.to === newTo ? prev : { from: newFrom, to: newTo }
                            );
                        }}
                    headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
                    />
                </div>
            )}

            {/* Table view */}
            {view === 'table' && (
                <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="text-center py-8"><Loader /></div>
                    ) : leaveHistory.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No leave history found</div>
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
            )}

            {view === 'table' && (
                <div className="flex justify-center gap-4 mt-4">
                    {[
                        { label: 'Prev', disabled: page === 1, onClick: () => setPage((p) => p - 1) },
                        { label: 'Next', disabled: page === totalPages, onClick: () => setPage((p) => p + 1) },
                    ].map(({ label, disabled, onClick }) => (
                        <button
                            key={label}
                            disabled={disabled}
                            onClick={onClick}
                            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                        >
                            {label}
                        </button>
                    ))}
                    <span className="px-4 py-2 self-center">Page {page} of {totalPages}</span>
                </div>
            )}

            <Sheet open={!!selectedLeave} onOpenChange={(open) => { if (!open) setSelectedLeave(null); }}>
                <SheetContent className="overflow-y-auto sm:max-w-[540px] w-full p-0 flex flex-col border-l-0 shadow-2xl bg-white">
                    {selectedLeave && (
                        <>
                            <div className="px-6 py-8 border-b border-gray-100 bg-white sticky top-0 z-10">
                                <SheetHeader className="text-left">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5746AF] to-indigo-700 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-100 flex-shrink-0">
                                            {selectedLeave.user_name?.charAt(0).toUpperCase() || "Y"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <SheetTitle className="text-xl font-bold text-gray-900">Leave Details</SheetTitle>
                                                <StatusBadge status={selectedLeave.status as Status} />
                                            </div>
                                            <SheetDescription className="text-sm font-medium text-gray-500 mt-1">
                                                {selectedLeave.leave_type} · Requested by {selectedLeave.user_name || "You"}
                                            </SheetDescription>
                                        </div>
                                    </div>
                                </SheetHeader>
                            </div>

                            <div className="px-8 py-8 space-y-8 flex-1 overflow-y-auto">
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