import { Gender, NoteType, PatientStatus, VisitType } from "../constants/patient";

export interface Address {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
}

export interface Vitals {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
}

export interface Insurance {
    provider: string;
    policyNumber: string;
    groupNumber: string;
    isActive: boolean;
    validUntil: Date;
}

export interface Patient {
    id: string;

    firstName: string;
    lastName: string;
    gender: Gender;
    dateOfBirth: Date;
    age: number;

    phone: string;
    email: string;
    address: Address;

    bloodGroup?: string;
    insurance: Insurance;
    allergies: string[];
    chronicConditions: string[];

    status: PatientStatus;

    lastVisitAt?: Date;
    createdAt: Date;
    updatedAt: Date;

    visits: Visit[];
    notes: Note[];
}

export interface Visit {
    patientId: string;

    date: Date;
    type: VisitType;

    doctorId: string;

    symptoms: string[];
    diagnosis?: string;
    prescription?: string;

    vitals?: Vitals;

    summary: string;

    createdAt: Date;
}

export interface Note {
    patientId: string;

    content: string;
    type: NoteType;

    doctorId: string;
    createdAt: Date;
}
