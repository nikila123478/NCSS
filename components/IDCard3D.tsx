import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { IDCard } from '../types';

interface IDCard3DProps {
    card: IDCard;
    className?: string;
    isFlipped?: boolean;
    onFlip?: () => void;
    mode?: '3d' | 'static-front' | 'static-back'; // New Prop for Static Rendering
}

const IDCard3D: React.FC<IDCard3DProps> = ({ card, className = '', isFlipped: controlledFlipped, onFlip, mode = '3d' }) => {
    const [internalFlipped, setInternalFlipped] = useState(false);
    const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;

    const handleFlip = () => {
        if (mode !== '3d') return; // Disable flip in static modes
        if (onFlip) {
            onFlip();
        } else {
            setInternalFlipped(!internalFlipped);
        }
    };

    const verificationUrl = `${window.location.origin}/#/verify-id/${card.uid}`;

    // DNA Pattern SVG
    const dnaPattern = encodeURIComponent(`
      <svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'>
          <path d='M10,0 Q50,50 10,100 M90,0 Q50,50 90,100' stroke='#D90429' fill='none' stroke-width='0.5' opacity='0.08'/>
          <circle cx='30' cy='25' r='1.5' fill='#D90429' opacity='0.1'/>
          <circle cx='70' cy='75' r='1.5' fill='#D90429' opacity='0.1'/>
      </svg>
  `);

    const bgStyle = {
        backgroundImage: `url("data:image/svg+xml,${dnaPattern}")`
    };

    // Reusable Face Content
    const FrontFace = () => (
        <div className="w-full h-full relative overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col border border-gray-200">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0" style={bgStyle} />

            {/* Header */}
            <div className="relative z-10 bg-gradient-to-r from-[#8B0000] to-[#D90429] h-28 clip-path-header flex items-center px-4 shadow-md">
                <div className="bg-white p-1 rounded-full shadow-lg mr-3 shrink-0">
                    <img
                        src="https://i.postimg.cc/Qtzp5v4x/ncss_crest_Nalanda_College_Science_Society_300x300_removebg_preview.png"
                        alt="NCSS"
                        className="w-12 h-12 object-contain"
                    />
                </div>
                <div>
                    <h1 className="text-white text-[12px] font-black tracking-widest leading-tight">NALANDA COLLEGE<br />SCIENCE SOCIETY</h1>
                    <p className="text-white/80 text-[9px] italic font-serif mt-1">"{card.motto || "Adhipathi Vidya Labha"}"</p>
                </div>
            </div>

            {/* Profile Section */}
            <div className="relative z-10 flex flex-col items-center mt-6 px-4">
                {/* Photo */}
                <div className="w-36 h-36 rounded-full p-1 bg-gradient-to-br from-[#D90429] to-red-900 shadow-xl mb-4">
                    <img
                        src={card.profileImage}
                        alt={card.fullName}
                        className="w-full h-full rounded-full object-cover border-2 border-white bg-white"
                    />
                </div>

                {/* Details */}
                <h2 className="text-2xl font-bold text-gray-900 uppercase text-center font-outfit leading-none mb-1">
                    {card.fullName}
                </h2>
                <p className="text-[#D90429] font-bold text-sm uppercase tracking-widest mb-4">
                    {card.position}
                </p>

                {/* ID & Dates Table */}
                <div className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 grid grid-cols-2 gap-y-2 text-[10px] uppercase font-bold text-gray-500 text-center">
                    <div>
                        <span className="block text-[#D90429] text-[8px]">Mem ID</span>
                        <span className="text-gray-900 text-xs">{card.memberId}</span>
                    </div>
                    <div>
                        <span className="block text-[#D90429] text-[8px]">Batch</span>
                        <span className="text-gray-900 text-xs">{card.batch || "2025"}</span>
                    </div>
                    <div>
                        <span className="block text-[#D90429] text-[8px]">Issued</span>
                        <span className="text-gray-900">{card.issuedDate || "JAN 2025"}</span>
                    </div>
                    <div>
                        <span className="block text-[#D90429] text-[8px]">Expires</span>
                        <span className="text-gray-900">{card.expiryDate || "DEC 2026"}</span>
                    </div>
                </div>
            </div>

            {/* Footer / Signature / Barcode */}
            <div className="mt-auto mb-4 px-6 flex justify-between items-end relative z-10">
                <div className="text-center">
                    <div className="font-cursive text-xl text-gray-800 -rotate-6 opacity-80 leading-none">
                        {card.secretaryName || "J.Doe"}
                    </div>
                    <div className="h-px w-20 bg-gray-400 mt-1"></div>
                    <p className="text-[8px] text-gray-500 uppercase mt-0.5">Secretary</p>
                </div>

                <div className="flex flex-col items-end">
                    {/* CSS Barcode Strip */}
                    <div className="h-6 flex items-end gap-[2px] opacity-70">
                        {[...Array(15)].map((_, i) => (
                            <div key={i} className={`h-full w-[2px] bg-black ${i % 2 === 0 ? 'w-[1px]' : 'w-[3px]'}`}></div>
                        ))}
                    </div>
                    <p className="text-[8px] text-gray-400 mt-0.5">NCSS-SECURE</p>
                </div>
            </div>

            {/* Bottom Accent */}
            <div className="h-2 bg-[#D90429] w-full mt-auto"></div>
        </div>
    );

    const BackFace = () => (
        <div className="w-full h-full relative overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col border border-gray-200">
            <div className="absolute inset-0 z-0" style={bgStyle} />

            {/* Header */}
            <div className="h-16 bg-gray-900 flex items-center justify-center relative z-10">
                <h3 className="text-white text-sm font-bold tracking-[0.2em] uppercase">VERIFICATION</h3>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative z-10">

                {/* QR Code */}
                <div className="p-2 bg-white border-2 border-[#D90429] rounded-xl shadow-md mb-6 relative">
                    <div className="absolute -inset-1 border border-gray-200 rounded-xl -z-10"></div>
                    <QRCodeSVG
                        value={verificationUrl}
                        size={150}
                        fgColor="#000000"
                    />
                </div>

                <p className="text-xs text-gray-500 font-medium mb-6 max-w-[200px]">
                    Scan this QR code to verify the authenticity of this membership card via the NCSS Portal.
                </p>

                {/* Contact Details */}
                <div className="w-full bg-gray-50 p-4 rounded-xl border border-gray-200 text-left space-y-3 shadow-inner">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-[#D90429] font-bold text-xs border border-red-100">
                            @
                        </div>
                        <div>
                            <p className="text-[9px] text-gray-400 uppercase font-bold">Email</p>
                            <p className="text-xs font-bold text-gray-800 truncate">{card.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-[#D90429] font-bold text-xs border border-red-100">
                            #
                        </div>
                        <div>
                            <p className="text-[9px] text-gray-400 uppercase font-bold">Phone</p>
                            <p className="text-xs font-bold text-gray-800">{card.phone}</p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Footer */}
            <div className="bg-gray-100 py-3 text-center border-t border-gray-200 relative z-10">
                <p className="text-[9px] text-gray-400 uppercase tracking-wider">
                    Property of Nalanda College Science Society
                </p>
            </div>
        </div>
    );

    // --- RENDERING MODES ---

    if (mode === 'static-front') {
        return (
            <div className={`w-[320px] h-[500px] ${className}`}>
                <FrontFace />
            </div>
        );
    }

    if (mode === 'static-back') {
        return (
            <div className={`w-[320px] h-[500px] ${className}`}>
                <BackFace />
            </div>
        );
    }

    // DEFAULT 3D FLIP MODE
    return (
        <div
            className={`group w-[320px] h-[500px] perspective-1000 cursor-pointer ${className}`}
            onClick={handleFlip}
        >
            <div className={`relative w-full h-full duration-700 transform-style-3d transition-all ease-out ${isFlipped ? 'rotate-y-180' : ''}`}>

                {/* --- FRONT SIDE --- */}
                <div className="absolute w-full h-full backface-hidden">
                    <FrontFace />
                </div>

                {/* --- BACK SIDE --- */}
                <div className="absolute w-full h-full backface-hidden rotate-y-180">
                    <BackFace />
                </div>

            </div>
        </div>
    );
};

export default IDCard3D;
