import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const SERVICE_ACCOUNT_PATH = new URL("../service-account-key.json", import.meta.url);

const USER_ROLES = {
    ADMIN: "ADMIN",
    DOCTOR: "DOCTOR",
    STAFF: "STAFF",
};

const USER_STATUS = {
    ACTIVE: "ACTIVE",
};

const users = [
    {
        id: "ADM-001",
        displayName: "Aarav Mehta",
        email: "aarav.mehta@medicore.example",
        password: "MediCore@123",
        role: USER_ROLES.ADMIN,
        status: USER_STATUS.ACTIVE,
    },
    {
        id: "DOC-001",
        displayName: "Dr. Kavita Menon",
        email: "kavita.menon@medicore.example",
        password: "MediCore@123",
        role: USER_ROLES.DOCTOR,
        status: USER_STATUS.ACTIVE,
    },
    {
        id: "DOC-002",
        displayName: "Dr. Rehan Suri",
        email: "rehan.suri@medicore.example",
        password: "MediCore@123",
        role: USER_ROLES.DOCTOR,
        status: USER_STATUS.ACTIVE,
    },
    {
        id: "DOC-003",
        displayName: "Dr. Melissa Hart",
        email: "melissa.hart@medicore.example",
        password: "MediCore@123",
        role: USER_ROLES.DOCTOR,
        status: USER_STATUS.ACTIVE,
    },
    {
        id: "DOC-004",
        displayName: "Dr. Nikhil Batra",
        email: "nikhil.batra@medicore.example",
        password: "MediCore@123",
        role: USER_ROLES.DOCTOR,
        status: USER_STATUS.ACTIVE,
    },
    {
        id: "DOC-005",
        displayName: "Dr. Arvind Narayanan",
        email: "arvind.narayanan@medicore.example",
        password: "MediCore@123",
        role: USER_ROLES.DOCTOR,
        status: USER_STATUS.ACTIVE,
    },
    {
        id: "DOC-006",
        displayName: "Dr. Leela Thomas",
        email: "leela.thomas@medicore.example",
        password: "MediCore@123",
        role: USER_ROLES.DOCTOR,
        status: USER_STATUS.ACTIVE,
    },
    {
        id: "DOC-007",
        displayName: "Dr. Hannah Price",
        email: "hannah.price@medicore.example",
        password: "MediCore@123",
        role: USER_ROLES.DOCTOR,
        status: USER_STATUS.ACTIVE,
    },
    {
        id: "DOC-008",
        displayName: "Dr. Bhavesh Shah",
        email: "bhavesh.shah@medicore.example",
        password: "MediCore@123",
        role: USER_ROLES.DOCTOR,
        status: USER_STATUS.ACTIVE,
    },
    {
        id: "DOC-009",
        displayName: "Dr. Priya Wallace",
        email: "priya.wallace@medicore.example",
        password: "MediCore@123",
        role: USER_ROLES.DOCTOR,
        status: USER_STATUS.ACTIVE,
    },
    {
        id: "DOC-010",
        displayName: "Dr. Ira Kapoor",
        email: "ira.kapoor@medicore.example",
        password: "MediCore@123",
        role: USER_ROLES.DOCTOR,
        status: USER_STATUS.ACTIVE,
    },
    {
        id: "DOC-011",
        displayName: "Dr. Robert Kim",
        email: "robert.kim@medicore.example",
        password: "MediCore@123",
        role: USER_ROLES.DOCTOR,
        status: USER_STATUS.ACTIVE,
    },
    {
        id: "DOC-012",
        displayName: "Dr. Amanda Lee",
        email: "amanda.lee@medicore.example",
        password: "MediCore@123",
        role: USER_ROLES.DOCTOR,
        status: USER_STATUS.ACTIVE,
    },
    {
        id: "DOC-013",
        displayName: "Dr. Shalini Deshpande",
        email: "shalini.deshpande@medicore.example",
        password: "MediCore@123",
        role: USER_ROLES.DOCTOR,
        status: USER_STATUS.ACTIVE,
    },
    {
        id: "DOC-014",
        displayName: "Dr. Samir Nasser",
        email: "samir.nasser@medicore.example",
        password: "MediCore@123",
        role: USER_ROLES.DOCTOR,
        status: USER_STATUS.ACTIVE,
    },
    {
        id: "DOC-015",
        displayName: "Dr. Elaine Wong",
        email: "elaine.wong@medicore.example",
        password: "MediCore@123",
        role: USER_ROLES.DOCTOR,
        status: USER_STATUS.ACTIVE,
    },
    {
        id: "DOC-016",
        displayName: "Dr. Elena Vargas",
        email: "elena.vargas@medicore.example",
        password: "MediCore@123",
        role: USER_ROLES.DOCTOR,
        status: USER_STATUS.ACTIVE,
    },
    {
        id: "DOC-017",
        displayName: "Dr. Aditi Sen",
        email: "aditi.sen@medicore.example",
        password: "MediCore@123",
        role: USER_ROLES.DOCTOR,
        status: USER_STATUS.ACTIVE,
    },
    {
        id: "DOC-018",
        displayName: "Dr. Nina Patel",
        email: "nina.patel@medicore.example",
        password: "MediCore@123",
        role: USER_ROLES.DOCTOR,
        status: USER_STATUS.ACTIVE,
    },
    {
        id: "STF-001",
        displayName: "Maya Iyer",
        email: "maya.iyer@medicore.example",
        password: "MediCore@123",
        role: USER_ROLES.STAFF,
        status: USER_STATUS.ACTIVE,
    },
    {
        id: "STF-002",
        displayName: "Jordan Blake",
        email: "jordan.blake@medicore.example",
        password: "MediCore@123",
        role: USER_ROLES.STAFF,
        status: USER_STATUS.ACTIVE,
    },
    {
        id: "STF-003",
        displayName: "Anika Rao",
        email: "anika.rao@medicore.example",
        password: "MediCore@123",
        role: USER_ROLES.STAFF,
        status: USER_STATUS.ACTIVE,
    },
];

async function readServiceAccount() {
    if (!existsSync(SERVICE_ACCOUNT_PATH)) {
        throw new Error("Missing service-account-key.json in the project root.");
    }

    return JSON.parse(await readFile(SERVICE_ACCOUNT_PATH, "utf8"));
}

async function upsertAuthUser(auth, user, password) {
    const userProperties = {
        email: user.email,
        password,
        displayName: user.displayName,
        emailVerified: true,
        disabled: user.status !== USER_STATUS.ACTIVE,
    };

    try {
        await auth.getUser(user.id);
        await auth.updateUser(user.id, userProperties);
        await auth.setCustomUserClaims(user.id, {
            role: user.role,
            appUserId: user.id,
        });
        console.log(`Updated ${user.id} (${user.email})`);
    } catch (error) {
        if (error.code !== "auth/user-not-found") {
            throw error;
        }

        await auth.createUser({
            uid: user.id,
            ...userProperties,
        });
        await auth.setCustomUserClaims(user.id, {
            role: user.role,
            appUserId: user.id,
        });
        console.log(`Created ${user.id} (${user.email})`);
    }
}

async function main() {
    const serviceAccount = await readServiceAccount();

    if (!getApps().length) {
        initializeApp({
            credential: cert(serviceAccount),
        });
    }

    const auth = getAuth();

    for (const user of users) {
        await upsertAuthUser(auth, user, user.password);
    }

    console.log(`Seeded ${users.length} verified auth users.`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
