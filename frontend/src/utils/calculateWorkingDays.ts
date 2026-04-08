export const calculateWorkingDays = (
    fromDate: string,
    toDate: string,
     // ["2026-01-26", ...]
    durationType: string,
    holidays: string[],
) => {
    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (end < start) return 0;

    let count = 0;
    let current = new Date(start);

    while (current <= end) {
        const day = current.getDay();
        const dateStr = current.toISOString().split("T")[0];

        const isWeekend = day === 0 || day === 6;
        const isHoliday = holidays.includes(dateStr);

        if (!isWeekend && !isHoliday) {
            count++;
        }

        current.setDate(current.getDate() + 1);
    }

    if (durationType === "half") {
        count *= 0.5;
    }

    return count;
};