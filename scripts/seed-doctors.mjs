import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";
import admin from "firebase-admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const serviceAccountPath = path.join(rootDir, "service-account-key.json");
const doctorsEntry = path.join(rootDir, "src", "data", "doctors.ts");
const collectionsEntry = path.join(rootDir, "src", "constants", "collections.ts");
const tempDir = path.join(rootDir, "node_modules", ".tmp", "seed-doctors");
const defaultPassword = process.env.DOCTOR_DEFAULT_PASSWORD;

if (!existsSync(serviceAccountPath)) {
    throw new Error("Missing service-account-key.json in the project root.");
}

if (!defaultPassword || defaultPassword.length < 6) {
    throw new Error("Set DOCTOR_DEFAULT_PASSWORD to a password with at least 6 characters.");
}

const loadTsModule = async (entryPath, outfileName) => {
    await mkdir(tempDir, { recursive: true });

    const outfile = path.join(tempDir, `${outfileName}-${randomUUID()}.mjs`);

    await build({
        entryPoints: [entryPath],
        outfile,
        bundle: true,
        platform: "node",
        format: "esm",
        sourcemap: false,
        logLevel: "silent",
    });

    return import(pathToFileURL(outfile).href);
};

const getOrCreateAuthUser = async (doctor) => {
    try {
        const existingUser = await admin.auth().getUser(doctor.uid);

        return admin.auth().updateUser(existingUser.uid, {
            displayName: doctor.displayName,
            email: doctor.email,
            emailVerified: true,
            disabled: false,
            password: defaultPassword,
        });
    } catch (error) {
        if (error?.code !== "auth/user-not-found") {
            throw error;
        }

        return admin.auth().createUser({
            uid: doctor.uid,
            displayName: doctor.displayName,
            email: doctor.email,
            emailVerified: true,
            disabled: false,
            password: defaultPassword,
        });
    }
};

const seedDoctors = async () => {
    const [{ mockDoctors }, { COLLECTIONS }] = await Promise.all([
        loadTsModule(doctorsEntry, "doctors"),
        loadTsModule(collectionsEntry, "collections"),
    ]);
    const serviceAccount = await import(pathToFileURL(serviceAccountPath).href, {
        with: { type: "json" },
    });

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount.default),
    });

    const db = admin.firestore();

    for (const doctor of mockDoctors) {
        await getOrCreateAuthUser(doctor);

        await db.collection(COLLECTIONS.USERS).doc(doctor.uid).set(
            {
                uid: doctor.uid,
                displayName: doctor.displayName,
                email: doctor.email,
                role: doctor.role,
                status: doctor.status,
                createdAt: doctor.createdAt,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
        );

        console.log(`Seeded ${doctor.displayName} <${doctor.email}>`);
    }

    console.log(`Seeded ${mockDoctors.length} doctors.`);
};

try {
    await seedDoctors();
} finally {
    await rm(tempDir, { recursive: true, force: true });
}
