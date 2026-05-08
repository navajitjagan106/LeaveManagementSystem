import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTeamMembers, getLeaveTrend } from '../../api/leaveApi';
import { getEmployees } from '../../api/managementApi';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import PageHeader from '../common/PageHeader';
import Loader from '../common/Loader';
import { Search, ChevronRight, Phone, MapPin, MoreHorizontal, Users, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../ui/tooltip';

import EmployeeDetailsModal from '../modals/EmployeeDetailModal';
import InviteEmployeeModal from '../modals/InviteEmployeeModal';

const PALETTE = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#14b8a6", "#f97316"];
const ROLE_COLORS = [
    { bg: '#ede9fe', text: '#5746AF' },
    { bg: '#dbeafe', text: '#3b82f6' },
    { bg: '#dcfce7', text: '#16a34a' },
    { bg: '#fef3c7', text: '#d97706' },
    { bg: '#fce7f3', text: '#db2777' },
    { bg: '#e0f2fe', text: '#0284c7' },
];
const ROLE_STYLE: Record<string, { bg: string; text: string }> = {
    admin: { bg: '#fee2e2', text: '#ef4444' },
};
const getRoleStyle = (role: string) => {
    if (ROLE_STYLE[role]) return ROLE_STYLE[role];
    const idx = role.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % ROLE_COLORS.length;
    return ROLE_COLORS[idx];
};

type Employee = {
    id: number; name: string; email: string;
    role: string; department: string | null; manager_name: string | null;
    phone?: string | null; location?: string | null;
    gender?: string | null; date_of_birth?: string | null;
    manager_id?: number | null;
    policy_id?: number | null;
    policy_name?: string | null;
    created_at?: string | null;
};
type FilterKey = string

const avatarColor = (name: string) => PALETTE[name.charCodeAt(0) % PALETTE.length];

const EmployeeCard: React.FC<{
    emp: Employee;
    onClick: () => void;
    onEdit?: () => void;
}> = ({ emp, onClick, onEdit }) => {
    const roleStyle = getRoleStyle(emp.role);
    const color = avatarColor(emp.name);

    return (
        <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-3 hover:border-primary-light hover:shadow-md transition-all group">
            <div className="flex items-center gap-3">
                <div
                    role="button"
                    onClick={onClick}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 cursor-pointer"
                    style={{ background: color }}
                >
                    {emp.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1 cursor-pointer" onClick={onClick}>
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors truncate">
                        {emp.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{emp.email}</p>
                </div>
                {onEdit ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="text-gray-300 hover:text-primary hover:bg-primary-light p-1.5 rounded-lg transition flex-shrink-0"
                        title="Edit employee"
                    >
                        <MoreHorizontal size={16} />
                    </button>
                ) : (
                    <ChevronRight
                        size={14}
                        onClick={onClick}
                        className="text-gray-300 group-hover:text-primary flex-shrink-0 transition-colors cursor-pointer"
                    />
                )}
            </div>

            <div className="flex items-center justify-between gap-2" onClick={onClick} role="button">
                <span
                    className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize"
                    style={{ background: roleStyle.bg, color: roleStyle.text }}
                >
                    {emp.role}
                </span>
                {emp.department && (
                    <span className="text-xs text-gray-400 truncate">{emp.department}</span>
                )}
            </div>

            {emp.manager_name && (
                <p className="text-[11px] text-gray-400 cursor-pointer" onClick={onClick}>
                    Reports to <span className="font-medium text-gray-600">{emp.manager_name}</span>
                </p>
            )}

            {(emp.phone || emp.location) && (
                <div className="flex flex-col gap-1 pt-1 border-t border-gray-50">
                    {emp.phone && (
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                            <Phone size={10} className="flex-shrink-0" />
                            <span>{emp.phone}</span>
                        </div>
                    )}
                    {emp.location && (
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                            <MapPin size={10} className="flex-shrink-0" />
                            <span>{emp.location}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

/* ── Page ── */
const EmployeeDirectory: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const isAdmin = user?.role === 'admin';
    const canEdit = isAdmin || !!user?.permissions?.['manage_employees']?.can_edit;
    const canDelete = isAdmin || !!user?.permissions?.['manage_employees']?.can_delete;
    const canInvite = isAdmin || !!user?.permissions?.['manage_invitations']?.can_edit;

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<FilterKey>('all');
    const [editTarget, setEditTarget] = useState<Employee | null>(null);
    const [showInvite, setShowInvite] = useState(false);
    const [dirPage, setDirPage] = useState(1);

    useEffect(() => {
        setDirPage(1);
    }, [search, roleFilter]);

    const [leaveTrend, setLeaveTrend] = useState<{ date: string, count: number, employees: string[] }[]>([]);

    const fetchEmployees = async () => {
        try {
            const employeesPromise = isAdmin ? getEmployees() : getTeamMembers();
            const trendPromise = getLeaveTrend();

            const [empRes, trendRes] = await Promise.all([employeesPromise, trendPromise]);

            setEmployees(empRes.data.data || []);

            const trendMap = new Map<string, { count: number; employees: string[] }>();
            trendRes.data.data.forEach((row: any) => {
                const d = new Date(row.date);
                // Adjust for local timezone safely to avoid off-by-one errors
                const dateStr = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

                const existing = trendMap.get(dateStr) || { count: 0, employees: [] };
                const rowEmployees = row.employees || [];
                const mergedEmployees = Array.from(new Set([...existing.employees, ...rowEmployees]));

                trendMap.set(dateStr, {
                    count: existing.count + Number(row.count),
                    employees: mergedEmployees
                });
            });
            setLeaveTrend(Array.from(trendMap.entries()).map(([date, val]) => ({ date, count: val.count, employees: val.employees })));
        } catch (err: any) {
            console.error("Failed to load data:", err);
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { filters, counts } = useMemo(() => {
        const roleSet = Array.from(new Set(employees.map(e => e.role))).sort();
        const filters = [
            { key: 'all', label: 'All Staff' },
            ...roleSet.map(role => ({
                key: role,
                label: role.split(/[-_]/).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + 's',
            })),
        ];
        const counts: Record<string, number> = { all: employees.length };
        roleSet.forEach(role => {
            counts[role] = employees.filter(e => e.role === role).length;
        });
        return { filters, counts };
    }, [employees]);

    // GitHub-style Calendar Heatmap Logic
    const { weeks, maxCount } = useMemo(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 364);

        // Snap to previous Sunday to align the columns
        while (start.getDay() !== 0) {
            start.setDate(start.getDate() - 1);
        }

        const days = [];
        let current = new Date(start);
        while (current <= end) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        const map = new Map<string, { count: number; employees: string[] }>();
        leaveTrend.forEach(d => map.set(d.date, { count: d.count, employees: d.employees || [] }));

        const max = Math.max(1, ...leaveTrend.map(d => d.count));

        const gridWeeks = [];
        for (let i = 0; i < days.length; i += 7) {
            const weekDays = days.slice(i, i + 7).map(day => {
                const dateStr = new Date(day.getTime() - (day.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                const dayData = map.get(dateStr) || { count: 0, employees: [] };
                return {
                    day,
                    dateStr,
                    count: dayData.count,
                    employeesOnLeave: dayData.employees
                };
            });
            gridWeeks.push(weekDays);
        }

        return { weeks: gridWeeks, maxCount: max };
    }, [leaveTrend]);

    const getHeatmapColor = (count: number) => {
        if (count === 0) return '#ebedf0'; // GitHub empty gray
        const ratio = count / maxCount;
        if (ratio <= 0.25) return '#9be9a8'; // Light green
        if (ratio <= 0.50) return '#40c463'; // Medium green
        if (ratio <= 0.75) return '#30a14e'; // Dark green
        return '#216e39'; // Deepest green
    };

    const filtered = useMemo(() =>
        employees
            .filter(e => roleFilter === 'all' || e.role === roleFilter)
            .filter(e =>
                e.name.toLowerCase().includes(search.toLowerCase()) ||
                e.email.toLowerCase().includes(search.toLowerCase()) ||
                (e.department ?? '').toLowerCase().includes(search.toLowerCase()) ||
                (e.location ?? '').toLowerCase().includes(search.toLowerCase())
            ),
        [employees, roleFilter, search]
    );

    const ITEMS_PER_PAGE = 6;
    const totalDirPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
    const paginatedEmployees = useMemo(() => {
        const startIdx = (dirPage - 1) * ITEMS_PER_PAGE;
        return filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);
    }, [filtered, dirPage]);

    if (loading) return <div className="flex justify-center items-center h-48"><Loader /></div>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <PageHeader
                    title="Employee Directory"
                    subtitle={isAdmin ? 'Overview of your organizational structure' : 'Your team members'}
                    divider={false}
                />
                {canInvite && (
                    <button
                        onClick={() => setShowInvite(true)}
                        className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm hover:shadow-md active:scale-95 flex-shrink-0 mt-1"
                    >
                        <Plus size={13} className="stroke-[3px]" /> Invite Employee
                    </button>
                )}
            </div>
            <div className="border-t border-gray-100" />

            {/* ── Annual Leave Heatmap ── */}
            <Card className="shadow-none border-gray-100 bg-gray-50/50 mb-2">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Users size={16} className="text-[#30a14e]" />
                        Team Leave Activity (365 Days)
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Daily leave volume across your team over the past year. Darker green indicates higher absence density.
                    </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto pb-5 pt-6">
                    <TooltipProvider>
                        <div className="flex min-w-[800px] w-full gap-2">
                            {/* Day labels (Sun, Mon, etc) */}
                            <div className="flex flex-col gap-[4px] justify-end pr-2 text-[10px] text-gray-400 font-medium pb-[1px] w-[32px] shrink-0">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                    <span key={d} className="leading-[14px]">{d}</span>
                                ))}
                            </div>
                            {/* 52-week Grid */}
                            <div className="flex flex-1 justify-between gap-1">
                                {weeks.map((week, wi) => {
                                    let monthLabel = null;
                                    if (wi > 0 && weeks[wi - 1][0].day.getMonth() !== week[0].day.getMonth()) {
                                        monthLabel = week[0].day.toLocaleDateString('en-US', { month: 'short' });
                                    }

                                    return (
                                        <div key={wi} className="flex flex-col gap-[4px] relative flex-1 max-w-[16px] items-center">
                                            {/* Dynamic Month Label above the column */}
                                            {monthLabel && (
                                                <span className="absolute -top-5 left-0 text-[10px] text-gray-500 font-semibold whitespace-nowrap">
                                                    {monthLabel}
                                                </span>
                                            )}
                                            {/* Days */}
                                            {week.map((cell, di) => {
                                                const { day, count, employeesOnLeave } = cell;

                                                return (
                                                    <Tooltip key={di}>
                                                        <TooltipTrigger asChild>
                                                            <div
                                                                className="w-full aspect-square rounded-[2px] transition-transform hover:scale-125 hover:z-10 cursor-pointer shadow-sm"
                                                                style={{
                                                                    backgroundColor: getHeatmapColor(count),
                                                                    border: count === 0 ? '1px solid rgba(27,31,35,0.06)' : '1px solid rgba(27,31,35,0.1)'
                                                                }}
                                                            />
                                                        </TooltipTrigger>
                                                        <TooltipContent className="p-3 bg-white border border-gray-100 shadow-xl rounded-xl text-xs flex flex-col gap-1.5 max-w-[220px]">
                                                            <div className="font-bold text-gray-800">
                                                                {day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </div>
                                                            <div className="text-gray-500 font-medium">
                                                                {count} employee{count !== 1 ? 's' : ''} on leave
                                                            </div>
                                                            {employeesOnLeave.length > 0 && (
                                                                <div className="mt-1 pt-1 border-t border-gray-100 flex flex-col gap-1">
                                                                    <span className="text-[10px] uppercase font-bold text-gray-400">On Leave:</span>
                                                                    <div className="flex flex-col gap-0.5 text-gray-700 font-medium max-h-[100px] overflow-y-auto pr-1">
                                                                        {employeesOnLeave.map((emp, i) => (
                                                                            <span key={i} className="truncate">• {emp}</span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </TooltipProvider>
                </CardContent>
            </Card>

            {/* ── Directory ── */}
            <Card className="overflow-hidden p-0 bg-gray-50/50 shadow-none border-gray-100 mt-2">
                <div className="flex flex-col sm:flex-row items-stretch border-b border-gray-100">
                    <div className="flex-1 px-6 py-4">
                        <CardTitle className="text-sm font-semibold">Directory</CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                            {canEdit ? 'Click ··· to edit, or the card to view profile' : 'Click any card to view full profile'}
                        </CardDescription>
                    </div>
                    <div className="flex divide-x divide-gray-100 border-t sm:border-t-0 sm:border-l border-gray-100">
                        {filters.filter(f => f.key === 'all' || counts[f.key] > 0).map(f => (
                            <button
                                key={f.key}
                                onClick={() => setRoleFilter(f.key)}
                                data-active={roleFilter === f.key}
                                className="flex flex-col justify-center px-5 py-3 text-left transition-colors hover:bg-gray-50 data-[active=true]:bg-primary-light/60"
                            >
                                <span className="text-[10px] text-gray-400 whitespace-nowrap">{f.label}</span>
                                <span className="text-xl font-bold mt-0.5" style={{ color: roleFilter === f.key ? '#5746AF' : '#9ca3af' }}>
                                    {counts[f.key]}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-4">
                    <div className="relative w-72">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <Input
                            placeholder="Search name, email or department…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-8 h-8 text-xs rounded-lg border-gray-200"
                        />
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                        {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                    </span>
                </div>

                <CardContent className="p-4">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <img 
                                src="/empty.svg" 
                                className="w-32 h-32 mb-3 object-contain opacity-75 select-none" 
                                alt="No results" 
                            />
                            <p className="font-semibold text-slate-700 text-sm">No employees match your search</p>
                            <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or department filters.</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {paginatedEmployees.map(emp => (
                                    <EmployeeCard
                                        key={emp.id}
                                        emp={emp}
                                        onClick={() => navigate(`/employees/${emp.id}`, { state: { employee: emp } })}
                                        onEdit={canEdit ? () => setEditTarget(emp) : undefined}
                                    />
                                ))}
                            </div>

                            {totalDirPages > 1 && (
                                <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t border-gray-100/50">
                                    <Button
                                        disabled={dirPage === 1}
                                        onClick={() => setDirPage(p => p - 1)}
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs font-semibold"
                                    >
                                        Prev
                                    </Button>
                                    <span className="text-xs font-bold text-gray-600">
                                        Page {dirPage} of {totalDirPages}
                                    </span>
                                    <Button
                                        disabled={dirPage === totalDirPages}
                                        onClick={() => setDirPage(p => p + 1)}
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs font-semibold"
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {editTarget && (
                <EmployeeDetailsModal
                    user={editTarget}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onClose={() => setEditTarget(null)}
                    onSuccess={() => { fetchEmployees(); setEditTarget(null); }}
                />
            )}

            {showInvite && (
                <InviteEmployeeModal
                    onClose={() => setShowInvite(false)}
                    onSuccess={() => { fetchEmployees(); setShowInvite(false); }}
                />
            )}
        </div>
    );
};

export default EmployeeDirectory;
