import { createContext } from "react";
import type { Patient } from "../types/patient";
import type { User } from "../types/user";

export type AppDataContextValue = {
    admins: User[];
    doctors: User[];
    patients: Patient[];
    staff: User[];
    users: User[];
    loading: boolean;
};

export const AppDataContext = createContext<AppDataContextValue | null>(null);
