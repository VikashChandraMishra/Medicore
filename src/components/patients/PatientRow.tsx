type Props = {
    patient: {
        name: string;
        age: number;
        condition: string;
    };
};

export default function PatientRow({ patient }: Props) {
    return (
        <div className="flex justify-between items-center px-6 py-4">
            <div>
                <p className="font-medium">{patient.name}</p>
                <p className="text-sm text-gray-500">
                    {patient.condition}
                </p>
            </div>

            <p className="text-sm text-gray-600">Age: {patient.age}</p>
        </div>
    );
}
