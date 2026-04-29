import type { UserRole, UserStatus } from "../constants/user";

export interface User {
    uid: string;

    displayName: string;
    email: string;

    role: UserRole;
    status: UserStatus;

    createdAt: Date;
    updatedAt: Date;
}
