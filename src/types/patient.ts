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
    id: string;
    patientId: string;

    date: Date;
    type: VisitType;

    doctorName: string;

    symptoms: string[];
    diagnosis?: string;
    prescription?: string;

    vitals?: Vitals;

    summary: string;

    createdAt: Date;
}

export interface Note {
    id: string;
    patientId: string;

    content: string;
    type: NoteType;

    createdBy: string;
    createdAt: Date;
}
