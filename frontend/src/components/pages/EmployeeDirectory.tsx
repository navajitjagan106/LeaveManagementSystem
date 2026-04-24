import React, { useEffect, useMemo, useState } from 'react';
import { getTeamMembers, getTeamMemberBalance, getTeamBalanceSummary } from '../../api/leaveApi';
import PageHeader from '../common/PageHeader';
import Loader from '../common/Loader';
import { Search, ChevronRight } from 'lucide-react';
import { getUserLocal } from '../../utils/getUser';
import { Card, CardContent, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Dialog, DialogTrigger, DialogContent } from '../ui/dialog';
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";

const PALETTE = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#14b8a6", "#f97316"];
const LIGHT_PALETTE = ["#eef2ff", "#d1fae5", "#fef3c7", "#fee2e2", "#dbeafe", "#fce7f3", "#ccfbf1", "#ffedd5"];

const ROLE_STYLE: Record<string, { bg: string; text: string }> = {
    admin: { bg: '#fee2e2', text: '#ef4444' },
    manager: { bg: '#ede9fe', text: '#5746AF' },
    employee: { bg: '#dbeafe', text: '#3b82f6' },
};

type Employee = {
    id: number; name: string; email: string;
    role: string; department: string | null; manager_name: string | null;
};
type BalanceItem = { leave_type_id: number; type: string; total_allocated: number; used: number; remaining: number };
type SummaryItem = { id: number; name: string; total_allocated: number; used: number; remaining: number };
type FilterKey = 'all' | 'manager' | 'employee' | 'admin';
type MetricKey = 'used' | 'remaining';

function avatarColor(name: string) { return PALETTE[name.charCodeAt(0) % PALETTE.length]; }

const chartConfig = {
    used: { label: "Used Days", color: "#f59e0b" },
    remaining: { label: "Remaining Days", color: "#5746AF" },
};

