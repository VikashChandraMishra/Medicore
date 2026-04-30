type Props = {
    title: string;
    value: string;
};

export default function StatCard({ title, value }: Props) {
    return (
        <div className="p-6 bg-white rounded-xl border">
            <p className="text-sm text-gray-500 mb-2">{title}</p>
            <h3 className="text-2xl font-semibold">{value}</h3>
        </div>
    );
}
