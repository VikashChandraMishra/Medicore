import type { UserRole, UserStatus } from "../constants/user";

export interface User {
    id: string;

    displayName: string;
    email: string;
    password: string;

    role: UserRole;
    status: UserStatus;

    createdAt: Date;
    updatedAt: Date;
}
