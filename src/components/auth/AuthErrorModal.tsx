import { AlertTriangle, Info } from "lucide-react";
import type { AuthErrorDetails } from "../../services/auth-service";
import CloseButton from "../ui/CloseButton";

type Props = {
    error: AuthErrorDetails;
    onClose: () => void;
};

export default function AuthErrorModal({ error, onClose }: Props) {
    const isWarning = error.variant === "warning";

    return (
        <div
            className="fixed inset-0 z-80 grid place-items-center bg-gray-950/45 px-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-error-title"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span
                            className={`grid h-11 w-11 place-items-center rounded-full ${isWarning
                                ? "bg-amber-50 text-amber-700"
                                : "bg-red-50 text-red-700"
                                }`}
                        >
                            {isWarning ? (
                                <Info className="h-5 w-5" />
                            ) : (
                                <AlertTriangle className="h-5 w-5" />
                            )}
                        </span>
                        <div>
                            <h2
                                id="auth-error-title"
                                className="text-xl font-semibold text-gray-950"
                            >
                                {error.title}
                            </h2>
                            <p className="text-sm text-gray-500">
                                Authentication could not continue.
                            </p>
                        </div>
                    </div>

                    <CloseButton
                        onClick={onClose}
                        label="Close authentication error dialog"
                    />
                </div>

                <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
                    {error.message}
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="mt-6 w-full cursor-pointer rounded-md bg-[#0b1f4d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#102a63] active:scale-[0.98]"
                >
                    {error.actionLabel}
                </button>
            </div>
        </div>
    );
}
