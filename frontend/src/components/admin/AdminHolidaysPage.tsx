import PageHeader from "../common/PageHeader";
import HolidaySection from "./sections/HolidaySection";

const AdminHolidaysPage = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <PageHeader title="Holidays" subtitle="Add and remove company holidays" divider />
        <HolidaySection />
    </div>
);

export default AdminHolidaysPage;
