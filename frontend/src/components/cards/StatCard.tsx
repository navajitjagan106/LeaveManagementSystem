import Card from "./Card";
type StatCardProps = {
    label: string;
    value: string | number;
};

const  StatCard: React.FC<StatCardProps> = ({ label, value }) => {
    return (
        <Card>
            <p className="text-sm text-gray-500 mb-2">{label}</p>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
        </Card>
    );
};

export default StatCard;