import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTeamMembers, getTeamBalanceSummary } from '../../api/leaveApi';
import PageHeader from '../common/PageHeader';
import Loader from '../common/Loader';
import { Search, ChevronRight, Phone, MapPin } from 'lucide-react';
import { getUserLocal } from '../../utils/getUser';
import { Card, CardContent, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "../ui/chart";

const PALETTE = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#14b8a6", "#f97316"];

const ROLE_STYLE: Record<string, { bg: string; text: string }> = {
    admin: { bg: '#fee2e2', text: '#ef4444' },
    manager: { bg: '#ede9fe', text: '#5746AF' },
    employee: { bg: '#dbeafe', text: '#3b82f6' },
};

type Employee = {
    id: number; name: string; email: string;
    role: string; department: string | null; manager_name: string | null;
    phone: string | null; location: string | null;
    gender: string | null; date_of_birth: string | null;
};
type SummaryItem = { id: number; name: string; total_allocated: number; used: number; remaining: number };
type FilterKey = 'all' | 'manager' | 'employee' | 'admin';

function avatarColor(name: string) { return PALETTE[name.charCodeAt(0) % PALETTE.length]; }

const chartConfig = {
    used: { label: "Used Days", color: "#f59e0b" },
    remaining: { label: "Remaining Days", color: "#5746AF" },
};

const EmployeeCard: React.FC<{ emp: Employee; onClick: () => void }> = ({ emp, onClick }) => {
    const roleStyle = ROLE_STYLE[emp.role] ?? ROLE_STYLE.employee;
    const color = avatarColor(emp.name);

    return (
        <div
            role="button"
            onClick={onClick}
            className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-3
                    hover:border-purple-200 hover:shadow-md cursor-pointer transition-all group"
        >
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: color }}
                >
                    {emp.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-[#5746AF] transition-colors truncate">
                        {emp.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{emp.email}</p>
                </div>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-[#5746AF] flex-shrink-0 transition-colors" />
            </div>

            <div className="flex items-center justify-between gap-2">
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
                <p className="text-[11px] text-gray-400">
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

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All Staff' },
    { key: 'manager', label: 'Managers' },
    { key: 'employee', label: 'Employees' },
    { key: 'admin', label: 'Admins' },
];

/* ── Page ── */
const EmployeeDirectory: React.FC = () => {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [summary, setSummary] = useState<SummaryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<FilterKey>('all');
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
                (e.department ?? '').toLowerCase().includes(search.toLowerCase()) ||
                (e.location ?? '').toLowerCase().includes(search.toLowerCase())
            ),
        [employees, roleFilter, search]
    );

    if (loading) return <div className="flex justify-center items-center h-48"><Loader /></div>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-4">
            <PageHeader
                title="Employee Directory"
                subtitle={user?.role === 'admin' ? 'All employees in your organisation' : 'Your team members'}
                divider
            />

            {/* ── Team Leave Overview Chart ── */}
            <Card className="overflow-hidden p-0 bg-gray-50 shadow-none">
                <div className="flex flex-col sm:flex-row items-stretch border-b border-gray-100">
                    <div className="flex-1 px-6 py-4">
                        <CardTitle className="text-sm">Team Leave Overview</CardTitle>
                        <CardDescription className="text-xs mt-0.5">Used vs remaining days per employee</CardDescription>
                    </div>
                    <div className="flex divide-x divide-gray-100 border-t sm:border-t-0 sm:border-l border-gray-100">
                        <div className="flex flex-col justify-center px-5 py-3">
                            <span className="text-[10px] text-gray-400 whitespace-nowrap">{chartConfig.used.label}</span>
                            <span className="text-xl font-bold mt-0.5" style={{ color: chartConfig.used.color }}>{totals.used}</span>
                        </div>
                        <div className="flex flex-col justify-center px-5 py-3">
                            <span className="text-[10px] text-gray-400 whitespace-nowrap">{chartConfig.remaining.label}</span>
                            <span className="text-xl font-bold mt-0.5" style={{ color: chartConfig.remaining.color }}>{totals.remaining}</span>
                        </div>
                    </div>
                </div>

                <CardContent className="px-2 pt-3 pb-3 sm:px-4">
                    {summary.length === 0 ? (
                        <div className="h-32 flex items-center justify-center text-sm text-gray-400">
                            No data available
                        </div>
                    ) : (
                        <ChartContainer config={chartConfig} className="h-32 w-full">
                            <BarChart data={summary} margin={{ left: 8, right: 8 }}>
                                <CartesianGrid vertical={false} stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={6}
                                    tick={{ fontSize: 10 }}
                                    tickFormatter={v => v.split(' ')[0]}
                                />
                                <ChartTooltip content={<ChartTooltipContent className="w-40" labelFormatter={v => String(v)} />} />
                                <ChartLegend content={<ChartLegendContent />} />
                                <Bar dataKey="used"      stackId="a" fill={chartConfig.used.color}      radius={[0, 0, 4, 4]} maxBarSize={40} />
                                <Bar dataKey="remaining" stackId="a" fill={chartConfig.remaining.color} radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ChartContainer>
                    )}
                </CardContent>
            </Card>

            {/* ── Directory ── */}
            <Card className="overflow-hidden p-0 bg-gray-50 shadow-none">
                {/* Filter tabs */}
                <div className="flex flex-col sm:flex-row items-stretch border-b border-gray-100">
                    <div className="flex-1 px-6 py-4">
                        <CardTitle className="text-sm">Directory</CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                            Click any card to view full profile
                        </CardDescription>
                    </div>
                    <div className="flex divide-x divide-gray-100 border-t sm:border-t-0 sm:border-l border-gray-100">
                        {FILTERS.filter(f => f.key === 'all' || counts[f.key] > 0).map(f => (
                            <button
                                key={f.key}
                                onClick={() => setRoleFilter(f.key)}
                                data-active={roleFilter === f.key}
                                className="flex flex-col justify-center px-5 py-3 text-left transition-colors
                                           hover:bg-gray-50 data-[active=true]:bg-purple-50/60"
                            >
                                <span className="text-[10px] text-gray-400 whitespace-nowrap">{f.label}</span>
                                <span
                                    className="text-xl font-bold mt-0.5"
                                    style={{ color: roleFilter === f.key ? '#5746AF' : '#9ca3af' }}
                                >
                                    {counts[f.key]}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search */}
                <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-4">
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

                {/* Cards grid */}
                <CardContent className="p-4">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                            <Search size={36} className="mb-3" />
                            <p className="text-sm text-gray-400">No employees match your search</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filtered.map(emp => (
                                <EmployeeCard
                                    key={emp.id}
                                    emp={emp}
                                    onClick={() => navigate(`/employees/${emp.id}`, { state: { employee: emp } })}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default EmployeeDirectory;
