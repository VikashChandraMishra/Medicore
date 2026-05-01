import { useEffect, useState } from "react";

const DEFAULT_LOADING_DELAY_MS = 1400;

export default function useSimulatedLoading(delay = DEFAULT_LOADING_DELAY_MS) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);

        const timer = window.setTimeout(() => setLoading(false), delay);
        return () => window.clearTimeout(timer);
    }, [delay]);

    return loading;
}
