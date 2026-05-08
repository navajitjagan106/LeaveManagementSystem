import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getTeamMemberBalance, getTeamMemberMonthly, getTeamMembers } from '../../api/leaveApi';
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
    ChartContainer, ChartTooltip, ChartTooltipContent,
    ChartLegend, ChartLegendContent,
} from "../ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '../ui/breadcrumb';
import Loader from '../common/Loader';
import { Building2, Mail, Shield, Users, BookOpen, Phone, MapPin, UserRound, CalendarDays } from 'lucide-react';

const PALETTE       = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#14b8a6", "#f97316"];
const LIGHT_PALETTE = ["#eef2ff", "#d1fae5", "#fef3c7", "#fee2e2", "#dbeafe", "#fce7f3", "#ccfbf1", "#ffedd5"];

const ROLE_STYLE: Record<string, { bg: string; text: string }> = {
    admin:    { bg: '#fee2e2', text: '#ef4444' },
    manager:  { bg: '#ede9fe', text: '#5746AF' },
    employee: { bg: '#dbeafe', text: '#3b82f6' },
};

function avatarColor(name: string) { return PALETTE[name.charCodeAt(0) % PALETTE.length]; }

function calcAge(dob: string | null | undefined): string {
    if (!dob) return "";
    const diff = Date.now() - new Date(dob).getTime();
    return `(${Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))} yrs)`;
}

function getLast12Months() {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
        return d.toLocaleDateString('en', { month: 'short' });
    });
}

type BalanceItem = {
    leave_type_id: number; type: string;
    total_allocated: number; used: number; remaining: number;
};
type EmployeeData = {
    id: number; name: string; email: string; role: string;
    department: string | null; manager_name: string | null; policy_name?: string;
    phone?: string | null; gender?: string | null;
    date_of_birth?: string | null; location?: string | null;
};

const balanceChartConfig = {
    used:      { label: "Used",      color: "#f59e0b" },
    remaining: { label: "Remaining", color: "#5746AF" },
};
const monthlyChartConfig = {
    days: { label: "Days Taken", color: "#5746AF" },
};

const EmployeeProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const stateEmployee = (location.state as { employee?: EmployeeData } | null)?.employee;
    const [employee, setEmployee] = useState<EmployeeData | null>(stateEmployee ?? null);
    const [balance, setBalance]   = useState<BalanceItem[]>([]);
    const [monthlyData, setMonthlyData] = useState<{ month: string; days: number }[]>([]);
    const [loading, setLoading]   = useState(true);

    useEffect(() => {
        if (!id) return;
        const numId = Number(id);
        const calls: Promise<any>[] = [
            getTeamMemberBalance(numId),
            getTeamMemberMonthly(numId),
            ...(!stateEmployee ? [getTeamMembers()] : []),
        ];
        Promise.all(calls)
            .then(([balanceRes, monthlyRes, membersRes]) => {
                setBalance(balanceRes.data.data || []);
                const months = getLast12Months();
                const dataMap = new Map<string, number>();
                (monthlyRes.data.data || []).forEach((d: { month: string; days: string }) => {
                    dataMap.set(d.month, Number(d.days));
                });
                setMonthlyData(months.map(m => ({ month: m, days: dataMap.get(m) ?? 0 })));
                if (membersRes) {
                    const emp = (membersRes.data.data || []).find((e: EmployeeData) => e.id === numId);
                    if (emp) setEmployee(emp);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    if (loading) return <div className="flex justify-center items-center h-full"><Loader /></div>;
    if (!employee) return <div className="text-center py-16 text-gray-400">Employee not found</div>;

    const roleStyle        = ROLE_STYLE[employee.role] ?? ROLE_STYLE.employee;
    const color            = avatarColor(employee.name);
    const balanceChartData = balance.map(b => ({ name: b.type, used: b.used, remaining: b.remaining }));
    const hasMonthly       = monthlyData.some(d => d.days > 0);

    const profileDetails = [
        { icon: Mail,      label: "Email",        value: employee.email,                         cls: "break-all" },
        { icon: Shield,    label: "Role",          value: employee.role,                          cls: "capitalize" },
        { icon: Building2, label: "Department",    value: employee.department || "—",             cls: "" },
        { icon: Users,     label: "Reports To",    value: employee.manager_name || "—",           cls: "" },
        ...(employee.policy_name ? [{ icon: BookOpen,     label: "Leave Policy", value: employee.policy_name, cls: "" }] : []),
        ...(employee.phone        ? [{ icon: Phone,        label: "Phone",        value: employee.phone,       cls: "" }] : []),
        ...(employee.gender       ? [{ icon: UserRound,     label: "Gender",       value: employee.gender,      cls: "" }] : []),
        ...(employee.date_of_birth ? [{
            icon: CalendarDays,
            label: "Date of Birth",
            value: new Date(employee.date_of_birth).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                + " " + calcAge(employee.date_of_birth),
            cls: "",
        }] : []),
        ...(employee.location     ? [{ icon: MapPin,       label: "Location",     value: employee.location,    cls: "" }] : []),
    ];

    return (
        <div className="flex flex-col gap-3 h-full min-h-0">

            {/* Breadcrumb */}
            <Breadcrumb className="flex-shrink-0">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <button onClick={() => navigate('/employees')} className="text-gray-400 hover:text-primary text-sm transition-colors">
                                Employees
                            </button>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage className="text-sm font-medium text-gray-700">{employee.name}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Main two-column layout — fills remaining height */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">

                {/* ── LEFT: Employee profile card ── */}
                <Card className="flex flex-col overflow-hidden shadow-sm border-gray-100">
                    {/* Gradient header */}
                    <div
                        className="flex flex-col items-center text-center px-6 py-8 flex-shrink-0"
                        style={{ background: "linear-gradient(160deg, #5746AF 0%, #302178 100%)" }}
                    >
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white/20 mb-3"
                            style={{ background: color }}
                        >
                            {employee.name.charAt(0).toUpperCase()}
                        </div>
                        <h1 className="text-white font-bold text-lg leading-tight">{employee.name}</h1>
                        <p className="text-primary-light text-xs mt-1 break-all">{employee.email}</p>
                        <span
                            className="mt-3 text-xs font-semibold px-3 py-1 rounded-full capitalize"
                            style={{ background: roleStyle.bg, color: roleStyle.text }}
                        >
                            {employee.role}
                        </span>
                    </div>

                    {/* Detail rows — scrollable so nothing gets clipped */}
                    <CardContent className="flex-1 min-h-0 p-5 overflow-y-auto">
                        <div className="flex flex-col gap-4">
                            {profileDetails.map(({ icon: Icon, label, value, cls }) => (
                                <div key={label} className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
                                        <Icon size={13} className="text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
                                        <p className={`text-sm text-gray-800 font-medium mt-0.5 break-words ${cls ?? ''}`}>{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* ── RIGHT: balance cards + charts, all filling height ── */}
                <div className="flex flex-col gap-3 min-h-0">

                    {/* Leave balance mini-cards — fixed natural height */}
                    {balance.length > 0 && (
                        <div className="flex-shrink-0">
                            <p className="text-sm font-semibold text-gray-700 mb-2">Leave Balance</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                                {balance.map((item, i) => {
                                    const pct   = item.total_allocated > 0 ? Math.round((item.used / item.total_allocated) * 100) : 0;
                                    const col   = PALETTE[i % PALETTE.length];
                                    const light = LIGHT_PALETTE[i % LIGHT_PALETTE.length];
                                    return (
                                        <div
                                            key={item.leave_type_id}
                                            className="bg-white border border-gray-100 rounded-xl p-3"
                                            style={{ borderTop: `3px solid ${col}` }}
                                        >
                                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: light, color: col }}>
                                                {item.type}
                                            </span>
                                            <div className="mt-2 flex items-baseline gap-1">
                                                <span className="text-2xl font-bold" style={{ color: col }}>{item.remaining}</span>
                                                <span className="text-xs text-gray-400">/ {item.total_allocated}</span>
                                            </div>
                                            <p className="text-[11px] text-gray-400 mb-2">days remaining</p>
                                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: col }} />
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1">{item.used} used · {pct}%</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Charts — flex-1 so they fill the remaining height */}
                    <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-2 gap-3">

                        {/* Balance breakdown */}
                        {balance.length > 0 && (
                            <Card className="shadow-none border border-gray-100 flex flex-col min-h-0">
                                <CardHeader className="pb-1 pt-4 px-5 flex-shrink-0">
                                    <CardTitle className="text-sm">Balance Breakdown</CardTitle>
                                    <CardDescription className="text-xs">Used vs Remaining by leave type</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 min-h-0 px-2 pb-4">
                                    <ChartContainer config={balanceChartConfig} className="h-full w-full">
                                        <BarChart data={balanceChartData} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
                                            <CartesianGrid vertical={false} stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey="name"
                                                tickLine={false} axisLine={false}
                                                tick={{ fontSize: 10 }}
                                                tickFormatter={v => v.split(' ')[0]}
                                            />
                                            <ChartTooltip content={<ChartTooltipContent className="w-40" />} />
                                            <ChartLegend content={<ChartLegendContent />} />
                                            <Bar dataKey="used"      fill={balanceChartConfig.used.color}      radius={[3,3,0,0]} maxBarSize={32} />
                                            <Bar dataKey="remaining" fill={balanceChartConfig.remaining.color} radius={[3,3,0,0]} maxBarSize={32} />
                                        </BarChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>
                        )}

                        {/* Monthly leave taken */}
                        <Card className="shadow-none border border-gray-100 flex flex-col min-h-0">
                            <CardHeader className="pb-1 pt-4 px-5 flex-shrink-0">
                                <CardTitle className="text-sm">Monthly Leave Taken</CardTitle>
                                <CardDescription className="text-xs">Approved leave days — last 12 months</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 min-h-0 px-2 pb-4">
                                <div className="relative h-full w-full">
                                    <ChartContainer config={monthlyChartConfig} className="h-full w-full">
                                        <BarChart 
                                            data={hasMonthly ? monthlyData : monthlyData.map(d => ({ ...d, days: 0.15 }))} 
                                            margin={{ left: 0, right: 8, top: 4, bottom: 4 }}
                                        >
                                            <CartesianGrid vertical={false} stroke="#f0f0f0" />
                                            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                                            {hasMonthly && <ChartTooltip content={<ChartTooltipContent className="w-36" />} />}
                                            <Bar 
                                                dataKey="days" 
                                                fill={hasMonthly ? monthlyChartConfig.days.color : "#E2E8F0"} 
                                                radius={[3,3,0,0]} 
                                                maxBarSize={28} 
                                            />
                                        </BarChart>
                                    </ChartContainer>
                                    {!hasMonthly && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="bg-white/80 border border-gray-100 px-3 py-2 rounded-xl shadow-md backdrop-blur-sm text-center">
                                                <p className="text-xs font-bold text-gray-500">No Approved Leaves</p>
                                                <p className="text-[10px] text-gray-400">Past 12 months</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeProfile;
