import { mockAdmins } from "./admins";
import { mockDoctors } from "./doctors";
import { mockStaff } from "./staff";

export const mockUsers = [...mockAdmins, ...mockDoctors, ...mockStaff];

export function isAdminEmail(email?: string | null) {
    return mockAdmins.some((admin) => admin.email === email);
}
