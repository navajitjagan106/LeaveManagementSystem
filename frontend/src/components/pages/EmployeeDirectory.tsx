import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTeamMembers, getLeaveTrend } from '../../api/leaveApi';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import PageHeader from '../common/PageHeader';
import Loader from '../common/Loader';
import { Search, ChevronRight, Phone, MapPin, MoreHorizontal, Users, Plus, TrendingUp, BarChart2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../ui/tooltip';
import { Bar, BarChart, Cell, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';

import EmployeeDetailsModal from '../modals/EmployeeDetailModal';
import InviteEmployeeModal from '../modals/InviteEmployeeModal';
import { getAvatarGradient } from '../../utils/avatar';

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

const EmployeeCard: React.FC<{
    emp: Employee;
    onClick: () => void;
    onEdit?: () => void;
}> = ({ emp, onClick, onEdit }) => {
    const roleStyle = getRoleStyle(emp.role);

    return (
        <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-3 hover:border-primary-light hover:shadow-md transition-all group">
            <div className="flex items-center gap-3">
                <div
                    role="button"
                    onClick={onClick}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 cursor-pointer bg-gradient-to-tr ${getAvatarGradient(emp.id || emp.name)}`}
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

const normalizeDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
};

interface LeaveHeatmapProps {
    monthsGrouped: {
        monthName: string;
        weeks: {
            day: Date | null;
            dateStr: string;
            count: number;
            employeesOnLeave: string[];
            isPlaceholder?: boolean;
        }[][];
    }[];
    maxCount: number;
    loading: boolean;
}

const LeaveHeatmap: React.FC<LeaveHeatmapProps> = React.memo(({ monthsGrouped, maxCount, loading }) => {
    const getHeatmapColor = (count: number) => {
        if (count === 0) return '#ebedf0'; // Slate empty light gray
        const ratio = count / maxCount;
        if (ratio <= 0.25) return '#dcfce7'; // Emerald-100 (Very Light green)
        if (ratio <= 0.50) return '#86efac'; // Emerald-300 (Light green)
        if (ratio <= 0.75) return '#22c55e'; // Emerald-500 (Vibrant green)
        return '#15803d'; // Emerald-700 (Deep Forest Green)
    };

    if (loading) {
        return (
            <Card className="shadow-none border border-gray-100 bg-gray-50/50 mb-4 rounded-xl overflow-hidden">
                <CardContent className="py-12 flex flex-col items-center justify-center">
                    <Loader />
                    <p className="text-xs text-gray-400 font-semibold mt-2.5 tracking-wide">Assembling organization heatmap trend...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-none border border-gray-150/70 bg-gradient-to-br from-white to-gray-50/20 mb-4 rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-gray-100/60 bg-white/40">
                <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-800">
                            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                                <Users size={14} className="stroke-[2.5]" />
                            </span>
                            Team Absence Heatmap (180 Days)
                        </CardTitle>
                        <CardDescription className="text-xs text-gray-500 font-medium leading-relaxed">
                            A live visual distribution of daily leave volumes across your department over the past 6 months.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pb-5 pt-8 px-6 bg-white flex flex-col gap-5">
                <TooltipProvider>
                    <div className="flex items-start select-none overflow-x-auto pb-2 scrollbar-thin">
                        <div className="flex mx-auto gap-2.5 items-start py-1">
                            {/* Row labels aligned precisely to the grid */}
                            <div className="flex flex-col gap-[3.5px] justify-start pr-1.5 text-[9px] text-gray-400 font-bold w-[28px] shrink-0 select-none pt-[34px]">
                                {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, di) => (
                                    <span key={di} className="h-[11px] leading-[11px] text-right">{d}</span>
                                ))}
                            </div>

                            {/* Grouped Month Cards */}
                            <div className="flex gap-3 shrink-0">
                                {monthsGrouped.map((mGroup, mi) => (
                                    <div key={mi} className="flex flex-col gap-2 relative bg-gray-50/20 border border-gray-100/60 p-2.5 rounded-xl hover:bg-gray-50/50 transition-colors">
                                        {/* Centered Month Title */}
                                        <span className="text-[10px] text-gray-400 font-bold tracking-wider text-center select-none pb-1.5 border-b border-gray-100/50 block">
                                            {mGroup.monthName}
                                        </span>

                                        {/* Weeks of this month */}
                                        <div className="flex gap-[3.5px] pt-1">
                                            {mGroup.weeks.map((week, wi) => (
                                                <div key={wi} className="flex flex-col gap-[3.5px] shrink-0 w-[11px] items-center">
                                                    {week.map((cell, di) => {
                                                        const { day, count, employeesOnLeave, isPlaceholder } = cell;

                                                        if (isPlaceholder) {
                                                            return (
                                                                <div
                                                                    key={di}
                                                                    className="w-[11px] h-[11px]"
                                                                    style={{
                                                                        backgroundColor: 'transparent',
                                                                        border: 'none',
                                                                        pointerEvents: 'none'
                                                                    }}
                                                                />
                                                            );
                                                        }

                                                        const bgCol = getHeatmapColor(count);

                                                        const dayCell = (
                                                            <div
                                                                className="w-[11px] h-[11px] rounded-[1.5px] transition-all hover:scale-125 hover:shadow hover:z-10 cursor-pointer"
                                                                style={{
                                                                    backgroundColor: bgCol,
                                                                    border: count === 0 ? '1px solid #e2e8f0' : '1px solid rgba(16,185,129,0.1)'
                                                                }}
                                                            />
                                                        );

                                                        if (count === 0) {
                                                            return <React.Fragment key={di}>{dayCell}</React.Fragment>;
                                                        }

                                                        return (
                                                            <Tooltip key={di}>
                                                                <TooltipTrigger asChild>
                                                                    {dayCell}
                                                                </TooltipTrigger>
                                                                <TooltipContent className="p-3 bg-white border border-gray-100 shadow-xl rounded-xl text-xs flex flex-col gap-1.5 max-w-[220px]">
                                                                    <div className="font-bold text-gray-800">
                                                                        {day ? day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : ''}
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
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </TooltipProvider>

                {/* Legend and User Assistant Prompt Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-gray-100 text-xs text-gray-400 font-semibold select-none">
                    <span className="flex items-center gap-1.5 text-gray-400 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100/50">
                        <span className="text-emerald-500">⚡</span>
                        Hover over highlighted cells to check specific teammate details.
                    </span>
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Less</span>
                        <div className="w-[11px] h-[11px] rounded-[1.5px] bg-[#ebedf0] border border-[#e2e8f0]" />
                        <div className="w-[11px] h-[11px] rounded-[1.5px] bg-[#dcfce7]" />
                        <div className="w-[11px] h-[11px] rounded-[1.5px] bg-[#86efac]" />
                        <div className="w-[11px] h-[11px] rounded-[1.5px] bg-[#22c55e]" />
                        <div className="w-[11px] h-[11px] rounded-[1.5px] bg-[#15803d]" />
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">More</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});

LeaveHeatmap.displayName = "LeaveHeatmap";

interface MonthlyLeaveChartProps {
    data: { month: string; leaves: number }[];
    loading: boolean;
}

const MonthlyLeaveChart: React.FC<MonthlyLeaveChartProps> = React.memo(({ data, loading }) => {
    const chartConfig = {
        leaves: {
            label: "Total Leaves",
            color: "#10b981",
        },
    };

    if (loading) {
        return (
            <Card className="shadow-none border border-gray-100 bg-gray-50/50 h-full rounded-2xl overflow-hidden min-h-[340px]">
                <CardContent className="py-24 flex flex-col items-center justify-center">
                    <Loader />
                    <p className="text-xs text-gray-400 font-semibold mt-2.5 tracking-wide">Aggregating leave distribution stats...</p>
                </CardContent>
            </Card>
        );
    }

    const totalLeavesInWindow = data.reduce((sum, item) => sum + item.leaves, 0);

    return (
        <Card className="shadow-none border border-gray-150/70 bg-gradient-to-br from-white to-gray-50/20 h-full rounded-2xl overflow-hidden flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-gray-100/60 bg-white/40">
                <div className="space-y-1">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-800">
                        <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                            <BarChart2 size={14} className="stroke-[2.5]" />
                        </span>
                        Monthly Distribution
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-500 font-medium">
                        Monthly aggregation of days off taken over this period.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="pt-6 pb-2 px-4 flex-1 flex flex-col justify-center min-h-[180px]">
                <ChartContainer config={chartConfig} className="h-[180px] w-full">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{
                            left: 0,
                            right: 15,
                            top: 5,
                            bottom: 5
                        }}
                    >
                        <XAxis type="number" dataKey="leaves" hide />
                        <YAxis
                            dataKey="month"
                            type="category"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            className="text-[10px] text-gray-500 font-bold"
                            tickFormatter={(value) => value.split(' ')[0]}
                        />
                        <ChartTooltip
                            cursor={{ fill: "rgba(243, 244, 246, 0.5)", radius: 4 }}
                            content={<ChartTooltipContent />}
                        />
                        <Bar dataKey="leaves" radius={4} barSize={12}>
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.leaves === 0 ? "#ebedf0" : "#10b981"}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-1 text-[11px] font-semibold text-gray-400 bg-gray-50/40 p-4 border-t border-gray-100/60 mt-auto">
                <div className="flex gap-1.5 items-center text-gray-600 font-bold">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{totalLeavesInWindow} Absence Days Logged</span>
                </div>
                <div className="text-gray-400 font-medium text-[10px]">
                    Aggregation across all department staff.
                </div>
            </CardFooter>
        </Card>
    );
});

MonthlyLeaveChart.displayName = "MonthlyLeaveChart";

/* ── Page ── */
const EmployeeDirectory: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const isAdmin = user?.role_id === 1;
    const canEdit = isAdmin || !!user?.permissions?.['manage_employees']?.can_edit;
    const canDelete = isAdmin || !!user?.permissions?.['manage_employees']?.can_delete;
    const canInvite = isAdmin || !!user?.permissions?.['manage_invitations']?.can_edit;

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingHeatmap, setLoadingHeatmap] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<FilterKey>('all');
    const [editTarget, setEditTarget] = useState<Employee | null>(null);
    const [showInvite, setShowInvite] = useState(false);
    const [dirPage, setDirPage] = useState(1);

    useEffect(() => {
        setDirPage(1);
    }, [search, roleFilter]);

    const [leaveTrend, setLeaveTrend] = useState<{ date: string, count: number, employees: string[] }[]>([]);

    const { monthsGrouped, maxCount } = useMemo(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 179); // 180 Days (approx 26 weeks)

        const days: Date[] = [];
        let current = new Date(start);
        while (current <= end) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        const map = new Map<string, { count: number; employees: string[] }>();
        leaveTrend.forEach(d => map.set(d.date, { count: d.count, employees: d.employees || [] }));

        const max = Math.max(1, ...leaveTrend.map(d => d.count));

        // Group days by actual month key
        const daysByMonth = new Map<string, Date[]>();
        days.forEach((day: Date) => {
            const mName = day.toLocaleDateString('en-US', { month: 'short' });
            const mYear = day.getFullYear();
            const groupKey = `${mName} ${mYear}`;
            if (!daysByMonth.has(groupKey)) {
                daysByMonth.set(groupKey, []);
            }
            daysByMonth.get(groupKey)!.push(day);
        });

        const groups: {
            monthName: string;
            weeks: {
                day: Date | null;
                dateStr: string;
                count: number;
                employeesOnLeave: string[];
                isPlaceholder?: boolean;
            }[][];
        }[] = [];

        daysByMonth.forEach((monthDays: Date[], groupKey: string) => {
            const weeksList: {
                day: Date | null;
                dateStr: string;
                count: number;
                employeesOnLeave: string[];
                isPlaceholder?: boolean;
            }[][] = [];
            
            let currentWeek: {
                day: Date | null;
                dateStr: string;
                count: number;
                employeesOnLeave: string[];
                isPlaceholder?: boolean;
            }[] = Array(7).fill(null);
            
            let lastWeekday = -1;

            monthDays.forEach((day: Date) => {
                const dayOfWeek = day.getDay(); // 0 (Sun) to 6 (Sat)
                
                if (dayOfWeek <= lastWeekday) {
                    weeksList.push(currentWeek.map(cell => cell || {
                        day: null,
                        dateStr: '',
                        count: 0,
                        employeesOnLeave: [],
                        isPlaceholder: true
                    }));
                    currentWeek = Array(7).fill(null);
                }

                const dateStr = normalizeDate(day);
                const dayData = map.get(dateStr) || { count: 0, employees: [] };

                currentWeek[dayOfWeek] = {
                    day,
                    dateStr,
                    count: dayData.count,
                    employeesOnLeave: dayData.employees,
                    isPlaceholder: false
                };
                lastWeekday = dayOfWeek;
            });

            if (currentWeek.some(cell => cell !== null)) {
                weeksList.push(currentWeek.map(cell => cell || {
                    day: null,
                    dateStr: '',
                    count: 0,
                    employeesOnLeave: [],
                    isPlaceholder: true
                }));
            }

            groups.push({
                monthName: groupKey,
                weeks: weeksList
            });
        });


        return { monthsGrouped: groups, maxCount: max };
    }, [leaveTrend]);

    const chartData = useMemo(() => {
        return monthsGrouped.map((mGroup) => {
            const totalLeaves = mGroup.weeks.reduce((sum, week) => {
                const weekSum = week.reduce((dSum, day) => dSum + day.count, 0);
                return sum + weekSum;
            }, 0);

            return {
                month: mGroup.monthName,
                leaves: totalLeaves
            };
        });
    }, [monthsGrouped]);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const empRes = await getTeamMembers();
            setEmployees(empRes.data.data || []);
            setLoading(false);

            fetchHeatmap();
        } catch (err: any) {
            console.error("Failed to load employees:", err);
            setEmployees([]);
            setLoading(false);
        }
    };

    const fetchHeatmap = async () => {
        try {
            setLoadingHeatmap(true);
            const trendRes = await getLeaveTrend(6); // last 6 months (180 days)

            const trendMap = new Map<string, { count: number; employees: string[] }>();
            trendRes.data.data.forEach((row: any) => {
                const d = new Date(row.date);
                const dateStr = normalizeDate(new Date(d.getTime() - (d.getTimezoneOffset() * 60000)));

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
            console.error("Failed to load heatmap trend:", err);
        } finally {
            setLoadingHeatmap(false);
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

            {/* ── Annual Leave Heatmap & Monthly Trends Row ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2">
                    <LeaveHeatmap monthsGrouped={monthsGrouped} maxCount={maxCount} loading={loadingHeatmap} />
                </div>
                <div>
                    <MonthlyLeaveChart data={chartData} loading={loadingHeatmap} />
                </div>
            </div>

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
