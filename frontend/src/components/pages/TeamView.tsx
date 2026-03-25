import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

const TeamView: React.FC = () => {
    const events = [
        { title: "Rahul", date: "2026-03-05" },
        { title: "Rahul", date: "2026-03-06" },
        { title: "Priya", date: "2026-03-06" },
        { title: "Amit", date: "2026-03-12" },
    ];

    return (
        <div className="space-y-4">

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm flex gap-4">
                <select className="border border-gray-300 rounded-lg px-4 py-2">
                    <option>Team/Department</option>
                    <option>Engineering</option>
                    <option>Sales</option>
                </select>

                <input
                    type="text"
                    placeholder="Date Range"
                    className="border border-gray-300 rounded-lg px-4 py-2"
                />
            </div>

            {/* Calendar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <FullCalendar
                    plugins={[dayGridPlugin]}
                    initialView="dayGridMonth"
                    height="auto"
                    events={events}
                />
            </div>

        </div>
    );
};

export default TeamView;