import React, { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { getTeamLeaves } from "../../api/leaveApi";
import { useOutletContext } from "react-router-dom";
import PageHeader from "../common/PageHeader";
import Loader from "../common/Loader";
import { CalendarDays, Palmtree, Users, Sunrise, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useToast } from "../common/ToastContext";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { Card, CardContent } from "../ui/card";
import TeamViewModal from "../modals/TeamViewModal";

type RawLeave = {
    id: number;
    name: string;
    leave_type: string;
    from_date: string;
    to_date: string;
    duration_type: string;
    user_id: number;
    manager_id: number;
    status: string;
    reason?: string;
};

type CalendarEvent = {
    title?: string;
    start?: string;
    daysOfWeek?: number[];
    backgroundColor?: string;
    borderColor?: string;
    classNames?: string[];
    display?: string;
    textColor?: string;
    extendedProps?: RawLeave;
};

const toYMD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

const CalendarPage: React.FC = () => {
    const toast = useToast();
    const { holidays } = useOutletContext<{ holidays: any[] }>();

    const [rawLeaves, setRawLeaves] = useState<RawLeave[]>([]);
    const { user } = useSelector((state: RootState) => state.auth);
    const role = user?.role ?? "";
    const [selectedLeave, setSelectedLeave] = useState<RawLeave | null>(null);
    const [loading, setLoading] = useState(true);
    const [calTitle, setCalTitle] = useState("");
    const calRef = useRef<FullCalendar>(null);

    // Filter toggle states
    const [filterSelf, setFilterSelf] = useState(true);
    const [filterTeammates, setFilterTeammates] = useState(true);
    const [filterHolidays, setFilterHolidays] = useState(true);

    const hasTeamAccess = role === "admin" || !!user?.permissions?.['manage_employees']?.can_view;

    const holidayDates = useMemo(
        () => holidays.map((h: any) => toYMD(new Date(h.date))),
        [holidays]
    );

    useEffect(() => {
        let cancelled = false;
        const fetch = async () => {
            try {
                setLoading(true);
                const res = await getTeamLeaves();
                if (cancelled) return;
                const payload = res.data;
                const leaveData: RawLeave[] = Array.isArray(payload)
                    ? payload
                    : (payload.events ?? []);
                setRawLeaves(leaveData);
            } catch {
                if (!cancelled) toast.error("Failed to load calendar data");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetch();
        return () => { cancelled = true; };
    }, [toast]);

    const processedEvents = useMemo(() => {
        const events: CalendarEvent[] = [];

        // 1. Add Holidays if active
        if (filterHolidays) {
            holidays.forEach((h: any) => {
                events.push({
                    title: h.name,
                    start: toYMD(new Date(h.date)),
                    backgroundColor: "#fef9c3",
                    borderColor: "#eab308",
                    textColor: "#854d0e",
                    display: "block",
                    classNames: ["holiday-event", "border", "border-amber-400"],
                });
            });
        }

        // 2. Add Week Offs (Saturdays & Sundays)
        events.push({
            daysOfWeek: [0, 6], // 0 = Sunday, 6 = Saturday
            display: "background",
            backgroundColor: "#f8fafc",
            classNames: ["week-off-day"],
        });

        // 3. Add Categorized Leaves
        rawLeaves.forEach((leave) => {
            const isSelf = Number(leave.user_id) === Number(user?.id);

            if (isSelf) {
                if (!filterSelf) return;
            } else {
                if (!filterTeammates) return;
            }

            const isHalf = leave.duration_type === "half";
            let cur = new Date(leave.from_date);
            const end = new Date(leave.to_date);
            cur.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);

            while (cur <= end) {
                const dow = cur.getDay();
                const ds = toYMD(cur);
                if (dow !== 0 && dow !== 6 && !holidayDates.includes(ds)) {
                    let bg = "#6366f1";
                    let border = "#6366f1";
                    let text = "white";
                    let cls: string[] = ["border"];

                    if (isSelf) {
                        if (leave.status === "pending") {
                            bg = "#f5f3ff";
                            border = "#818cf8";
                            text = "#4f46e5";
                            cls.push("border-dashed", "border-indigo-400");
                        } else {
                            bg = "#4f46e5";
                            border = "#4f46e5";
                            text = "white";
                        }
                    } else {
                        bg = "#f97316";
                        border = "#f97316";
                        text = "white";
                    }

                    events.push({
                        title: isHalf ? `${leave.name} (Half)` : leave.name,
                        start: ds,
                        backgroundColor: bg,
                        borderColor: border,
                        textColor: text,
                        classNames: cls,
                        extendedProps: leave,
                    });
                }
                cur.setDate(cur.getDate() + 1);
            }
        });

        return events;
    }, [rawLeaves, holidays, filterSelf, filterTeammates, filterHolidays, user, holidayDates]);

    // Count states
    const selfCount = useMemo(() => new Set(rawLeaves.filter(l => Number(l.user_id) === Number(user?.id)).map(l => l.id)).size, [rawLeaves, user]);
    const teammatesCount = useMemo(() => new Set(rawLeaves.filter(l => Number(l.user_id) !== Number(user?.id)).map(l => l.id)).size, [rawLeaves, user]);
    const reportsCount = useMemo(() => new Set(rawLeaves.filter(l => Number(l.manager_id) === Number(user?.id) && Number(l.user_id) !== Number(user?.id)).map(l => l.id)).size, [rawLeaves, user]);

    const todayStr = toYMD(new Date());
    const onLeaveToday = useMemo(() => {
        return rawLeaves.filter((l) => {
            const start = toYMD(new Date(l.from_date));
            const end = toYMD(new Date(l.to_date));
            return todayStr >= start && todayStr <= end && l.status === "approved";
        });
    }, [rawLeaves, todayStr]);

    const STATS = [
        {
            label: "Your Leaves This Year",
            value: selfCount,
            unit: "scheduled leaves",
            icon: CalendarDays,
            gradient: "from-primary to-primary",
            lightBg: "bg-indigo-50",
            textColor: "text-primary",
        },
        {
            label: "Direct Reports On Leave",
            value: reportsCount,
            unit: "team members",
            icon: Users,
            gradient: "from-cyan-500 to-blue-600",
            lightBg: "bg-cyan-50",
            textColor: "text-cyan-600",
        },
        {
            label: "On Leave Today",
            value: onLeaveToday.length,
            unit: "employees total",
            icon: Sunrise,
            gradient: "from-emerald-500 to-teal-600",
            lightBg: "bg-emerald-50",
            textColor: "text-emerald-600",
        },
    ];
    if (loading) return <div className="flex justify-center items-center h-64"><Loader /></div>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-6">
            <PageHeader title="Interactive Calendar" subtitle="Track your leaves, holidays, and team status in one place" divider />

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {STATS.map((s) => {
                    const Icon = s.icon;
                    return (
                        <Card key={s.label} className="border-gray-100 overflow-hidden shadow-sm">
                            <CardContent className="p-0">
                                <div className="flex items-stretch">
                                    <div className={`bg-gradient-to-b ${s.gradient} w-1.5 flex-shrink-0`} />
                                    <div className="flex items-center gap-4 p-5 flex-1">
                                        <div className={`w-11 h-11 rounded-xl ${s.lightBg} flex items-center justify-center flex-shrink-0`}>
                                            <Icon size={20} className={s.textColor} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{s.label}</p>
                                            <p className="text-3xl font-bold text-gray-900 leading-tight">{s.value}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{s.unit}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Out Today Ribbon */}
            {onLeaveToday.length > 0 && (
                <Card className="border-indigo-100 bg-indigo-50/40">
                    <CardContent className="px-5 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-primary uppercase tracking-wider flex-shrink-0 mr-2">
                                Out today:
                            </span>
                            {onLeaveToday.map((e, i) => (
                                <div key={i} className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1 shadow-sm border border-indigo-100/50">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                                    <span className="text-xs font-medium text-gray-700">{e.name}</span>
                                    {e.duration_type === "half" && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 font-semibold">Half</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Interactive Section */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Filters sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <Card className="border-gray-100 shadow-sm">
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Calendar Layers</h4>
                        </div>
                        <CardContent className="p-4 space-y-3">
                            
                            {/* Self Toggle */}
                            <button
                                onClick={() => setFilterSelf(!filterSelf)}
                                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${filterSelf ? "bg-indigo-50/40 border-indigo-200" : "bg-white border-gray-100 opacity-60 hover:opacity-90"}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center text-white">
                                        {filterSelf && <Check size={12} strokeWidth={3} />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-800">Your Leaves</p>
                                        <p className="text-[10px] text-gray-400">Personal leaves</p>
                                    </div>
                                </div>
                                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{selfCount}</span>
                            </button>

                            {/* Teammates Toggle */}
                            <button
                                onClick={() => setFilterTeammates(!filterTeammates)}
                                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${filterTeammates ? "bg-orange-50/40 border-orange-200" : "bg-white border-gray-100 opacity-60 hover:opacity-90"}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded bg-orange-500 flex items-center justify-center text-white shrink-0">
                                        {filterTeammates && <Check size={12} strokeWidth={3} />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-800">Teammates on Leave</p>
                                        <p className="text-[10px] text-gray-400">All other employee leaves</p>
                                    </div>
                                </div>
                                <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">{teammatesCount}</span>
                            </button>

                            {/* Holidays Toggle */}
                            <button
                                onClick={() => setFilterHolidays(!filterHolidays)}
                                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${filterHolidays ? "bg-amber-50/40 border-amber-200" : "bg-white border-gray-100 opacity-60 hover:opacity-90"}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded bg-amber-500 flex items-center justify-center text-white">
                                        {filterHolidays && <Check size={12} strokeWidth={3} />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-800">Holidays</p>
                                        <p className="text-[10px] text-gray-400">Public company holidays</p>
                                    </div>
                                </div>
                                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{holidays.length}</span>
                            </button>

                        </CardContent>
                    </Card>

                    {/* Note Card */}
                    <Card className="border-gray-100 bg-gray-50/40 p-4">
                        <div className="flex gap-2.5 items-start">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 flex-shrink-0" />
                            <p className="text-[11px] text-gray-400 leading-relaxed font-semibold">
                                <span className="text-primary font-bold">Pro Tip:</span> Pending personal leave requests are highlighted with an elegant dashed purple border so you can plan ahead!
                            </p>
                        </div>
                    </Card>

                    {/* Company Calendar Illustration Card */}
                    <Card className="border-gray-100/50 bg-gradient-to-br from-indigo-50/30 to-blue-50/30 p-5 flex flex-col items-center text-center">
                        <img 
                            src="/Calendar-rafiki.svg" 
                            className="w-36 h-36 object-contain select-none opacity-95 hover:scale-105 transition-transform duration-300" 
                            alt="Calendar Illustration" 
                        />
                        <p className="text-xs font-extrabold text-slate-700 mt-2">Team Schedule</p>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed max-w-[180px]">
                            Visualize upcoming leave requests and company holidays to schedule tasks effectively.
                        </p>
                    </Card>
                </div>

                {/* Calendar Area */}
                <div className="lg:col-span-3">
                    <Card className="border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                    <CalendarDays size={15} className="text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-800 leading-none">{calTitle}</h3>
                                    {hasTeamAccess && (
                                        <p className="text-[11px] text-gray-400 mt-1 font-semibold">Click any leave block to view details</p>
                                    )}
                                </div>
                            </div>
                            
                            {/* Nav buttons */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => calRef.current?.getApi().prev()}
                                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                                >
                                    <ChevronLeft size={15} />
                                </button>
                                <button
                                    onClick={() => calRef.current?.getApi().today()}
                                    className="px-3 h-8 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                                >
                                    Today
                                </button>
                                <button
                                    onClick={() => calRef.current?.getApi().next()}
                                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                                >
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                        </div>

                        <CardContent className="p-4 pt-3 bg-white">
                            <FullCalendar
                                ref={calRef}
                                plugins={[dayGridPlugin]}
                                initialView="dayGridMonth"
                                headerToolbar={false}
                                height="auto"
                                events={processedEvents}
                                datesSet={(info) => setCalTitle(info.view.title)}
                                eventClick={hasTeamAccess ? (info) => {
                                    const leave = info.event.extendedProps as RawLeave;
                                    if (leave?.id) setSelectedLeave(leave);
                                } : undefined}
                                eventContent={(arg) => {
                                    const isHoliday = arg.event.classNames.includes("holiday-event");
                                    return (
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 w-full cursor-pointer">
                                            {isHoliday && <Palmtree size={11} className="text-amber-700" />}
                                            <span
                                                style={{ color: arg.event.textColor }}
                                                className="text-[11px] font-bold truncate"
                                              >
                                                {arg.event.title}
                                            </span>
                                        </div>
                                    );
                                }}
                                dayCellClassNames={(arg) => {
                                    const day = arg.date.getDay();
                                    return (day === 0 || day === 6) ? ["bg-slate-50/50"] : [];
                                }}
                                dayCellContent={(arg) => {
                                    const isWeekend = arg.date.getDay() === 0 || arg.date.getDay() === 6;
                                    return (
                                        <div className="flex flex-col h-full justify-between items-stretch p-1 min-h-[50px]">
                                            <div className="flex justify-end">
                                                <span className={
                                                    arg.isToday
                                                        ? "bg-indigo-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-sm"
                                                        : "text-xs text-gray-500 font-medium"
                                                }>
                                                    {arg.dayNumberText}
                                                </span>
                                            </div>
                                            {isWeekend && (
                                                <div className="text-[9px] text-gray-400 font-bold tracking-tight bg-slate-100/50 border border-slate-200/50 rounded px-1 py-0.5 text-center mt-1 select-none">
                                                    Week Off
                                                </div>
                                            )}
                                        </div>
                                    );
                                }}
                            />
                        </CardContent>
                    </Card>
                </div>

            </div>

            <TeamViewModal 
                selectedLeave={selectedLeave} 
                onClose={() => setSelectedLeave(null)} 
                hasTeamAccess={hasTeamAccess} 
            />
        </div>
    );
};

export default CalendarPage;