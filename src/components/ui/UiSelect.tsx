import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { THEME } from "../../constants/theme";

export type SelectOption = {
    label: string;
    value: string;
};

type SelectProps = {
    value: string;
    options: SelectOption[];
    onValueChange: (value: string) => void;
    className?: string;
    menuClassName?: string;
    ariaLabel?: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

export default function Select({
    value,
    options,
    onValueChange,
    className,
    menuClassName,
    ariaLabel,
}: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const selected = options.find((option) => option.value === value) ?? options[0];

    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handlePointerDown);
        return () => document.removeEventListener("mousedown", handlePointerDown);
    }, []);

    return (
        <div ref={rootRef} className={cn("relative", className)}>
            <button
                type="button"
                aria-label={ariaLabel}
                aria-expanded={isOpen}
                onClick={() => setIsOpen((open) => !open)}
                className={`flex h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-300 bg-white px-4 py-2 text-left text-sm text-gray-800 transition ${THEME.HOVER_BACKGROUND} active:scale-[0.99] focus-visible:border-[#0b1f4d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b1f4d]/10`}
            >
                <span className="truncate">{selected?.label}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
            </button>

            {isOpen && (
                <div
                    className={cn(
                        "absolute right-0 z-30 mt-2 max-h-72 w-full min-w-44 overflow-auto rounded-xl border border-gray-200 bg-white p-1 text-sm",
                        menuClassName,
                    )}
                >
                    {options.map((option) => {
                        const isSelected = option.value === value;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onValueChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-gray-100 active:scale-[0.99]",
                                    isSelected ? "text-gray-800" : "text-gray-500",
                                )}
                            >
                                <span className="grid h-4 w-4 place-items-center">
                                    {isSelected && <Check className="h-4 w-4" />}
                                </span>
                                <span className="truncate">{option.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
