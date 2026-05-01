import type { SelectOption } from "../ui/Select";
import type { Appointment } from "../../types/appointment";
import type { Patient } from "../../types/patient";
import type { User } from "../../types/user";
import CloseButton from "../ui/CloseButton";
import Select from "../ui/Select";
import { formatLongDate } from "../../utils/date";
import { getDoctorName, getPatientName } from "../../utils/people";
import { THEME } from "../../constants/theme";

type AppointmentModalProps = {
    appointment?: Appointment;
    appointmentDate: Date;
    doctorId: string;
    doctors: User[];
    isEditingExisting: boolean;
    patientId: string;
    patients: Patient[];
    doctorOptions: SelectOption[];
    patientOptions: SelectOption[];
    onClose: () => void;
    onDoctorChange: (doctorId: string) => void;
    onPatientChange: (patientId: string) => void;
    onRemove: () => void;
    onSave: () => void;
};

export default function AppointmentModal({
    appointment,
    appointmentDate,
    doctorId,
    doctors,
    isEditingExisting,
    patientId,
    patients,
    doctorOptions,
    patientOptions,
    onClose,
    onDoctorChange,
    onPatientChange,
    onRemove,
    onSave,
}: AppointmentModalProps) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-950">
                            Schedule Appointment
                        </h2>
                        <p className="text-sm text-gray-500">
                            {formatLongDate(appointmentDate)}
                        </p>
                    </div>
                    <CloseButton
                        onClick={onClose}
                        label="Close appointment scheduler"
                    />
                </div>

                {appointment && isEditingExisting && (
                    <div className="mt-4 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
                        Current: {getPatientName(appointment.patientId, patients)} with {getDoctorName(appointment.doctorId, doctors)}
                    </div>
                )}

                <div className="mt-5 space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Patient
                        </label>
                        <Select
                            value={patientId}
                            options={patientOptions}
                            onValueChange={onPatientChange}
                            ariaLabel="Select appointment patient"
                            menuClassName="left-0 right-auto"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Doctor
                        </label>
                        <Select
                            value={doctorId}
                            options={doctorOptions}
                            onValueChange={onDoctorChange}
                            ariaLabel="Select appointment doctor"
                            menuClassName="left-0 right-auto"
                        />
                    </div>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    {appointment && isEditingExisting && (
                        <button
                            type="button"
                            onClick={onRemove}
                            className="cursor-pointer rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 active:scale-[0.98]"
                        >
                            Remove
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className={`cursor-pointer rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition ${THEME.HOVER_BACKGROUND} active:scale-[0.98]`}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onSave}
                        className="cursor-pointer rounded-md bg-[#0b1f4d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#102a63] active:scale-[0.98]"
                    >
                        Save Appointment
                    </button>
                </div>
            </div>
        </div>
    );
}
