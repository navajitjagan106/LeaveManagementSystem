import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import DateRangePicker from '../common/forms/DateRangePicker';
import { applyLeave, getLeaveInitData, getTeamOnLeave } from "../../api/leaveApi";
import { LeaveBalance, LeaveType } from "../../types";
import PageHeader from '../common/PageHeader';
import { useToast } from '../common/ToastContext';
import { calculateWorkingDays } from "../../utils/calculateWorkingDays";
import { getAvatarGradient } from "../../utils/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Briefcase, HeartPulse, CalendarDays, AlertTriangle, UserCircle2, Users } from "lucide-react";

const PALETTE = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#14b8a6", "#f97316"];
const LIGHT_PALETTE = ["#eef2ff", "#d1fae5", "#fef3c7", "#fee2e2", "#dbeafe", "#fce7f3", "#ccfbf1", "#ffedd5"];


const LEAVE_ICONS: Record<string, React.ReactNode> = {
    "Casual Leave": <Briefcase className="w-4 h-4" />,
    "Sick Leave": <HeartPulse className="w-4 h-4" />,
    "Earned Leave": <CalendarDays className="w-4 h-4" />,
    "Loss Of Pay": <AlertTriangle className="w-4 h-4" />,
};

const ApplyLeave: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const { holidays: rawHolidays } = useOutletContext<{ holidays: any[] }>();
    const holidays = useMemo(() => rawHolidays.map(h => h.date.slice(0, 10)), [rawHolidays]);

    const [formData, setFormData] = useState({
        leaveType: '1',
        durationType: 'full',
        fromDate: '',
        toDate: '',
        reason: '',
    });
    const [totalDays, setTotalDays] = useState(0);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [balances, setBalances] = useState<LeaveBalance[]>([]);
    const [teamOnLeave, setTeamOnLeave] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const toast = useToast();

    useEffect(() => {
        getLeaveInitData()
            .then(res => {
                setLeaveTypes(res.data.data.leaveTypes);
                setBalances(res.data.data.balances);
                if (res.data.data.leaveTypes?.[0]) {
                    setFormData(f => ({ ...f, leaveType: String(res.data.data.leaveTypes[0].id) }));
                }
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (!formData.fromDate || !formData.toDate) { setTeamOnLeave([]); return; }
        getTeamOnLeave(formData.fromDate, formData.toDate)
            .then(res => setTeamOnLeave(res.data.data || []))
            .catch(() => setTeamOnLeave([]));
    }, [formData.fromDate, formData.toDate]);

    useEffect(() => {
        if (!formData.fromDate || !formData.toDate) { setTotalDays(0); return; }
        const days = calculateWorkingDays(formData.fromDate, formData.toDate, formData.durationType, holidays);
        setTotalDays(days);
    }, [formData.fromDate, formData.toDate, formData.durationType, holidays]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fromDate || !formData.toDate || !formData.reason.trim()) {
            toast.warning('Please fill all required fields');
            return;
        }
        setSubmitting(true);
        try {
            await applyLeave({
                leave_type_id: parseInt(formData.leaveType),
                from_date: formData.fromDate,
                to_date: formData.toDate,
                reason: formData.reason,
                duration_type: formData.durationType,
            });
            toast.success('Leave applied successfully!');
            setFormData({ leaveType: String(leaveTypes[0]?.id || '1'), durationType: 'full', fromDate: '', toDate: '', reason: '' });
            setTotalDays(0);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to apply leave');
        } finally {
            setSubmitting(false);
        }
    };

    const selectedLeaveType = leaveTypes.find(t => t.id === parseInt(formData.leaveType));

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <PageHeader title="Apply Leave" subtitle="Submit a new leave request" divider />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-1">

                <form onSubmit={handleSubmit} className="lg:col-span-2 flex flex-col gap-5">

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-gray-700">Leave Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {leaveTypes.map(type => {
                                const bal = balances.find(b => b.leave_type_id === type.id);
                                const isSelected = formData.leaveType === String(type.id);
                                return (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setFormData(f => ({ ...f, leaveType: String(type.id) }))}
                                        className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${isSelected
                                            ? 'border-primary bg-primary-light/50 shadow-sm'
                                            : 'border-gray-200 bg-white hover:border-primary-light hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {LEAVE_ICONS[type.name] ?? <CalendarDays className="w-4 h-4" />}
                                        </span>
                                        <div className="min-w-0 flex-1 pt-0.5">
                                            <p className={`text-sm font-semibold leading-snug ${isSelected ? 'text-primary' : 'text-gray-800'}`}>
                                                {type.name}
                                            </p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">
                                                {type.is_unlimited ? '∞ Unlimited' : `${bal?.remaining ?? 0} / ${bal?.total_allocated ?? 0} days left`}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        {selectedLeaveType?.description && (
                            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
                                {selectedLeaveType.description}
                            </p>
                        )}
                    </div>

                    {/* Duration Type */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-gray-700">Duration</label>
                        <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50 w-fit gap-1">
                            {[{ label: 'Full Day', value: 'full' }, { label: 'Half Day', value: 'half' }].map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setFormData(f => ({ ...f, durationType: opt.value }))}
                                    className={`px-5 py-1.5 rounded-md text-sm font-medium transition-all ${formData.durationType === opt.value
                                        ? 'bg-white text-primary shadow-sm border border-gray-200'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date range */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-gray-700">Date Range</label>
                        <DateRangePicker
                            fromDate={formData.fromDate}
                            toDate={formData.toDate}
                            totalDays={totalDays}
                            onFromChange={val => setFormData(f => ({ ...f, fromDate: val }))}
                            onToChange={val => setFormData(f => ({ ...f, toDate: val }))}
                        />
                    </div>

                    {/* Reason */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-gray-700">
                            Reason <span className="text-red-400">*</span>
                        </label>
                        <Textarea
                            value={formData.reason}
                            onChange={e => setFormData(f => ({ ...f, reason: e.target.value }))}
                            placeholder="Briefly describe the reason for your leave…"
                            className="h-20 resize-none border-gray-200 focus:border-primary focus:ring-primary/20 text-sm"
                            required
                            maxLength={500}
                        />
                    </div>

                    {/* Submit */}
                    <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full h-11 bg-primary hover:bg-[#4a3a9a] text-white font-semibold text-sm mt-1"
                    >
                        {submitting ? 'Submitting…' : 'Submit Request'}
                    </Button>
                </form>

                {/* ── Right: Sidebar ── */}
                <div className="flex flex-col gap-4">

                    {/* Leave Balance */}
                    <Card className="shadow-none border-gray-100">
                        <CardHeader className="pb-3 pt-4 px-4">
                            <CardTitle className="text-sm font-semibold text-gray-700">Your Leave Balance</CardTitle>
                        </CardHeader>
                        <Separator />
                        <CardContent className="px-4 pt-3 pb-4 flex flex-col gap-3">
                            {balances.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-2">No balance data</p>
                            ) : balances.map((b, i) => {
                                const lt = leaveTypes.find(t => t.id === b.leave_type_id);
                                const pct = b.total_allocated > 0 ? Math.round((b.used / b.total_allocated) * 100) : 0;
                                const col = PALETTE[i % PALETTE.length];
                                const light = LIGHT_PALETTE[i % LIGHT_PALETTE.length];
                                const isSelected = String(b.leave_type_id) === formData.leaveType;
                                return (
                                    <div
                                        key={b.leave_type_id}
                                        onClick={() => setFormData(f => ({ ...f, leaveType: String(b.leave_type_id) }))}
                                        className={`rounded-lg p-3 cursor-pointer transition-all border ${isSelected ? 'border-primary bg-primary-light/40' : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: light, color: col }}>
                                                {lt?.name ?? `Type ${b.leave_type_id}`}
                                            </span>
                                            <span className="text-xs font-bold" style={{ color: col }}>
                                                {lt?.is_unlimited ? '∞' : b.remaining}
                                                {!lt?.is_unlimited && <span className="text-gray-400 font-normal"> / {b.total_allocated}</span>}
                                            </span>
                                        </div>
                                        {!lt?.is_unlimited && (
                                            <div className="w-full bg-gray-100 rounded-full h-1">
                                                <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: col }} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    {/* Integrated Manager & Forms-cuate Card */}
                    <Card className="shadow-none border-gray-100 bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-slate-50/10 p-4 flex items-center justify-between gap-3 overflow-hidden relative">
                        <div className="flex items-center gap-3 max-w-[65%]">
                            <div className="w-9 h-9 rounded-xl bg-[#ede9fe] flex items-center justify-center flex-shrink-0">
                                <UserCircle2 className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold">Reporting Manager</p>
                                <p className="text-sm font-bold text-slate-800 truncate">{user?.manager_name ?? 'No manager assigned'}</p>
                            </div>
                        </div>
                        <img
                            src="/Forms-cuate.svg"
                            className="w-32 h-32 object-contain select-none shrink-0 opacity-90 transform translate-x-1"
                            alt="Forms Illustration"
                        />
                    </Card>

                    {/* Team on leave */}
                    {teamOnLeave.length > 0 && (
                        <Card className="shadow-none border-orange-100 bg-orange-50/40">
                            <CardContent className="px-4 py-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Users className="w-4 h-4 text-orange-500" />
                                    <p className="text-xs font-semibold text-orange-600">
                                        {teamOnLeave.length} teammate{teamOnLeave.length > 1 ? 's' : ''} also on leave
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {teamOnLeave.map((person, i) => (
                                        <div
                                            key={i}
                                            title={person.name}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-tr ${getAvatarGradient(person.user_id || person.name)}`}
                                        >
                                            {person.name.charAt(0).toUpperCase()}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {teamOnLeave.map((person, i) => (
                                        <span key={i} className="text-xs text-orange-700">{person.name}{i < teamOnLeave.length - 1 ? ',' : ''}</span>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApplyLeave;
