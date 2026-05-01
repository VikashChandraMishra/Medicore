import { ChevronLeft, ChevronRight } from "lucide-react";
import { THEME } from "../../constants/theme";

type PatientPaginationProps = {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    summary?: string;
    variant?: "numbered" | "compact";
};

export default function PatientPagination({
    currentPage,
    totalPages,
    onPageChange,
    summary,
    variant = "numbered",
}: PatientPaginationProps) {
    const goToPreviousPage = () => onPageChange(Math.max(1, currentPage - 1));
    const goToNextPage = () => onPageChange(Math.min(totalPages, currentPage + 1));

    if (variant === "compact") {
        return (
            <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
                <div className="ml-auto flex items-center gap-2">
                    <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className={`cursor-pointer rounded-full border border-gray-200 px-4 py-2 font-medium text-gray-700 transition ${THEME.HOVER_BACKGROUND} active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                        Previous
                    </button>
                    <span className="rounded-full bg-gray-100 px-3 py-2 text-gray-700">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className={`cursor-pointer rounded-full border border-gray-200 px-4 py-2 font-medium text-gray-700 transition ${THEME.HOVER_BACKGROUND} active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-6 grid gap-3 text-sm text-gray-600 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <p>{summary}</p>
            <div className="flex items-center justify-center gap-2">
                <button
                    type="button"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className={`grid h-10 w-10 cursor-pointer place-items-center rounded-md border border-gray-200 bg-white text-gray-600 transition ${THEME.HOVER_BACKGROUND} active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40`}
                    aria-label="Previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }).map((_, index) => {
                    const page = index + 1;

                    return (
                        <button
                            key={page}
                            type="button"
                            onClick={() => onPageChange(page)}
                            className={`h-10 min-w-10 cursor-pointer rounded-md border px-3 font-medium transition active:scale-[0.98] ${currentPage === page
                                ? "border-[#0b1f4d] bg-[#0b1f4d] text-white"
                                : `border-gray-200 bg-white text-gray-700 ${THEME.HOVER_BACKGROUND}`
                                }`}
                        >
                            {page}
                        </button>
                    );
                })}
                <button
                    type="button"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className={`grid h-10 w-10 cursor-pointer place-items-center rounded-md border border-gray-200 bg-white text-gray-600 transition ${THEME.HOVER_BACKGROUND} active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40`}
                    aria-label="Next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
            <div />
        </div>
    );
}
