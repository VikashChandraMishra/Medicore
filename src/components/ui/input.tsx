import type { InputHTMLAttributes, ReactNode } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    leftIcon?: ReactNode;
};

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

export default function Input({ className, leftIcon, ...props }: InputProps) {
    return (
        <div className="relative">
            {leftIcon && (
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                    {leftIcon}
                </span>
            )}
            <input
                className={cn(
                    "flex h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-500",
                    "focus-visible:border-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/10",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    Boolean(leftIcon) && "pl-11",
                    className,
                )}
                {...props}
            />
        </div>
    );
}
