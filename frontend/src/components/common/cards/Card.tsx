import React from "react";

type CardProps = { children: React.ReactNode; className?: string };

const Card: React.FC<CardProps> = ({ children, className = "" }) => (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${className}`}>
        {children}
    </div>
);

export default Card;
