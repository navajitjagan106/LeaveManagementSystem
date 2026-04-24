import React, { useRef } from "react";

interface Props {
    fromDate: string;
    toDate: string;
    totalDays: number;
    onFromChange: (val: string) => void;
    onToChange: (val: string) => void;
}

function formatDate(dateStr: string): string {
    if (!dateStr) return "Select date";
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

const DateRangePicker: React.FC<Props> = ({ fromDate, toDate, totalDays, onFromChange, onToChange }) => {
    const fromRef = useRef<HTMLInputElement>(null);
    const toRef = useRef<HTMLInputElement>(null);

    return (
        <div className="flex items-stretch border border-gray-200 rounded-xl overflow-hidden mb-6 bg-white shadow-sm">
            {/* From */}
            <div
                className="flex-1 px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => fromRef.current?.showPicker?.() ?? fromRef.current?.focus()}
            >
                <p className="text-xs text-gray-400 font-medium mb-0.5">From</p>
                <p className={`text-sm font-bold ${fromDate ? "text-gray-900" : "text-gray-400"}`}>
                    {formatDate(fromDate)}
                </p>
                <input
                    ref={fromRef}
                    type="date"
                    value={fromDate}
                    onChange={(e) => onFromChange(e.target.value)}
                    className="sr-only"
                    required
                />
            </div>

            {/* Days pill */}
            <div className="flex items-center px-4 border-x border-gray-200">
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 rounded-full px-3 py-1 whitespace-nowrap">
                    {totalDays > 0 ? `${totalDays} day${totalDays === 1 ? "" : "s"}` : "0 days"}
                </span>
            </div>

            {/* To */}
            <div
                className="flex-1 px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors text-right"
                onClick={() => toRef.current?.showPicker?.() ?? toRef.current?.focus()}
            >
                <p className="text-xs text-gray-400 font-medium mb-0.5">To</p>
                <p className={`text-sm font-bold ${toDate ? "text-gray-900" : "text-gray-400"}`}>
                    {formatDate(toDate)}
                </p>
                <input
                    ref={toRef}
                    type="date"
                    value={toDate}
                    min={fromDate}
                    onChange={(e) => onToChange(e.target.value)}
                    className="sr-only"
                    required
                />
            </div>
        </div>
    );
};

export default DateRangePicker;
