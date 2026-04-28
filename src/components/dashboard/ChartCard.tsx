type Props = {
    title: string;
};

export default function ChartCard({ title }: Props) {
    return (
        <div className="p-6 bg-white rounded-xl shadow-sm border h-64">
            <h3 className="font-semibold mb-4">{title}</h3>

            {/* Placeholder */}
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm border border-dashed rounded-md">
                Chart coming soon
            </div>
        </div>
    );
}
