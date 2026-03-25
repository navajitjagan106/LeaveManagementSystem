type Option = {
    label: string;
    value: string;
};

type RadioGroupProps = {
    name: string;
    value: string;
    options: Option[];
    onChange: (value: string) => void;
};

const RadioGroup: React.FC<RadioGroupProps> = ({
    name,
    value,
    options,
    onChange,
}) => {
    return (
        <div className="flex gap-4">
            {options.map((opt) => (
                <label key={opt.value} className="flex items-center">
                    <input
                        type="radio"
                        name={name}
                        value={opt.value}
                        checked={value === opt.value}
                        onChange={(e) => onChange(e.target.value)}
                        className="mr-2"
                    />
                    {opt.label}
                </label>
            ))}
        </div>
    );
};

export default RadioGroup;