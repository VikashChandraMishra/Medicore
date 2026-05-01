import { X } from "lucide-react";
import type { Appointment } from "../../types/appointment";
import type { Patient } from "../../types/patient";
import type { User } from "../../types/user";
import type { CalendarDay } from "../../utils/calendar";
import { WEEKDAYS } from "../../utils/calendar";
import { getDateKey } from "../../utils/date";
import { getDoctorName, getPatientName } from "../../utils/people";
import { THEME } from "../../constants/theme";

type AppointmentCalendarProps = {
    appointments: Appointment[];
    calendarDays: CalendarDay[];
    canSchedule: boolean;
    doctors: User[];
    patients: Patient[];
    onOpenAppointment: (dateKey: string) => void;
    onRemoveAppointment: (dateKey: string) => void;
};

export default function AppointmentCalendar({
    appointments,
    calendarDays,
    canSchedule,
    doctors,
    patients,
    onOpenAppointment,
    onRemoveAppointment,
}: AppointmentCalendarProps) {
    const appointmentsByDate = new Map(
        appointments.map((appointment) => [appointment.appointmentDate, appointment]),
    );

    return (
        <div className="overflow-x-auto rounded-lg bg-white">
            <div className="min-w-[44rem]">
                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                    {WEEKDAYS.map((weekday) => (
                        <div key={weekday} className="px-2 py-2 text-right text-[0.68rem] font-semibold uppercase tracking-wide text-gray-500 sm:px-3 sm:text-xs">
                            {weekday}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {calendarDays.map((day) => {
                        const dayLabel = day.date.getDate();
                        const dayKey = getDateKey(day.date);
                        const appointment = appointmentsByDate.get(dayKey);
                        const canEditDay = Boolean(canSchedule && day.isCurrentMonth);

                        return (
                            <div
                                key={dayKey}
                                role={canEditDay ? "button" : undefined}
                                tabIndex={canEditDay ? 0 : undefined}
                                onClick={() => {
                                    if (canEditDay) {
                                        onOpenAppointment(dayKey);
                                    }
                                }}
                                onKeyDown={(event) => {
                                    if (!canEditDay || (event.key !== "Enter" && event.key !== " ")) return;
                                    event.preventDefault();
                                    onOpenAppointment(dayKey);
                                }}
                                className={`relative min-h-24 border-b border-r border-gray-200 p-2 last:border-r-0 sm:min-h-32 ${canEditDay ? `cursor-pointer transition ${THEME.HOVER_BACKGROUND}` : ""} ${day.isPast
                                    ? "bg-gray-100 text-gray-400"
                                    : day.isCurrentMonth
                                        ? "bg-white text-gray-800"
                                        : "bg-gray-50 text-gray-300"
                                    }`}
                            >
                                {canSchedule && appointment && (
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onRemoveAppointment(dayKey);
                                        }}
                                        className="absolute right-2 top-2 grid h-6 w-6 cursor-pointer place-items-center rounded-full bg-white text-gray-500 shadow-sm transition hover:bg-red-50 hover:text-red-600 active:scale-[0.95]"
                                        aria-label="Remove appointment"
                                        title="Remove appointment"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                                <div className="flex justify-start">
                                    <span
                                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${day.isToday
                                            ? "bg-[#0b1f4d] text-white"
                                            : ""
                                            }`}
                                    >
                                        {dayLabel}
                                    </span>
                                </div>
                                {appointment && (
                                    <div className="mt-3 rounded-md bg-[#0b1f4d]/5 p-2 text-xs text-[#0b1f4d]">
                                        <p className="truncate font-semibold">{getPatientName(appointment.patientId, patients)}</p>
                                        {canSchedule && (
                                            <p className="mt-1 truncate text-[#0b1f4d]/70">{getDoctorName(appointment.doctorId, doctors)}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
