import React from 'react';

interface LoaderProps {
    global?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ global = false }) => {
    const containerClass = global
        ? "fixed inset-0 z-50 bg-white/70 backdrop-blur-[3px] flex items-center justify-center overflow-hidden select-none"
        : "absolute inset-0 z-40 bg-white/60 backdrop-blur-[3px] flex items-center justify-center overflow-hidden select-none rounded-2xl";

    return (
        <div className={containerClass}>
            <div className="loader-wrapper">
                <div className="boxes">
                    <div className="box">
                        <div />
                        <div />
                        <div />
                        <div />
                    </div>
                    <div className="box">
                        <div />
                        <div />
                        <div />
                        <div />
                    </div>
                    <div className="box">
                        <div />
                        <div />
                        <div />
                        <div />
                    </div>
                    <div className="box">
                        <div />
                        <div />
                        <div />
                        <div />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Loader;
