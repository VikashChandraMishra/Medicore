import { useEffect, useMemo, useState, type ReactNode } from "react";
import { mockAdmins } from "../data/admins";
import { mockDoctors } from "../data/doctors";
import { mockPatients } from "../data/patients";
import { mockStaff } from "../data/staff";
import { AppDataContext } from "./data-context";

const DATA_LOAD_DELAY_MS = 1400;

type DataProviderProps = {
    children: ReactNode;
};

export default function DataProvider({ children }: DataProviderProps) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = window.setTimeout(() => setLoading(false), DATA_LOAD_DELAY_MS);
        return () => window.clearTimeout(timer);
    }, []);

    const value = useMemo(
        () => ({
            admins: mockAdmins,
            doctors: mockDoctors,
            patients: mockPatients,
            staff: mockStaff,
            users: [...mockAdmins, ...mockDoctors, ...mockStaff],
            loading,
        }),
        [loading],
    );

    return (
        <AppDataContext.Provider value={value}>
            {children}
        </AppDataContext.Provider>
    );
}
