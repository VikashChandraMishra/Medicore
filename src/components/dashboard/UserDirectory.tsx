import { useMemo, useState } from "react";
import { USER_ROLES, USER_STATUS, type UserRole, type UserStatus } from "../../constants/user";
import { mockUsers } from "../../data/users";
import type { User } from "../../types/user";
import { getInitialsFromName } from "../../utils/initials";
import Badge, { type BadgeTone } from "../ui/Badge";
import DataTable from "../ui/DataTable";
import Input from "../ui/Input";
import Select from "../ui/Select";

type RoleFilter = UserRole | "all";
type StatusFilter = UserStatus | "all";
const PAGE_SIZE = 8;

const roleOptions = [
    { label: "All Roles", value: "all" },
    { label: "Admins", value: USER_ROLES.ADMIN },
    { label: "Doctors", value: USER_ROLES.DOCTOR },
    { label: "Staff", value: USER_ROLES.STAFF },
];

const statusOptions = [
    { label: "All Status", value: "all" },
    { label: "Active", value: USER_STATUS.ACTIVE },
    { label: "Inactive", value: USER_STATUS.INACTIVE },
    { label: "Suspended", value: USER_STATUS.SUSPENDED },
];

function formatLabel(value: string) {
    return value.charAt(0) + value.slice(1).toLowerCase();
}

function formatDate(date: Date) {
    return new Intl.DateTimeFormat("en", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
}

function getRoleTone(role: UserRole): BadgeTone {
    if (role === USER_ROLES.ADMIN) return "accent";
    if (role === USER_ROLES.DOCTOR) return "emerald";
    return "sky";
}

function getStatusTone(status: UserStatus): BadgeTone {
    if (status === USER_STATUS.ACTIVE) return "green";
    if (status === USER_STATUS.SUSPENDED) return "red";
    return "amber";
}

function getInitials(user: User) {
    return getInitialsFromName(user.displayName);
}

type UserDirectoryProps = {
    className?: string;
    embedded?: boolean;
};

export default function UserDirectory({ className = "", embedded = false }: UserDirectoryProps) {
    const [emailFilter, setEmailFilter] = useState("");
    const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const users = useMemo(
        () => {
            const email = emailFilter.trim().toLowerCase();

            return mockUsers.filter((user) => {
                const matchesEmail = !email || user.email.toLowerCase().includes(email);
                const matchesRole = roleFilter === "all" || user.role === roleFilter;
                const matchesStatus = statusFilter === "all" || user.status === statusFilter;

                return matchesEmail && matchesRole && matchesStatus;
            });
        },
        [emailFilter, roleFilter, statusFilter],
    );
    const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const pageStart = (safeCurrentPage - 1) * PAGE_SIZE;
    const paginatedUsers = users.slice(pageStart, pageStart + PAGE_SIZE);
    const visibleStart = users.length === 0 ? 0 : pageStart + 1;
    const visibleEnd = Math.min(pageStart + paginatedUsers.length, users.length);

    const updateEmailFilter = (value: string) => {
        setEmailFilter(value);
        setCurrentPage(1);
    };

    const updateRoleFilter = (value: RoleFilter) => {
        setRoleFilter(value);
        setCurrentPage(1);
    };

    const updateStatusFilter = (value: StatusFilter) => {
        setStatusFilter(value);
        setCurrentPage(1);
    };

    return (
        <section className={className}>
            <div className={embedded ? "" : "overflow-hidden rounded-lg border border-gray-200 bg-white"}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-950">Users</h2>
                        <p className="text-sm text-gray-500">All clinic accounts by role</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Input
                            type="email"
                            placeholder="Filter email..."
                            className="w-52 [&_input]:h-9 [&_input]:rounded-lg"
                            value={emailFilter}
                            onChange={(event) => updateEmailFilter(event.target.value)}
                        />
                        <Select
                            className="w-36 [&_button]:h-9 [&_button]:rounded-lg"
                            value={roleFilter}
                            options={roleOptions}
                            onValueChange={(value) => updateRoleFilter(value as RoleFilter)}
                            ariaLabel="Filter users by role"
                        />
                        <Select
                            className="w-36 [&_button]:h-9 [&_button]:rounded-lg"
                            value={statusFilter}
                            options={statusOptions}
                            onValueChange={(value) => updateStatusFilter(value as StatusFilter)}
                            ariaLabel="Filter users by status"
                        />
                    </div>
                </div>

                <DataTable
                    outerClassName="mx-5 mb-4 overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200"
                    headerRowClassName="border-b border-gray-100 text-xs font-medium text-gray-500"
                    columns={
                        <>
                            <th className="px-5 py-3">Sl.no.</th>
                            <th className="px-5 py-3">ID</th>
                            <th className="px-5 py-3">User</th>
                            <th className="px-5 py-3">Role</th>
                            <th className="px-5 py-3">Status</th>
                            <th className="px-5 py-3">Updated</th>
                        </>
                    }
                    footer={
                        <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
                            <p>Showing {visibleStart} to {visibleEnd} of {users.length} users</p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                    disabled={safeCurrentPage === 1}
                                    className="cursor-pointer rounded-full border border-gray-200 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Previous
                                </button>
                                <span className="rounded-full bg-gray-100 px-3 py-2 text-gray-700">
                                    {safeCurrentPage} / {totalPages}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                    disabled={safeCurrentPage === totalPages}
                                    className="cursor-pointer rounded-full border border-gray-200 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    }
                >
                    {paginatedUsers.map((user, index) => (
                        <tr key={user.id} className="transition hover:bg-gray-50">
                            <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                                {pageStart + index + 1}
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-700">
                                {user.id}
                            </td>
                            <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                                        {getInitials(user)}
                                    </span>
                                    <div>
                                        <p className="font-medium text-gray-950">
                                            {user.displayName}
                                        </p>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-5 py-4">
                                <Badge tone={getRoleTone(user.role)}>
                                    {formatLabel(user.role)}
                                </Badge>
                            </td>
                            <td className="px-5 py-4">
                                <Badge tone={getStatusTone(user.status)}>
                                    {formatLabel(user.status)}
                                </Badge>
                            </td>
                            <td className="px-5 py-4 text-gray-600">
                                {formatDate(user.updatedAt)}
                            </td>
                        </tr>
                    ))}
                </DataTable>
            </div>
        </section>
    );
}
