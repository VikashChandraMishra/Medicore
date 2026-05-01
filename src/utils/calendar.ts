export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type CalendarDay = {
    date: Date;
    isCurrentMonth: boolean;
    isPast: boolean;
    isToday: boolean;
};

export function getMonthCalendarDays(date: Date) {
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const calendarStart = new Date(monthStart);
    calendarStart.setDate(monthStart.getDate() - monthStart.getDay());

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalDays = Math.ceil((monthEnd.getDate() + monthStart.getDay()) / 7) * 7;

    return Array.from({ length: totalDays }).map((_, index): CalendarDay => {
        const day = new Date(calendarStart);
        day.setDate(calendarStart.getDate() + index);

        const normalizedDay = new Date(day);
        normalizedDay.setHours(0, 0, 0, 0);

        return {
            date: day,
            isCurrentMonth: day.getMonth() === date.getMonth(),
            isPast: normalizedDay < today,
            isToday: normalizedDay.getTime() === today.getTime(),
        };
    });
}
