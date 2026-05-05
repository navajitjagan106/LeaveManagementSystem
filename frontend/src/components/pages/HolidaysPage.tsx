import { useEffect, useState } from "react";
import { getHolidays } from "../../api/leaveApi";
import { CalendarCheck } from "lucide-react";
import PageHeader from "../common/PageHeader";
import Loader from "../common/Loader";

const HolidaysPage = () => {
    const [holidays, setHolidays] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getHolidays()
            .then((res) => setHolidays(res.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const today = new Date();
    const upcoming = holidays.filter((h) => new Date(h.date) >= today);
    const past = holidays.filter((h) => new Date(h.date) < today);

    const fmt = (d: string) =>
        new Date(d).toLocaleDateString("en-IN", {
            weekday: "short", day: "numeric", month: "short", year: "numeric",
        });

    if (loading) return <div className="flex justify-center items-center h-48"><Loader /></div>;

    const HolidayRow = ({ h }: { h: any }) => (
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
            <div className="bg-purple-100 text-purple-700 rounded-xl p-2">
                <CalendarCheck size={16} />
            </div>
            <div>
                <p className="font-medium text-gray-800 text-sm">{h.name}</p>
                <p className="text-xs text-gray-400">{fmt(h.date)}</p>
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <PageHeader
                title="Company Holidays"
                subtitle={`${upcoming.length} upcoming holidays this year`}
                divider
            />

            {upcoming.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Upcoming
                    </p>
                    <div className="grid gap-2">
                        {upcoming.map((h) => <HolidayRow key={h.id ?? h.date} h={h} />)}
                    </div>
                </div>
            )}

            {past.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Past
                    </p>
                    <div className="grid gap-2 opacity-50">
                        {past.map((h) => <HolidayRow key={h.id ?? h.date} h={h} />)}
                    </div>
                </div>
            )}

            {holidays.length === 0 && (
                <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-xl border">
                    No holidays added yet
                </div>
            )}
        </div>
    );
};

export default HolidaysPage;