/*  Balance modal body  */
const EmployeeBalanceContent: React.FC<{ employee: Employee }> = ({ employee }) => {
    const [balance, setBalance] = useState<BalanceItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getTeamMemberBalance(employee.id)
            .then(res => setBalance(res.data.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [employee.id]);

    const roleStyle = ROLE_STYLE[employee.role] ?? ROLE_STYLE.employee;
    const color = avatarColor(employee.name);

    return (
        <>
            <div className="bg-gradient-to-r from-[#5746AF] to-[#302178] px-6 py-5 flex items-center gap-4">
                <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                    style={{ background: color }}
                >
                    {employee.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <h2 className="text-white font-semibold text-base truncate">{employee.name}</h2>
                    <p className="text-purple-200 text-xs mt-0.5 truncate">{employee.email}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
                            style={{ background: roleStyle.bg, color: roleStyle.text }}>
                            {employee.role}
                        </span>
                        {employee.department && <span className="text-purple-300 text-xs">{employee.department}</span>}
                    </div>
                </div>
            </div>

            <div className="p-6">
                <p className="text-sm font-semibold text-gray-800 mb-4">Leave Balance</p>
                {loading ? (
                    <div className="flex justify-center py-8"><Loader /></div>
                ) : balance.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No leave balance found</p>
                ) : (
                    <div className="space-y-5">
                        {balance.map((item, i) => {
                            const pct = item.total_allocated > 0 ? (item.used / item.total_allocated) * 100 : 0;
                            const col = PALETTE[i % PALETTE.length];
                            const light = LIGHT_PALETTE[i % LIGHT_PALETTE.length];
                            return (
                                <div key={item.leave_type_id}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                            style={{ background: light, color: col }}>
                                            {item.type}
                                        </span>
                                        <div className="text-right">
                                            <span className="text-sm font-bold" style={{ color: col }}>{item.remaining}</span>
                                            <span className="text-xs text-gray-400"> / {item.total_allocated} remaining</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                        <div className="h-1.5 rounded-full transition-all duration-500"
                                            style={{ width: `${pct}%`, background: col }} />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">{item.used} used · {item.total_allocated} total</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
};

/*  Table row  */
const EmployeeRow: React.FC<{ emp: Employee }> = ({ emp }) => {
    const roleStyle = ROLE_STYLE[emp.role] ?? ROLE_STYLE.employee;
    const color = avatarColor(emp.name);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <div
                    role="button"
                    className="grid items-center gap-4 px-6 py-3.5 border-b border-gray-50
                            hover:bg-purple-50/30 cursor-pointer transition-colors group last:border-b-0"
                    style={{ gridTemplateColumns: '40px 1fr 110px 1fr 1fr 28px' }}
                >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ background: color }}>
                        {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 group-hover:text-purple-700 transition-colors truncate">{emp.name}</p>
                        <p className="text-xs text-gray-400 truncate">{emp.email}</p>
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize w-fit"
                        style={{ background: roleStyle.bg, color: roleStyle.text }}>
                        {emp.role}
                    </span>
                    <span className="text-xs text-gray-500 truncate">{emp.department || <span className="text-gray-300">—</span>}</span>
                    <span className="text-xs text-gray-400 truncate">{emp.manager_name || <span className="text-gray-300">—</span>}</span>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-md p-0 overflow-hidden">
                <EmployeeBalanceContent employee={emp} />
            </DialogContent>
        </Dialog>
    );
};

/* ── Filters  */
const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All Staff' },
    { key: 'manager', label: 'Managers' },
    { key: 'employee', label: 'Employees' },
    { key: 'admin', label: 'Admins' },
];

/* ── Page  */
const EmployeeDirectory: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [summary, setSummary] = useState<SummaryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<FilterKey>('all');
    const [activeMetric, setActiveMetric] = useState<MetricKey>('used');
    const user = getUserLocal();

    useEffect(() => {
        Promise.all([
            getTeamMembers().then(r => setEmployees(r.data.data || [])),
            getTeamBalanceSummary().then(r => setSummary(r.data.data || [])),
        ])
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const counts = useMemo(() => ({
        all: employees.length,
        manager: employees.filter(e => e.role === 'manager').length,
        employee: employees.filter(e => e.role === 'employee').length,
        admin: employees.filter(e => e.role === 'admin').length,
    }), [employees]);

    const totals = useMemo(() => ({
        used: summary.reduce((s, e) => s + e.used, 0),
        remaining: summary.reduce((s, e) => s + e.remaining, 0),
    }), [summary]);

    const filtered = useMemo(() =>
        employees
            .filter(e => roleFilter === 'all' || e.role === roleFilter)
            .filter(e =>
                e.name.toLowerCase().includes(search.toLowerCase()) ||
                e.email.toLowerCase().includes(search.toLowerCase()) ||
                (e.department ?? '').toLowerCase().includes(search.toLowerCase())
            ),
        [employees, roleFilter, search]
    );

    if (loading) return <div className="flex justify-center items-center h-48"><Loader /></div>;

    return (
        <div className="flex flex-col gap-5 pb-6">
            <PageHeader
                title="Employee Directory"
                subtitle={user?.role === 'admin' ? 'All employees in your organisation' : 'Your team members'}
            />

            <Card className="overflow-hidden p-0">
                {/* Stat-tab header */}
                <div className="flex flex-col sm:flex-row items-stretch border-b border-gray-100">
                    <div className="flex-1 px-6 py-5">
                        <CardTitle className="text-base">Team Leave Overview</CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                            Leave usage across your team — click a metric to switch the chart
                        </CardDescription>
                    </div>
                    <div className="flex divide-x divide-gray-100 border-t sm:border-t-0 sm:border-l border-gray-100">
                        {(["used", "remaining"] as MetricKey[]).map(metric => (
                            <button
                                key={metric}
                                onClick={() => setActiveMetric(metric)}
                                data-active={activeMetric === metric}
                                className="flex flex-col justify-center px-6 py-4 text-left transition-colors
                                        hover:bg-gray-50 data-[active=true]:bg-amber-50/60"
                                style={activeMetric === metric && metric === 'remaining'
                                    ? { backgroundColor: '#ede9fe60' } : undefined}
                            >
                                <span className="text-[11px] text-gray-400 whitespace-nowrap capitalize">
                                    {chartConfig[metric].label}
                                </span>
                                <span
                                    className="text-2xl font-bold mt-0.5 transition-colors"
                                    style={{ color: activeMetric === metric ? chartConfig[metric].color : '#9ca3af' }}
                                >
                                    {totals[metric]}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bar chart */}
                <CardContent className="px-2 pt-4 sm:px-6 pb-4">
                    {summary.length === 0 ? (
                        <div className="h-52 flex items-center justify-center text-sm text-gray-400">
                            No data available
                        </div>
                    ) : (
                        <ChartContainer config={chartConfig} className="h-52 w-full">
                            <BarChart data={summary} margin={{ left: 12, right: 12 }}>
                                <CartesianGrid vertical={false} stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tick={{ fontSize: 11 }}
                                    tickFormatter={v => v.split(' ')[0]}
                                />
                                <ChartTooltip
                                    content={
                                        <ChartTooltipContent
                                            className="w-40"
                                            nameKey={activeMetric}
                                            labelFormatter={v => String(v)}
                                        />
                                    }
                                />
                                <Bar
                                    dataKey={activeMetric}
                                    fill={chartConfig[activeMetric].color}
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={48}
                                />
                            </BarChart>
                        </ChartContainer>
                    )}
                </CardContent>
            </Card>

            {/* ── Directory table ── */}
            <Card className="overflow-hidden p-0">
                {/* Stat-filter tabs */}
                <div className="flex flex-col sm:flex-row items-stretch border-b border-gray-100">
                    <div className="flex-1 px-6 py-5">
                        <CardTitle className="text-base">Directory</CardTitle>
                        <CardDescription className="text-xs mt-0.5">Click any row to view leave balance</CardDescription>
                    </div>
                    <div className="flex divide-x divide-gray-100 border-t sm:border-t-0 sm:border-l border-gray-100">
                        {FILTERS.filter(f => f.key === 'all' || counts[f.key] > 0).map(f => (
                            <button
                                key={f.key}
                                onClick={() => setRoleFilter(f.key)}
                                data-active={roleFilter === f.key}
                                className="flex flex-col justify-center px-5 py-4 text-left transition-colors
                                           hover:bg-gray-50 data-[active=true]:bg-purple-50/60"
                            >
                                <span className="text-[11px] text-gray-400 whitespace-nowrap">{f.label}</span>
                                <span
                                    className="text-2xl font-bold mt-0.5"
                                    style={{ color: roleFilter === f.key ? '#5746AF' : '#9ca3af' }}
                                >
                                    {counts[f.key]}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search */}
                <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between gap-4">
                    <div className="relative w-72">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <Input
                            placeholder="Search name, email or department…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-8 h-8 text-xs rounded-lg"
                        />
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                        {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Column headers */}
                <div
                    className="grid gap-4 px-6 py-2.5 bg-gray-50/60 border-b border-gray-100"
                    style={{ gridTemplateColumns: '40px 1fr 110px 1fr 1fr 28px' }}
                >
                    {['', 'Name', 'Role', 'Department', 'Reports to', ''].map((col, i) => (
                        <span key={i} className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{col}</span>
                    ))}
                </div>

                {/* Rows */}
                <CardContent className="p-0">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                            <Search size={36} className="mb-3" />
                            <p className="text-sm text-gray-400">No employees match your search</p>
                        </div>
                    ) : (
                        filtered.map(emp => <EmployeeRow key={emp.id} emp={emp} />)
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default EmployeeDirectory;
