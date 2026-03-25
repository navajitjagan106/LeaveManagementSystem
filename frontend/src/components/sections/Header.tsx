import React from 'react';

interface HeaderProps {
    title: string;
}

const  Header: React.FC<HeaderProps> =()=> {
    return (
        <div className="h-14 bg-purple-600 flex items-center justify-between px-6 text-white">

            {/* Left */}
            <div className="flex items-center gap-4">
                <span className="font-semibold">Lumel Technologies</span>
                <input
                    className="bg-white text-black px-3 py-1 rounded-md text-sm w-72"
                    placeholder="Search..."
                />
            </div>

            {/* Right */}
            <div className="flex items-center gap-4">
                <span>🔔</span>
                <div className="w-8 h-8 rounded-full bg-white text-purple-600 flex items-center justify-center">
                    N
                </div>
            </div>
        </div>
    );
};

export default Header;