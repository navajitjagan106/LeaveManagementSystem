import React, { useCallback, useEffect, useMemo, useState } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import { getTeamLeaves } from "../../api/leaveApi"
import { useOutletContext } from "react-router-dom"
import PageHeader from "../common/PageHeader"
import Loader from "../common/Loader"
import { CalendarDays, Palmtree, Users, X } from "lucide-react"
import { useToast } from "../common/ToastContext"

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

const toYMD = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
}

const toDisplay = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })


const StatCard: React.FC<{ label: string; value: number; unit: string; color: string; border: string }> = ({
    label, value, unit, color, border
}) => (
    <div className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${border}`}>
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`text-2xl font-semibold ${color}`}>{value}</p>
        <p className="text-xs text-gray-400 mt-1">{unit}</p>
    </div>
)

const DRAWER_FIELDS: { label: string; render: (l: RawLeave) => string }[] = [
    { label: "Employee", render: (l) => l.name },
    { label: "Leave Type", render: (l) => l.leave_type },
    { label: "Duration", render: (l) => l.duration_type === "half" ? "Half Day" : "Full Day" },
    { label: "From", render: (l) => toDisplay(l.from_date) },
    { label: "To", render: (l) => toDisplay(l.to_date) },
]

const LeaveDetailDrawer: React.FC<{ leave: RawLeave; isManager: boolean; onClose: () => void }> = ({
    leave, isManager, onClose
}) => (
    < >
        <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
        <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">Leave Details</h2>
                <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-500">
                    <X size={20} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                {DRAWER_FIELDS.map(({ label, render }) => (
                    <div key={label} className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{label}</span>
                        <span className="font-medium text-gray-800">{render(leave)}</span>
                    </div>
                ))}
                {isManager && (
                    <div className="border-t pt-4">
                        <p className="text-sm text-gray-500 mb-2">Reason</p>
                        <p className="text-gray-800 text-sm leading-relaxed">{leave.reason || "—"}</p>
                    </div>
                )}
            </div>
        </div>
    </>
)


const LEGEND = [
    { label: "Full Day Leave", color: "bg-indigo-500" },
    { label: "Half Day Leave", color: "bg-indigo-300" },
    { label: "Holiday", color: "bg-yellow-400" },
]

const TeamView: React.FC = () => {
    const toast = useToast()
    const { holidays } = useOutletContext<{ holidays: any[] }>()

    const [calEvents, setCalEvents] = useState<CalendarEvent[]>([])
    const [role, setRole] = useState<string>(() => {
        const user = JSON.parse(localStorage.getItem("user") || "null")
        return user?.role ?? ""
    })
    const [selectedLeave, setSelectedLeave] = useState<RawLeave | null>(null)
    const [loading, setLoading] = useState(true)

    const isManager = role === "manager"

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

    const onLeaveToday = leaveCalEvents.filter((e) => e.start === todayStr).length

    const holidaysThisMonth = holidays.filter((h: any) => {
        const d = new Date(h.date)
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear
    }).length


    const STATS = [
        { label: "Holidays This Month", value: holidaysThisMonth, unit: "holidays", color: "text-purple-600", border: "border-purple-600" },
        { label: "Employees On Leave This Month", value: employeesThisMonth, unit: "employees", color: "text-blue-600", border: "border-blue-600" },
        { label: "On Leave Today", value: onLeaveToday, unit: "employees today", color: "text-green-600", border: "border-green-600" },
    ]

    if (loading) return <div className="text-center py-8"><Loader /></div>

    return (
        <div className="space-y-6">
            <PageHeader title="Team View" subtitle="View your team members on leave" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {STATS.map((s) => <StatCard key={s.label} {...s} />)}
            </div>

            {leaveCalEvents.length === 0 && (
                <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center gap-2 text-gray-400">
                    <Users size={32} strokeWidth={1.5} />
                    <p className="text-sm">No team leaves scheduled</p>
                </div>
            )}

            {/* Calendar */}
            <div className="bg-white p-4 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <CalendarDays size={16} />
                        {isManager && <span>Click a leave event to see details</span>}
                    </div>
                    <div className="flex gap-4">
                        {LEGEND.map((item) => (
                            <div key={item.label} className="flex items-center gap-1.5 text-xs text-gray-600">
                                <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                                {item.label}
                            </div>
                        ))}
                    </div>
                </div>

                <FullCalendar
                    plugins={[dayGridPlugin]}
                    initialView="dayGridMonth"
                    height="auto"
                    events={calEvents}
                    eventClick={isManager ? (info) => {
                        const leave = info.event.extendedProps as RawLeave
                        if (leave?.id) setSelectedLeave(leave)
                    } : undefined}
                    eventContent={(arg) => {
                        const isHoliday = arg.event.classNames.includes("holiday-event")
                        return (
                            <div className="flex items-center gap-1 px-1">
                                {isHoliday && <Palmtree size={14} color="#92400e" />}
                                <span
                                    style={{ color: isHoliday ? "#92400e" : "white" }}
                                    className="text-xs font-medium truncate"
                                >
                                    {arg.event.title}
                                </span>
                            </div>
                        )
                    }}
                    dayCellClassNames={(arg) => {
                        const day = arg.date.getDay()
                        const inMonth = arg.date.getMonth() === arg.view.currentStart.getMonth()
                        return (day === 0 || day === 6) && inMonth ? ["bg-[#fef3c7]"] : []
                    }}
                    dayCellContent={(arg) => (
                        <div className="flex flex-col items-end pr-1">
                            <span className={
                                arg.isToday
                                    ? "bg-[#5746AF] text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold"
                                    : "text-sm text-gray-600"
                            }>
                                {arg.dayNumberText}
                            </span>
                        </div>
                    )}
                    headerToolbar={{
                        left: "dayGridMonth",
                        center: "title",
                        right: "prev,next today",
                    }}
                />
            </div>



            {selectedLeave && (
                <LeaveDetailDrawer
                    leave={selectedLeave}
                    isManager={isManager}
                    onClose={() => setSelectedLeave(null)}
                />
            )}
        </div>
    )
}

export default TeamView