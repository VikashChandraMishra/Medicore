import { USER_ROLES, USER_STATUS } from "../constants/user";
import type { User } from "../types/user";

const date = (value: string) => new Date(value);

export const mockAdmins: User[] = [
    {
        id: "ADM-001",
        displayName: "Aarav Mehta",
        email: "aarav.mehta@medicore.example",
        role: USER_ROLES.ADMIN,
        status: USER_STATUS.ACTIVE,
        createdAt: date("2023-12-01T09:00:00+05:30"),
        updatedAt: date("2026-04-26T13:40:00+05:30"),
    },
];
