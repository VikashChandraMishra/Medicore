import { Activity, Stethoscope, Thermometer } from "lucide-react";
import type { Visit } from "../../types/patient";
import type { User } from "../../types/user";
import { formatPatientDate, getDoctorName } from "../../utils/patient-records";
import CloseButton from "../ui/CloseButton";

type VisitDetailsModalProps = {
    visit: Visit;
    doctors: User[];
    onClose: () => void;
};

export default function VisitDetailsModal({ visit, doctors, onClose }: VisitDetailsModalProps) {
    return (
        <div
            className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto px-3 py-4 sm:items-center sm:px-4"
            onClick={onClose}
        >
            <div
                className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm text-gray-500">
                            {formatPatientDate(visit.date)}
                        </p>
                        <h3 className="text-xl font-semibold text-gray-800">
                            {visit.type}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {getDoctorName(visit.doctorId, doctors)}
                        </p>
                    </div>
                    <CloseButton
                        onClick={onClose}
                        label="Close visit details"
                    />
                </div>

                <div className="space-y-4 text-sm">
                    <div>
                        <p className="font-medium text-gray-800">Summary</p>
                        <p className="mt-1 text-gray-600">{visit.summary}</p>
                    </div>

                    <div>
                        <p className="font-medium text-gray-800">Symptoms</p>
                        <p className="mt-1 text-gray-600">
                            {visit.symptoms.join(", ")}
                        </p>
                    </div>

                    {visit.diagnosis && (
                        <div>
                            <p className="font-medium text-gray-800">Diagnosis</p>
                            <p className="mt-1 text-gray-600">
                                {visit.diagnosis}
                            </p>
                        </div>
                    )}

                    {visit.prescription && (
                        <div>
                            <p className="font-medium text-gray-800">Prescription</p>
                            <p className="mt-1 text-gray-600">
                                {visit.prescription}
                            </p>
                        </div>
                    )}

                    {visit.vitals && (
                        <div>
                            <p className="font-medium text-gray-800">Vitals</p>
                            <div className="mt-2 grid gap-2 sm:grid-cols-3">
                                <div className="rounded-xl bg-gray-50 p-3">
                                    <p className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                                        <Stethoscope className="h-3.5 w-3.5" />
                                        Blood Pressure
                                    </p>
                                    <p className="font-medium text-gray-800">
                                        {visit.vitals.bloodPressure ?? "N/A"}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-gray-50 p-3">
                                    <p className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                                        <Activity className="h-3.5 w-3.5" />
                                        Heart Rate
                                    </p>
                                    <p className="font-medium text-gray-800">
                                        {visit.vitals.heartRate ?? "N/A"}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-gray-50 p-3">
                                    <p className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                                        <Thermometer className="h-3.5 w-3.5" />
                                        Temperature
                                    </p>
                                    <p className="font-medium text-gray-800">
                                        {visit.vitals.temperature ?? "N/A"} F
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <p className="text-xs text-gray-500">
                        Created {formatPatientDate(visit.createdAt)}
                    </p>
                </div>
            </div>
        </div>
    );
}
