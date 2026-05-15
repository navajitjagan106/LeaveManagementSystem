import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, Home, ArrowLeft } from "lucide-react";

const ForbiddenAccess: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-rose-50 rounded-3xl flex items-center justify-center mb-8 ring-8 ring-rose-50/50">
                <ShieldAlert size={48} className="text-rose-500 stroke-[1.5px]" />
            </div>

            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-4 uppercase">
                FORBIDDEN ACCESS
            </h1>
            
            <p className="text-lg text-gray-500 font-medium max-w-md mb-10 leading-relaxed">
                Sorry, you don't have access to this page. 
                <br />
                This profile is restricted or outside your permission scope.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
                <button
                    onClick={() => navigate("/")}
                    className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-primary/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                    <Home size={18} />
                    Click here to go home
                </button>
                
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-8 py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all active:scale-95"
                >
                    <ArrowLeft size={18} />
                    Go Back
                </button>
            </div>

            {/* Decorative background element */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none opacity-[0.03]">
                <ShieldAlert size={600} className="absolute -bottom-20 -right-20 rotate-12" />
            </div>
        </div>
    );
};

export default ForbiddenAccess;
