import React, { useEffect, useState } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import { getTeamLeaves } from "../../api/leaveApi"
import { useOutletContext } from "react-router-dom"
import PageHeader from "../common/PageHeader"
import Loader from "../common/Loader"
import { Palmtree } from "lucide-react"
import { useToast } from "../common/ToastContext"

type CalendarEvent = {
    title: string
    start: string
    backgroundColor?: string
    borderColor?: string
}
const TeamView: React.FC = () => {
    const toast = useToast()
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [leaveEvents, setLeaveEvents] = useState<CalendarEvent[]>([])
    const { holidays } = useOutletContext<{ holidays: any[] }>()

    useEffect(() => {
        const fetchTeamLeaves = async () => {
            try {
                setLoading(true)
                const expandLeaves = (data: any[]) => {
                    const events: any[] = []
                    const holidayDates = holidays.map((h: any) => formatDate(new Date(h.date)))

                    data.forEach((e) => {
                        const isHalfDay = e.duration_type === "half";
                        let current = new Date(e.from_date)
                        const end = new Date(e.to_date)
                        current.setHours(0, 0, 0, 0)
                        end.setHours(0, 0, 0, 0)

                        while (current <= end) {
                            const day = current.getDay()
                            const dateStr = formatDate(current)
                            const isWeekend = day === 0 || day === 6
                            const isHoliday = holidayDates.includes(dateStr)

                            if (!isWeekend && !isHoliday) {
                                events.push({
                                    title: isHalfDay ? `${e.name} (Half Day)` : e.name,
                                    start: dateStr,
                                    backgroundColor: isHalfDay ? "#a5b4fc" : "#6366f1",
                                    borderColor: isHalfDay ? "#a5b4fc" : "#6366f1",
                                })
                            }
                            current.setDate(current.getDate() + 1)
                        }
                    })
                    return events
                }

                const response = await getTeamLeaves()
                const leaveEvents = expandLeaves(response.data)
                const holidayEvents = holidays.map((h: any) => ({
                    title: h.name,
                    start: formatDate(new Date(h.date)),
                    backgroundColor: "#fef3c7",
                    borderColor: "#f59e0b",
                    textColor: "#92400e",
                    display: "block",
                    classNames: ["holiday-event"],
                }));
                setLeaveEvents(leaveEvents)
                setEvents([...leaveEvents, ...holidayEvents])
            } catch (error) {
                toast.error('Failed to load team calendar')
            } finally {
                setLoading(false)
            }
        }
        if (holidays.length > 0) {
            fetchTeamLeaves()
        }
    }, [holidays, toast])

    const formatDate = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        return `${year}-${month}-${day}`
    }

    const todayDate = new Date()
    const thisMonth = todayDate.getMonth()
    const thisYear = todayDate.getFullYear()
    const holidaysThisMonth = holidays.filter((h) => {
        const d = new Date(h.date)
        return (
            d.getMonth() === thisMonth &&
            d.getFullYear() === thisYear
        )
    }).length

    const stats = [
        {
            label: "Total Holidays",
            value: holidaysThisMonth,
            color: "text-purple-600",
            border: "border-purple-600",
            unit: "holidays this month"
        },
        {
            label: "Employees On Leave This Month",
            value: new Set(leaveEvents.filter((e) => {
                const d = new Date(e.start)
                return d.getMonth() === thisMonth && d.getFullYear() === thisYear
            }).map((e) => e.title)).size,
            color: "text-blue-600",
            border: "border-blue-600",
            unit: "employees",

        },
        {
            label: "Employees On Leave Today",
            value: leaveEvents.filter(
                (e) => e.start === formatDate(new Date())
            ).length,
            color: "text-green-600",
            border: "border-green-600",
            unit: "employees today"
        },
    ]


    const legendItems = [
        { label: "Full Day Leave", color: "bg-indigo-500" },
        { label: "Half Day Leave", color: "bg-[#a5b4fc]" },
        { label: "Holiday", color: "bg-yellow-500" },
    ]
    if (loading) {
        return <div className="text-center py-8"><Loader /></div>
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Team View"
                subtitle="View your team members on Leave "
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((s, i) => (
                    <div key={i} className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${s.border}`}>
                        <p className="text-sm text-gray-500">{s.label}</p>
                        <p className={`text-2xl font-semibold ${s.color}`}>
                            {s.value}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{s.unit}</p>
                    </div>
                ))}
            </div>

            {leaveEvents.length === 0 && (
                <div className="bg-white p-4 rounded-xl shadow-sm text-center text-gray-400 text-sm">
                    No team leaves this month
                </div>
            )}


            {/* Calendar */}
            <div className="bg-white p-4 rounded-xl shadow-sm">
                <div className="flex gap-6 text-sm mb-4 justify-end">
                    {legendItems.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${item.color}`}></span>
                            <span className="text-gray-700">{item.label}</span>
                        </div>
                    ))}
                </div>

                <FullCalendar
                    eventContent={(arg) => {
                        const isHoliday = arg.event.classNames.includes("holiday-event");
                        return (
                            <div className="flex items-center gap-1 px-1">
                                {isHoliday && (
                                    <Palmtree size={20} color="#92400e" />
                                )}
                                <span
                                    style={{ color: isHoliday ? "#92400e" : "white" }}
                                    className="text-xs font-medium truncate"
                                >
                                    {arg.event.title}
                                </span>
                            </div>
                        );
                    }}
                    plugins={[dayGridPlugin]}
                    initialView="dayGridMonth"
                    height="auto"
                    events={events}
                    dayCellClassNames={(arg) => {
                        const day = arg.date.getDay()
                        const isCurrentMonth = arg.date.getMonth() === arg.view.currentStart.getMonth()
                        if ((day === 0 || day === 6) && isCurrentMonth) {
                            return ["bg-[#fef3c7]"]
                        }
                        return []
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
                    eventDisplay="auto"
                    headerToolbar={{
                        left: "dayGridMonth,dayGridWeek",
                        center: "title",
                        right: "prev,next today",
                    }}
                />
            </div>
        </div>
    )
}

export default TeamView 