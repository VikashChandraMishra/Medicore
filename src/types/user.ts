import type { Department, UserRole, UserStatus } from "../constants/user";

export interface User {
    uid: string;

    displayName: string;
    email: string;
    phone?: string;

    role: UserRole;
    status: UserStatus;
    department: Department;

    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
}
