import type { ReactNode } from "react";

type DataTableProps = {
    columns: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    minWidthClassName?: string;
    maxHeightClassName?: string;
    outerClassName?: string;
    headerRowClassName?: string;
};

export default function DataTable({
    columns,
    children,
    footer,
    minWidthClassName = "min-w-160",
    maxHeightClassName = "max-h-126",
    outerClassName = "overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200",
    headerRowClassName = "border-y border-gray-100 text-xs font-medium text-gray-500",
}: DataTableProps) {
    return (
        <div className={outerClassName}>
            <div className={`${maxHeightClassName} overflow-auto`}>
                <table className={`w-full ${minWidthClassName} border-collapse text-left text-sm`}>
                    <thead className="sticky top-0 z-0 bg-white">
                        <tr className={headerRowClassName}>{columns}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">{children}</tbody>
                </table>
            </div>
            {footer}
        </div>
    );
}
