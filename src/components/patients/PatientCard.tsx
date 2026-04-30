type Props = {
    patient: {
        name: string;
        age: number;
        condition: string;
    };
};

export default function PatientCard({ patient }: Props) {
    return (
        <div className="p-6 bg-white rounded-xl border">
            <h3 className="font-semibold text-lg mb-2">{patient.name}</h3>
            <p className="text-sm text-gray-600">Age: {patient.age}</p>
            <p className="text-sm text-gray-600">
                Condition: {patient.condition}
            </p>
        </div>
    );
}
