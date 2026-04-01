import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { getLeaveTypes, getTeamLeaves, getHolidays } from "../../api/leaveApi";
import PageHeader from "../common/PageHeader";

type CalendarEvent = {
    title: string;
    start: string;
    backgroundColor?: string;
    borderColor?: string;
};
const TeamView: React.FC = () => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [holidays, setHolidays] = useState<any[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [leaveEvents, setLeaveEvents] = useState<CalendarEvent[]>([]);

    useEffect(() => {
        fetchHolidays();
    }, []);

    const fetchHolidays = async () => {
        try {
            const res = await getHolidays();
            setHolidays(res.data);
        } catch (err) {
            console.error("Failed to fetch holidays", err);
        }
    };


    useEffect(() => {
        fetchLeaveTypes();
    }, []);

    const fetchLeaveTypes = async () => {
        try {
            const res = await getLeaveTypes();
            setLeaveTypes(res.data.data);
        } catch (err) {
            console.error("Failed to fetch leave types", err);
        }
    };


    useEffect(() => {
        const fetchTeamLeaves = async () => {
            try {
                setLoading(true);

                const expandLeaves = (data: any[]) => {
                    const events: any[] = [];

                    const holidayDates = holidays.map(
                        (h: any) => formatDate(new Date(h.date))
                    );

                    data.forEach((e) => {
                        let current = new Date(e.from_date);
                        const end = new Date(e.to_date);
                        current.setHours(0, 0, 0, 0)
                        end.setHours(0, 0, 0, 0)

                        while (current <= end) {
                            const day = current.getDay();
                            const dateStr = formatDate(current);

                            const isWeekend = day === 0 || day === 6;
                            const isHoliday = holidayDates.includes(dateStr);



                            if (!isWeekend && !isHoliday) {
                                events.push({
                                    title: e.name,
                                    start: dateStr,
                                    backgroundColor: "#6366f1",
                                    borderColor: "#6366f1",
                                });
                            }

                            current.setDate(current.getDate() + 1);
                        }
                    });



                    return events;
                };

                const response = await getTeamLeaves();

                const leaveEvents = expandLeaves(response.data)
                const holidayEvents = holidays.map((h: any) => ({
                    title: h.name,
                    start: formatDate(new Date(h.date)),
                    backgroundColor: "#f59e0b",
                    borderColor: "#f59e0b",
                }));
                setLeaveEvents(leaveEvents);
                setEvents([...leaveEvents, ...holidayEvents])
            } catch (error) {
                alert('Failed to load team calendar');
            } finally {
                setLoading(false);
            }
        };
        if (holidays.length > 0) {
            fetchTeamLeaves();
        }
    }, [holidays]);

    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const leaveColorMap: Record<string, { bg: string; dot: string }> = {
        sick: { bg: "#ef4444", dot: "bg-red-500" },
        casual: { bg: "#3b82f6", dot: "bg-blue-500" },
        earned: { bg: "#10b981", dot: "bg-green-500" },
    };


    const legend = leaveTypes.map((lt) => {
        const key = lt.name.toLowerCase().split(" ")[0];

        return {
            label: lt.name,
            color: leaveColorMap[key]?.dot || "bg-purple-500",
        };
    });
    const todayDate = new Date();
const thisMonth = todayDate.getMonth();
const thisYear = todayDate.getFullYear();

    const stats = [
        {
            label: "Total Leaves",
            value: leaveEvents.length,
            color: "text-purple-600",
        },
        {
            label: "This Month",
            value:leaveEvents.filter((e) => {
            const d = new Date(e.start);
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        }).length,
            color: "text-blue-600",
        },
        {
            label: "On Leave Today",
            value: events.filter(
                (e) => e.start === new Date().toISOString().split("T")[0]
            ).length,
            color: "text-green-600",
        },
    ];

    const filters = [
        {
            type: "select",
            options: ["All Teams", "Engineering", "Sales"],
        },
        {
            type: "button",
            label: "Refresh",
        },
    ];

    if (loading) {
        return <div className="text-center py-8">Loading calendar...</div>;
    }

    return (
        <div className="space-y-6">
               <PageHeader
                title="Team View"
                subtitle="View your Team members on Leave "
            />
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl shadow-sm">
                        <p className="text-sm text-gray-500">{s.label}</p>
                        <p className={`text-2xl font-semibold ${s.color}`}>
                            {s.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center">

                <select className="border border-gray-300 rounded-lg px-4 py-2 text-sm">
                    {filters[0]?.options?.map((opt, i) => (
                        <option key={i}>{opt}</option>
                    ))}
                </select>

                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">
                    {filters[1].label}
                </button>

            </div>

            {/* Calendar */}
            <div className="bg-white p-4 rounded-xl shadow-sm">

                <FullCalendar
                    plugins={[dayGridPlugin]}
                    initialView="dayGridMonth"
                    height="auto"
                    events={events}
                    dayCellClassNames={(arg) => {
                        const day = arg.date.getDay();
                        if (day === 0 || day === 6) {
                            return ["bg-gray-50"];
                        }
                        return [];
                    }}
                    eventDisplay="block"
                    eventClassNames={() => [
                        "rounded-md",
                        "px-2",
                        "py-1",
                        "text-xs",
                        "font-medium",
                        "hover:opacity-90",
                        "cursor-pointer"
                    ]}
                    headerToolbar={{
                        left: "prev,next today",
                        center: "title",
                        right: "dayGridMonth,dayGridWeek",
                    }}
                />
            </div>

            {/* Legend */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex gap-6 text-sm">
                {legend.map((l, i) => (
                    <span key={i} className="flex items-center gap-2">
                        <span className={`w-3 h-3 ${l.color} rounded-full`}></span>
                        {l.label}
                    </span>
                ))}
            </div>

        </div>
    );
};

export default TeamView;