import React from "react";

type Props = {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    card?: boolean;
    divider?: boolean;
};

const PageHeader: React.FC<Props> = ({ title, subtitle, action, card = false, divider = false }) => {
    const inner = (
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-1 h-7 rounded-full bg-primary flex-shrink-0" />
                <div>
                    <h1 className="text-lg font-semibold text-gray-900 leading-tight">{title}</h1>
                    {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
                </div>
            </div>
            {action && <div>{action}</div>}
        </div>
    );

    if (card) {
        return (
            <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-3 shadow-sm">
                {inner}
            </div>
        );
    }

    return (
        <div className={divider ? "pb-3 mb-3 border-b border-gray-100" : "mb-2"}>
            {inner}
        </div>
    );
};

export default PageHeader;
