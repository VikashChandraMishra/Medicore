import type { InputHTMLAttributes, ReactNode } from "react";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
    className?: string;
    inputClassName?: string;
    leftIcon?: ReactNode;
};

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

export default function Input({ className, inputClassName, leftIcon, ...props }: InputProps) {
    return (
        <div className={cn("relative", className)}>
            {leftIcon && (
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                    {leftIcon}
                </span>
            )}
            <input
                className={cn(
                    "flex h-12 w-full box-border items-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 transition-colors placeholder:text-gray-500",
                    "focus-visible:border-[#0b1f4d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b1f4d]/10",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    Boolean(leftIcon) && "pl-11",
                    inputClassName,
                )}
                {...props}
            />
        </div>
    );
}
