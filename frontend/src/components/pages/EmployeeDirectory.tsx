import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTeamMembers } from '../../api/leaveApi';
import { getEmployees } from '../../api/adminApi';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import PageHeader from '../common/PageHeader';
import Loader from '../common/Loader';
import { Search, ChevronRight, Phone, MapPin, MoreHorizontal, Users, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { 
    Bar, 
    BarChart, 
    XAxis, 
    YAxis,
    Pie,
    PieChart,
    Cell
} from "recharts";
import { 
    ChartContainer, 
    ChartTooltip, 
    ChartTooltipContent, 
} from "../ui/chart";
import EmployeeDetailsModal from '../admin/modal/EmployeeDetailModal';
import InviteEmployeeModal from '../admin/modal/InviteEmployeeModal';

const PALETTE = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#14b8a6", "#f97316"];
const ROLE_STYLE: Record<string, { bg: string; text: string }> = {
    admin:    { bg: '#fee2e2', text: '#ef4444' },
    manager:  { bg: '#ede9fe', text: '#5746AF' },
    employee: { bg: '#dbeafe', text: '#3b82f6' },
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
type FilterKey = 'all' | 'manager' | 'employee' | 'admin';

const avatarColor = (name: string) => PALETTE[name.charCodeAt(0) % PALETTE.length];

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all',      label: 'All Staff'  },
    { key: 'manager',  label: 'Managers'   },
    { key: 'employee', label: 'Employees'  },
    { key: 'admin',    label: 'Admins'     },
];

/* ── Employee card ── */
const EmployeeCard: React.FC<{
    emp: Employee;
    onClick: () => void;
    onEdit?: () => void;
}> = ({ emp, onClick, onEdit }) => {
    const roleStyle = ROLE_STYLE[emp.role] ?? ROLE_STYLE.employee;
    const color = avatarColor(emp.name);

    return (
        <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-3 hover:border-purple-200 hover:shadow-md transition-all group">
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
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-[#5746AF] transition-colors truncate">
                        {emp.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{emp.email}</p>
                </div>
                {onEdit ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="text-gray-300 hover:text-purple-600 hover:bg-purple-50 p-1.5 rounded-lg transition flex-shrink-0"
                        title="Edit employee"
                    >
                        <MoreHorizontal size={16} />
                    </button>
                ) : (
                    <ChevronRight
                        size={14}
                        onClick={onClick}
                        className="text-gray-300 group-hover:text-[#5746AF] flex-shrink-0 transition-colors cursor-pointer"
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
    const canEdit = isAdmin;
    const canDelete = isAdmin;

    const [employees, setEmployees]     = useState<Employee[]>([]);
    const [loading, setLoading]         = useState(true);
    const [search, setSearch]           = useState('');
    const [roleFilter, setRoleFilter]   = useState<FilterKey>('all');
    const [editTarget, setEditTarget]   = useState<Employee | null>(null);
    const [showInvite, setShowInvite]   = useState(false);

    const fetchEmployees = async () => {
        try {
            if (isAdmin) {
                const res = await getEmployees();
                setEmployees(res.data.data || []);
            } else {
                const res = await getTeamMembers();
                setEmployees(res.data.data || []);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const counts = useMemo(() => ({
        all:      employees.length,
        manager:  employees.filter(e => e.role === 'manager').length,
        employee: employees.filter(e => e.role === 'employee').length,
        admin:    employees.filter(e => e.role === 'admin').length,
    }), [employees]);

    // Compute Organizational Metrics
    const departmentStats = useMemo(() => {
        const map: Record<string, number> = {};
        employees.forEach(e => {
            const d = e.department || "Other";
            map[d] = (map[d] || 0) + 1;
        });
        return Object.entries(map).map(([name, count], i) => ({
            name,
            count,
            fill: PALETTE[i % PALETTE.length]
        })).sort((a, b) => b.count - a.count);
    }, [employees]);

    const roleStats = useMemo(() => {
        return [
            { role: "Managers", count: counts.manager, fill: "#ede9fe" },
            { role: "Employees", count: counts.employee, fill: "#dbeafe" },
            { role: "Admins", count: counts.admin, fill: "#fee2e2" },
        ].filter(r => r.count > 0);
    }, [counts]);

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
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <PageHeader
                    title="Employee Directory"
                    subtitle={isAdmin ? 'Overview of your organizational structure' : 'Your team members'}
                    divider={false}
                />
                {isAdmin && (
                    <Button
                        onClick={() => setShowInvite(true)}
                        variant="outline"
                        size="sm"
                        className="border-purple-300 text-purple-700 hover:bg-purple-50 shrink-0 mt-1"
                    >
                        + Invite Employee
                    </Button>
                )}
            </div>
            <div className="border-t border-gray-100" />

            {/* ── Organizational Overview ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Department Distribution */}
                <Card className="shadow-none border-gray-100 bg-gray-50/50">
                    <CardHeader className="pb-0">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Users size={16} className="text-purple-500" />
                            Department Split
                        </CardTitle>
                        <CardDescription className="text-[10px]">Headcount distribution across departments</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row items-center justify-around py-4">
                        <ChartContainer config={{}} className="aspect-square max-h-[160px]">
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                <Pie
                                    data={departmentStats}
                                    dataKey="count"
                                    nameKey="name"
                                    innerRadius={50}
                                    outerRadius={70}
                                    strokeWidth={5}
                                >
                                    {departmentStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                        <div className="flex flex-col gap-2 min-w-[140px]">
                            {departmentStats.slice(0, 4).map((d) => (
                                <div key={d.name} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                                        <span className="text-gray-500 font-medium">{d.name}</span>
                                    </div>
                                    <span className="font-bold text-gray-900">{d.count}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Role Breakdown */}
                <Card className="shadow-none border-gray-100 bg-gray-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Briefcase size={16} className="text-purple-500" />
                            Role Composition
                        </CardTitle>
                        <CardDescription className="text-[10px]">Staff split by administrative levels</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[160px]">
                         <ChartContainer config={{}} className="h-full w-full">
                            <BarChart
                                data={roleStats}
                                layout="vertical"
                                margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
                            >
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="role" 
                                    type="category" 
                                    tickLine={false} 
                                    axisLine={false}
                                    tick={{ fontSize: 11, fontWeight: 500, fill: '#6b7280' }}
                                />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                <Bar 
                                    dataKey="count" 
                                    radius={[0, 4, 4, 0]} 
                                    barSize={24}
                                >
                                    {roleStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} stroke={ROLE_STYLE[entry.role.toLowerCase().slice(0,-1)]?.text || '#ccc'} strokeWidth={1} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
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
                        {FILTERS.filter(f => f.key === 'all' || counts[f.key] > 0).map(f => (
                            <button
                                key={f.key}
                                onClick={() => setRoleFilter(f.key)}
                                data-active={roleFilter === f.key}
                                className="flex flex-col justify-center px-5 py-3 text-left transition-colors hover:bg-gray-50 data-[active=true]:bg-purple-50/60"
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
                                    onEdit={canEdit ? () => setEditTarget(emp) : undefined}
                                />
                            ))}
                        </div>
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
