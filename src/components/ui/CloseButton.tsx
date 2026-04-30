import { X } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type CloseButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    label: string;
};

export default function CloseButton({ label, className = "", ...props }: CloseButtonProps) {
    return (
        <button
            type="button"
            className={`grid h-9 w-9 cursor-pointer place-items-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 active:scale-[0.95] ${className}`}
            aria-label={label}
            {...props}
        >
            <X className="h-4 w-4" />
        </button>
    );
}
