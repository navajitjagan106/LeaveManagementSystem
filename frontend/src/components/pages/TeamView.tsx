import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import { getTeamLeaves } from "../../api/leaveApi"
import { useOutletContext } from "react-router-dom"
import PageHeader from "../common/PageHeader"
import Loader from "../common/Loader"
import { CalendarDays, Palmtree, Users, CalendarX2, Sunrise, PartyPopper, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "../common/ToastContext"
import { getCookie } from "../../utils/cookies"
import { Card, CardContent } from "../ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../ui/sheet"

type RawLeave = {
    id: number
    name: string
    leave_type: string
    from_date: string
    to_date: string
    duration_type: string
    reason?: string
}

type CalendarEvent = {
    title: string
    start: string
    backgroundColor?: string
    borderColor?: string
    classNames?: string[]
    display?: string
    textColor?: string
    extendedProps?: RawLeave
}

const AVATAR_COLORS = [
    { bg: "#ede9fe", text: "#5746AF" },
    { bg: "#dbeafe", text: "#2563eb" },
    { bg: "#d1fae5", text: "#059669" },
    { bg: "#fef3c7", text: "#d97706" },
    { bg: "#fce7f3", text: "#db2777" },
    { bg: "#e0f2fe", text: "#0284c7" },
]

const toYMD = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
}

const toDisplay = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

const DRAWER_FIELDS: { label: string; render: (l: RawLeave) => string }[] = [
    { label: "Leave Type", render: (l) => l.leave_type },
    { label: "Duration", render: (l) => l.duration_type === "half" ? "Half Day" : "Full Day" },
    { label: "From", render: (l) => toDisplay(l.from_date) },
    { label: "To", render: (l) => toDisplay(l.to_date) },
]


const LEGEND = [
    { label: "Full Day Leave", color: "#6366f1" },
    { label: "Half Day Leave", color: "#a5b4fc" },
    { label: "Holiday", color: "#f59e0b" },
]

