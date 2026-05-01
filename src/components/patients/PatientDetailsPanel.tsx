import { useState, type RefObject } from "react";
import CloseButton from "../ui/CloseButton";
import { THEME } from "../../constants/theme";
import type { Patient, Visit } from "../../types/patient";
import type { User } from "../../types/user";
import { formatLabel } from "../../utils/format";
import { getFullName } from "../../utils/people";
import {
    formatPatientDate,
    getDoctorName,
    truncateText,
} from "../../utils/patient-records";

type PatientDetailsPanelProps = {
    patient: Patient;
    doctors: User[];
    isOpen: boolean;
    panelRef: RefObject<HTMLDivElement | null>;
    onClose: () => void;
    onVisitSelect: (visit: Visit) => void;
};

export default function PatientDetailsPanel({
    patient,
    doctors,
    isOpen,
    panelRef,
    onClose,
    onVisitSelect,
}: PatientDetailsPanelProps) {
    const [visitView, setVisitView] = useState<"timeline" | "cards">("timeline");

    return (
        <div
            ref={panelRef}
            className={`fixed inset-y-0 right-0 z-40 w-full max-w-xl overflow-y-auto bg-white p-4 shadow-2xl transition-all duration-300 ease-out sm:top-18.25 sm:bottom-0 sm:p-6 ${isOpen
                ? "translate-x-0 opacity-100"
                : "translate-x-full opacity-0"
                }`}
        >
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold">{getFullName(patient)}</h2>
                    <p className="text-gray-500">
                        {patient.chronicConditions.join(", ") || "No chronic conditions"}
                    </p>
                </div>
                <CloseButton
                    onClick={onClose}
                    label="Close patient details"
                />
            </div>

            <div className="mt-4 space-y-2 text-sm">
                <p>Age: {patient.age}</p>
                <p>Gender: {formatLabel(patient.gender)}</p>
                <p>Status: {formatLabel(patient.status)}</p>
                <p>Blood group: {patient.bloodGroup ?? "Not recorded"}</p>
                <p>
                    Insurance: {patient.insurance.provider} (
                    {patient.insurance.isActive ? "Active" : "Inactive"})
                </p>
                <p>Policy: {patient.insurance.policyNumber}</p>
                <p>Phone: {patient.phone}</p>
                <p>Email: {patient.email}</p>
                <p>
                    Address: {patient.address.line1}
                    {patient.address.line2 ? `, ${patient.address.line2}` : ""},{" "}
                    {patient.address.city}, {patient.address.state}{" "}
                    {patient.address.zip}
                </p>
                <p>
                    Allergies: {patient.allergies.join(", ") || "None recorded"}
                </p>
                <p>Last Visit: {formatPatientDate(patient.lastVisitAt)}</p>
            </div>

            <div className="mt-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-medium">Visits</h3>
                    <div className="flex overflow-hidden rounded-md border border-gray-200">
                        <button
                            onClick={() => setVisitView("timeline")}
                            className={`cursor-pointer px-3 py-1.5 text-xs transition active:scale-[0.98] ${visitView === "timeline" ? "bg-[#0b1f4d] text-white" : `text-gray-500 ${THEME.HOVER_BACKGROUND} hover:text-gray-800`}`}
                        >
                            Timeline
                        </button>
                        <button
                            onClick={() => setVisitView("cards")}
                            className={`cursor-pointer px-3 py-1.5 text-xs transition active:scale-[0.98] ${visitView === "cards" ? "bg-[#0b1f4d] text-white" : `text-gray-500 ${THEME.HOVER_BACKGROUND} hover:text-gray-800`}`}
                        >
                            Detail
                        </button>
                    </div>
                </div>

                {visitView === "timeline" ? (
                    <div className="relative space-y-4 pl-5 before:absolute before:left-1.5 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-gray-200">
                        {patient.visits.map((visit, index) => (
                            <button
                                key={`${patient.id}-visit-${index}`}
                                onClick={() => onVisitSelect(visit)}
                                className="relative w-full cursor-pointer rounded-xl bg-gray-50 p-3 text-left text-sm transition hover:bg-gray-100 active:scale-[0.99]"
                            >
                                <span className="absolute -left-5 top-4 h-3 w-3 rounded-full border-2 border-white bg-[#0b1f4d]" />
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-medium text-gray-800">{visit.type}</p>
                                        <p className="text-xs text-gray-500">
                                            {getDoctorName(visit.doctorId, doctors)}
                                        </p>
                                    </div>
                                    <p className="shrink-0 text-xs text-gray-500">
                                        {formatPatientDate(visit.date)}
                                    </p>
                                </div>
                                <p className="mt-2 text-gray-600">
                                    {truncateText(visit.summary)}
                                </p>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {patient.visits.map((visit, index) => (
                            <button
                                key={`${patient.id}-visit-card-${index}`}
                                onClick={() => onVisitSelect(visit)}
                                className="w-full cursor-pointer rounded-xl bg-gray-50 p-3 text-left text-sm transition hover:bg-gray-100 active:scale-[0.99]"
                            >
                                <div className="flex justify-between gap-3">
                                    <p className="font-medium">{visit.type}</p>
                                    <p className="text-gray-500">{formatPatientDate(visit.date)}</p>
                                </div>
                                <p className="text-gray-600">{getDoctorName(visit.doctorId, doctors)}</p>
                                <p className="mt-2">{visit.summary}</p>
                                {visit.diagnosis && (
                                    <p className="mt-2">
                                        <span className="font-medium">Diagnosis:</span>{" "}
                                        {visit.diagnosis}
                                    </p>
                                )}
                                {visit.prescription && (
                                    <p className="mt-2">
                                        <span className="font-medium">Prescription:</span>{" "}
                                        {visit.prescription}
                                    </p>
                                )}
                                {visit.vitals && (
                                    <p className="mt-2 text-gray-600">
                                        BP {visit.vitals.bloodPressure ?? "N/A"} - HR{" "}
                                        {visit.vitals.heartRate ?? "N/A"} - Temp{" "}
                                        {visit.vitals.temperature ?? "N/A"} F
                                    </p>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-6">
                <h3 className="font-medium mb-2">Notes</h3>
                {patient.notes.length === 0 ? (
                    <p className="text-sm text-gray-400">No notes</p>
                ) : (
                    <ul className="space-y-2">
                        {patient.notes.map((note, index) => (
                            <li key={`${patient.id}-note-${index}`} className="text-sm bg-gray-100 p-2 rounded">
                                <div className="flex justify-between gap-3">
                                    <span className="font-medium">{note.type}</span>
                                    <span className="text-gray-500">
                                        {formatPatientDate(note.createdAt)}
                                    </span>
                                </div>
                                <p className="mt-1">{note.content}</p>
                                <p className="mt-1 text-xs text-gray-500">
                                    By {getDoctorName(note.doctorId, doctors)}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
