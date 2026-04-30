import { USER_ROLES, USER_STATUS } from "../constants/user";
import type { User } from "../types/user";

const date = (value: string) => new Date(value);

export const mockStaff: User[] = [
    {
        id: "STF-001",
        displayName: "Maya Iyer",
        email: "maya.iyer@medicore.example",
        password: "MediCore@123",
        role: USER_ROLES.STAFF,
        status: USER_STATUS.ACTIVE,
        createdAt: date("2024-03-08T09:00:00+05:30"),
        updatedAt: date("2026-04-20T10:15:00+05:30"),
    },
    {
        id: "STF-002",
        displayName: "Jordan Blake",
        email: "jordan.blake@medicore.example",
        password: "MediCore@123",
        role: USER_ROLES.STAFF,
        status: USER_STATUS.ACTIVE,
        createdAt: date("2024-06-17T08:30:00-05:00"),
        updatedAt: date("2026-04-12T14:25:00-05:00"),
    },
    {
        id: "STF-003",
        displayName: "Anika Rao",
        email: "anika.rao@medicore.example",
        password: "MediCore@123",
        role: USER_ROLES.STAFF,
        status: USER_STATUS.ACTIVE,
        createdAt: date("2025-01-10T11:20:00+05:30"),
        updatedAt: date("2026-04-24T16:05:00+05:30"),
    },
];
