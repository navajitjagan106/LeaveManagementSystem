import React from "react";

type Props = {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
};

const PageHeader: React.FC<Props> = ({ title, subtitle, action }) => {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 shadow-sm">
            
            <div className="flex justify-between items-center">

                {/* Left */}
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        {title}
                    </h1>

                    {subtitle && (
                        <p className="text-sm text-gray-500 mt-1">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Right */}
                {action && (
                    <div>
                        {action}
                    </div>
                )}
            </div>

        </div>
    );
};

export default PageHeader;