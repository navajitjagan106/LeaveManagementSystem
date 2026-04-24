type FormFieldProps = {
    label: string;
    children: React.ReactNode;
};

const FormField: React.FC<FormFieldProps> = ({ label, children }) => {
    return (
        <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">{label}</label>
            {children}
        </div>
    );
};

export default FormField;