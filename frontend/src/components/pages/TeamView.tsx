import React, { useEffect, useState } from "react" 
import FullCalendar from "@fullcalendar/react" 
import dayGridPlugin from "@fullcalendar/daygrid" 
import { getTeamLeaves, getHolidays } from "../../api/leaveApi" 
import PageHeader from "../common/PageHeader" 
import Loader from "../common/Loader" 

type CalendarEvent = {
    title: string 
    start: string 
    backgroundColor?: string 
    borderColor?: string 
} 
const TeamView: React.FC = () => {
    const [events, setEvents] = useState<CalendarEvent[]>([]) 
    const [loading, setLoading] = useState(true) 
    const [holidays, setHolidays] = useState<any[]>([]) 
    const [leaveEvents, setLeaveEvents] = useState<CalendarEvent[]>([])

    useEffect(() => {
        fetchHolidays() 
    }, []) 

    const fetchHolidays = async () => {
        try {
            const res = await getHolidays() 
            setHolidays(res.data) 
        } catch (err) {
            console.error("Failed to fetch holidays", err) 
        }
    } 

    useEffect(() => {
        const fetchTeamLeaves = async () => {
            try {
                setLoading(true) 
                const expandLeaves = (data: any[]) => {
                    const events: any[] = []
                    const holidayDates = holidays.map(
                        (h: any) => formatDate(new Date(h.date))
                    )
                    data.forEach((e) => {
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
                                    title: e.name,
                                    start: dateStr,
                                    backgroundColor: "#6366f1",
                                    borderColor: "#6366f1",
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
                    backgroundColor: "#f59e0b",
                    borderColor: "#f59e0b",
                }))
                setLeaveEvents(leaveEvents)
                setEvents([...leaveEvents, ...holidayEvents])
            } catch (error) {
                alert('Failed to load team calendar')
            } finally {
                setLoading(false)
            }
        }
        if (holidays.length > 0) {
            fetchTeamLeaves()
        }
    }, [holidays])

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
            value: events.filter(
                (e) => e.start === new Date().toISOString().split("T")[0]
            ).length,
            color: "text-green-600",
            border: "border-green-600",
            unit: "employees today"
        },
    ]


    const legendItems = [
        { label: "Leave", color: "bg-indigo-500" },
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
                    <div key={i} className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${s.border}`}>                        <p className="text-sm text-gray-500">{s.label}</p>
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
                    eventContent={(arg) => (
                        <div className="flex items-center gap-1 px-1">
                            <span className="w-4 h-4 rounded-full bg-white/30 text-white text-[10px] flex items-center justify-center font-bold">
                                {arg.event.title.charAt(0).toUpperCase()}
                            </span>
                            <span className="text-white text-xs truncate">{arg.event.title}</span>
                        </div>
                    )}
                    plugins={[dayGridPlugin]}
                    initialView="dayGridMonth"
                    height="auto"
                    events={leaveEvents}
                    dayCellDidMount={(arg) => {
                        const dateStr = formatDate(arg.date) 
                        const dayHolidays = holidays.filter(h => formatDate(new Date(h.date)) === dateStr) 

                        if (dayHolidays.length > 0) {
                            arg.el.style.backgroundColor = "#fef3c7" 
                            arg.el.style.position = "relative" 
                            const label = document.createElement("div") 
                            label.innerText = dayHolidays.map(h => h.name).join(", ") 
                            label.style.cssText = `
                            font-size: 15px 
                            color: #92400e 
                            font-weight: 500 
                            padding: 0 4px 
                            white-space: nowrap 
                            overflow: hidden 
                            text-overflow: ellipsis 
                            ` 
                            arg.el.appendChild(label) 
                        }
                    }}
                    dayCellClassNames={(arg) => {
                        const day = arg.date.getDay() 
                        const isCurrentMonth = arg.date.getMonth() === arg.view.currentStart.getMonth()
                        if ((day === 0 || day === 6) && isCurrentMonth) {
                            return ["bg-[#fef3c7]"] 
                        }
                        return [] 
                    }}
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