const TeamView: React.FC = () => {
    const toast = useToast()
    const { holidays } = useOutletContext<{ holidays: any[] }>()

    const [calEvents, setCalEvents] = useState<CalendarEvent[]>([])
    const [role, setRole] = useState<string>(() => {
        const user = JSON.parse(getCookie("user") || "null")
        return user?.role ?? ""
    })
    const [selectedLeave, setSelectedLeave] = useState<RawLeave | null>(null)
    const [loading, setLoading] = useState(true)
    const [calTitle, setCalTitle] = useState("")
    const calRef = useRef<FullCalendar>(null)

    const isManagerOrAdmin = role === "manager" || role === "admin"

    const holidayDates = useMemo(
        () => holidays.map((h: any) => toYMD(new Date(h.date))),
        [holidays]
    )

    const expandLeaves = useCallback(
        (data: RawLeave[]): CalendarEvent[] => {
            const events: CalendarEvent[] = []
            data.forEach((leave) => {
                const isHalf = leave.duration_type === "half"
                let cur = new Date(leave.from_date)
                const end = new Date(leave.to_date)
                cur.setHours(0, 0, 0, 0)
                end.setHours(0, 0, 0, 0)
                while (cur <= end) {
                    const dow = cur.getDay()
                    const ds = toYMD(cur)
                    if (dow !== 0 && dow !== 6 && !holidayDates.includes(ds)) {
                        events.push({
                            title: isHalf ? `${leave.name} (Half)` : leave.name,
                            start: ds,
                            backgroundColor: isHalf ? "#a5b4fc" : "#6366f1",
                            borderColor: isHalf ? "#a5b4fc" : "#6366f1",
                            extendedProps: leave,
                        })
                    }
                    cur.setDate(cur.getDate() + 1)
                }
            })
            return events
        },
        [holidayDates]
    )

    useEffect(() => {
        if (!holidays.length) return
        let cancelled = false

        const fetch = async () => {
            try {
                setLoading(true)
                const res = await getTeamLeaves()
                if (cancelled) return

                const payload = res.data
                const leaveData: RawLeave[] = Array.isArray(payload)
                    ? payload
                    : (payload.events ?? [])
                const serverRole: string = Array.isArray(payload) ? "" : (payload.role ?? "")

                if (serverRole) setRole(serverRole)

                const leaveEvents = expandLeaves(leaveData)
                const holidayEvents: CalendarEvent[] = holidays.map((h: any) => ({
                    title: h.name,
                    start: toYMD(new Date(h.date)),
                    backgroundColor: "#fef3c7",
                    borderColor: "#f59e0b",
                    textColor: "#92400e",
                    display: "block",
                    classNames: ["holiday-event"],
                }))
                setCalEvents([...leaveEvents, ...holidayEvents])
            } catch {
                if (!cancelled) toast.error("Failed to load team calendar")
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        fetch()
        return () => { cancelled = true }
    }, [holidays, expandLeaves]) // eslint-disable-line react-hooks/exhaustive-deps

    const today = new Date()
    const todayStr = toYMD(today)
    const thisMonth = today.getMonth()
    const thisYear = today.getFullYear()

    const leaveCalEvents = calEvents.filter((e) => !e.classNames?.includes("holiday-event"))

    const employeesThisMonth = useMemo(
        () => new Set(
            leaveCalEvents
                .filter((e) => {
                    const d = new Date(e.start)
                    return d.getMonth() === thisMonth && d.getFullYear() === thisYear
                })
                .map((e) => e.title)
        ).size,
        [leaveCalEvents, thisMonth, thisYear]
    )

    const onLeaveToday = leaveCalEvents.filter((e) => e.start === todayStr)
    const holidaysThisMonth = holidays.filter((h: any) => {
        const d = new Date(h.date)
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear
    }).length

    const STATS = [
        {
            label: "Holidays This Month",
            value: holidaysThisMonth,
            unit: "public holidays",
            icon: PartyPopper,
            gradient: "from-violet-500 to-purple-600",
            lightBg: "bg-purple-50",
            textColor: "text-purple-600",
        },
        {
            label: "Employees On Leave",
            value: employeesThisMonth,
            unit: "this month",
            icon: CalendarX2,
            gradient: "from-blue-500 to-indigo-600",
            lightBg: "bg-blue-50",
            textColor: "text-blue-600",
        },
        {
            label: "On Leave Today",
            value: onLeaveToday.length,
            unit: "employees",
            icon: Sunrise,
            gradient: "from-emerald-500 to-teal-600",
            lightBg: "bg-emerald-50",
            textColor: "text-emerald-600",
        },
    ]

    if (loading) return <div className="flex justify-center items-center h-64"><Loader /></div>

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
            <PageHeader title="Team View" subtitle="View your team members on leave" divider />

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {STATS.map((s) => {
                    const Icon = s.icon
                    return (
                        <Card key={s.label} className="border-gray-100 overflow-hidden">
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
                    )
                })}
            </div>

            {/* Who's out today strip */}
            {onLeaveToday.length > 0 && (
                <Card className="border-indigo-100 bg-indigo-50/50">
                    <CardContent className="px-5 py-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wide flex-shrink-0">
                                Out today
                            </span>
                            {onLeaveToday.map((e, i) => {
                                const av = AVATAR_COLORS[i % AVATAR_COLORS.length]
                                const name = e.extendedProps?.name ?? e.title
                                const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
                                return (
                                    <div key={i} className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-sm border border-indigo-100">
                                        <div
                                            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                                            style={{ background: av.bg, color: av.text }}
                                        >
                                            {initials}
                                        </div>
                                        <span className="text-xs font-medium text-gray-700">{name}</span>
                                        {e.extendedProps?.duration_type === "half" && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600 font-medium">Half</span>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Empty state */}
            {leaveCalEvents.length === 0 && (
                <Card className="border-gray-100">
                    <CardContent className="flex flex-col items-center gap-3 py-12 text-gray-400">
                        <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
                            <Users size={28} strokeWidth={1.5} />
                        </div>
                        <p className="text-sm font-medium">No team leaves scheduled</p>
                    </CardContent>
                </Card>
            )}

            {/* Calendar */}
            <Card className="border-gray-100 overflow-hidden">
                {/* Custom toolbar */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                            <CalendarDays size={15} className="text-purple-500" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-800 leading-none">{calTitle}</h3>
                            {isManagerOrAdmin && (
                                <p className="text-[11px] text-gray-400 mt-0.5">Click an event to see details</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Legend */}
                        <div className="hidden sm:flex items-center gap-3 mr-2">
                            {LEGEND.map((item) => (
                                <div key={item.label} className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                                    <span className="text-[11px] text-gray-400">{item.label}</span>
                                </div>
                            ))}
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
                </div>

                <CardContent className="p-4 pt-3">
                    <FullCalendar
                        ref={calRef}
                        plugins={[dayGridPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={false}
                        height="auto"
                        events={calEvents}
                        datesSet={(info) => setCalTitle(info.view.title)}
                        eventClick={isManagerOrAdmin ? (info) => {
                            const leave = info.event.extendedProps as RawLeave
                            if (leave?.id) setSelectedLeave(leave)
                        } : undefined}
                        eventContent={(arg) => {
                            const isHoliday = arg.event.classNames.includes("holiday-event")
                            return (
                                <div className="flex items-center gap-1 px-1.5 py-0.5">
                                    {isHoliday && <Palmtree size={11} color="#92400e" />}
                                    <span
                                        style={{ color: isHoliday ? "#92400e" : "white" }}
                                        className="text-[11px] font-medium truncate"
                                    >
                                        {arg.event.title}
                                    </span>
                                </div>
                            )
                        }}
                        dayCellClassNames={(arg) => {
                            const day = arg.date.getDay()
                            const inMonth = arg.date.getMonth() === arg.view.currentStart.getMonth()
                            return (day === 0 || day === 6) && inMonth ? ["bg-amber-50/40"] : []
                        }}
                        dayCellContent={(arg) => (
                            <div className="flex justify-end pr-1 pt-1">
                                <span className={
                                    arg.isToday
                                        ? "bg-[#5746AF] text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-sm"
                                        : "text-sm text-gray-500"
                                }>
                                    {arg.dayNumberText}
                                </span>
                            </div>
                        )}
                    />
                </CardContent>
            </Card>

            <Sheet open={!!selectedLeave} onOpenChange={(open) => { if (!open) setSelectedLeave(null); }}>
                <SheetContent className="overflow-y-auto sm:max-w-[540px] w-full p-0 flex flex-col border-l-0 shadow-2xl bg-white">
                    {selectedLeave && (() => {
                        const name = selectedLeave.name;
                        const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
                        return (
                            <>
                                <div className="px-6 py-8 border-b border-gray-100 bg-white sticky top-0 z-10">
                                    <SheetHeader className="text-left">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-100 flex-shrink-0">
                                                {initials}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <SheetTitle className="text-xl font-bold text-gray-900">{name}</SheetTitle>
                                                <SheetDescription className="text-sm font-medium text-gray-500 mt-0.5">
                                                    {selectedLeave.duration_type === "half" ? "Half Day Leave" : "Full Day Leave"} · {selectedLeave.leave_type}
                                                </SheetDescription>
                                            </div>
                                        </div>
                                    </SheetHeader>
                                </div>

                                <div className="px-8 py-8 space-y-6 flex-1 overflow-y-auto">
                                    <div className="grid grid-cols-1 gap-4">
                                        {DRAWER_FIELDS.map(({ label, render }) => (
                                            <div key={label} className="bg-gray-50 rounded-2xl px-5 py-4 flex flex-col gap-1 transition-colors hover:bg-gray-100/70 border border-gray-100/50">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
                                                <span className="text-sm font-semibold text-gray-800">{render(selectedLeave)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {isManagerOrAdmin && selectedLeave.reason && (
                                        <div className="p-6 rounded-2xl bg-indigo-50/40 border border-indigo-100/50">
                                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-3">Reason for Leave</p>
                                            <p className="text-sm text-gray-700 leading-relaxed font-medium italic">"{selectedLeave.reason}"</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )
                    })()}
                </SheetContent>
            </Sheet>
        </div>
    )
}

export default TeamView
