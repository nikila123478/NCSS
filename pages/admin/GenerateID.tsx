import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { db } from '../../utils/firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { IDCard } from '../../types';
import IDCard3D from '../../components/IDCard3D';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Loader, CheckCircle, Trash2, Edit, FileDown, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GenerateID = () => {
    const { currentUser } = useStore();
    const navigate = useNavigate();

    // Access States
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    // Page States
    const [generating, setGenerating] = useState(false);
    const [existingCard, setExistingCard] = useState<IDCard | null>(null);
    const [downloading, setDownloading] = useState(false);

    // Refs
    const printFrontRef = useRef<HTMLDivElement>(null);
    const printBackRef = useRef<HTMLDivElement>(null);

    // Form State
    const [formData, setFormData] = useState({
        profileImage: '',
        fullName: '',
        memberId: '',
        position: '',
        phone: '+94 ',
        email: '',
        motto: 'Adhipathi Vidya Labha',
        batch: '2025',
        issuedDate: 'JAN 2025',
        expiryDate: 'DEC 2026',
        secretaryName: 'J. Doe'
    });

    // --- GATEKEEPER LOGIC ---
    useEffect(() => {
        let isMounted = true;

        const checkAccess = async () => {
            if (!currentUser) {
                // Wait for auth to resolve or timeout
                // But if we are here, we likely have currentUser from useStore, unless it's null initially
                // We'll let the user linger for a second then kick if still no user
                if (isMounted) {
                    // If simply loading auth, do nothing yet. 
                    // If auth failed, we redirect. 
                    // For now, assume if no currentUser, we wait or it's handled by wrapper.
                }
                return;
            }

            // 1. Check Admin Privilege (Bypass)
            const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'MEMBER_ADMIN';

            // 2. Check Session Storage (Stability Fix)
            const isUnlocked = sessionStorage.getItem('id_access_unlocked') === 'true';

            if (isAdmin || isUnlocked) {
                // ACCESS GRANTED
                if (isMounted) setAuthorized(true);

                // Fetch ID Card Data
                try {
                    const docRef = doc(db, 'idCards', currentUser.id);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists() && isMounted) {
                        setExistingCard(docSnap.data() as IDCard);
                    }
                    // Pre-fill form
                    if (isMounted) {
                        setFormData(prev => ({
                            ...prev,
                            fullName: currentUser.name || '',
                            email: currentUser.email || ''
                        }));
                    }
                } catch (e) {
                    console.error("Error fetching card:", e);
                } finally {
                    if (isMounted) setLoading(false);
                }

            } else {
                // ACCESS DENIED
                console.warn("Unauthorized Access Attempt to ID Gen");
                // Show redirect message briefly then go
                if (isMounted) setLoading(false); // Stop spinner to show forbidden/redirecting
                setTimeout(() => navigate('/'), 1000);
            }
        };

        checkAccess();
        return () => { isMounted = false; };
    }, [currentUser, navigate]);


    // HANDLERS
    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !currentUser.id) return;

        setGenerating(true);
        try {
            const newCard: IDCard = {
                uid: currentUser.id,
                email: currentUser.email || formData.email,
                fullName: formData.fullName,
                memberId: formData.memberId,
                position: formData.position,
                profileImage: formData.profileImage,
                phone: formData.phone,
                generatedAt: new Date().toISOString(),
                motto: formData.motto,
                batch: formData.batch,
                issuedDate: formData.issuedDate,
                expiryDate: formData.expiryDate,
                secretaryName: formData.secretaryName
            };

            await setDoc(doc(db, 'idCards', currentUser.id), newCard);
            setExistingCard(newCard);
            alert("Success! ID Card Updated.");
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to save card.");
        } finally {
            setGenerating(false);
        }
    };

    const handleEdit = () => {
        if (!existingCard) return;
        setFormData({
            ...formData,
            ...existingCard,
            motto: existingCard.motto || formData.motto,
            batch: existingCard.batch || formData.batch,
            issuedDate: existingCard.issuedDate || formData.issuedDate,
            expiryDate: existingCard.expiryDate || formData.expiryDate,
            secretaryName: existingCard.secretaryName || formData.secretaryName
        });
        setExistingCard(null);
    };

    const handleDelete = async () => {
        if (!currentUser || !currentUser.id || !confirm("Are you sure? This will delete your ID.")) return;
        try {
            await deleteDoc(doc(db, 'idCards', currentUser.id));
            setExistingCard(null);
            setFormData(prev => ({ ...prev, memberId: '', position: 'Member' }));
        } catch (error) {
            console.error(error);
            alert("Delete failed.");
        }
    };

    const downloadSide = async (side: 'front' | 'back') => {
        const ref = side === 'front' ? printFrontRef.current : printBackRef.current;
        if (!ref || !existingCard) return;

        setDownloading(true);
        try {
            await new Promise(r => setTimeout(r, 500));
            const dataUrl = await htmlToImage.toPng(ref, { quality: 1.0, pixelRatio: 3, backgroundColor: '#ffffff' });
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            const imgProps = pdf.getImageProperties(dataUrl);
            const pdfWidth = 210;
            const pdfHeight = 297;
            const targetWidth = 100;
            const targetHeight = (imgProps.height * targetWidth) / imgProps.width;
            const x = (pdfWidth - targetWidth) / 2;
            const y = (pdfHeight - targetHeight) / 2;

            pdf.text(`NCSS OFFICIAL ID (${side.toUpperCase()})`, pdfWidth / 2, 30, { align: 'center' });
            pdf.addImage(dataUrl, 'PNG', x, y, targetWidth, targetHeight);
            pdf.save(`NCSS_ID_${existingCard.memberId}_${side}.pdf`);

        } catch (err) {
            console.error(err);
            alert("Download failed.");
        } finally {
            setDownloading(false);
        }
    };

    if (loading || !authorized) {
        return (
            <div className="flex justify-center items-center h-screen bg-black">
                <div className="flex flex-col items-center gap-4">
                    <Loader className="w-10 h-10 animate-spin text-[#D90429]" />
                    <p className="text-gray-400 text-sm tracking-widest uppercase">
                        {!authorized && !loading ? "Redirecting to Home..." : "Verifying Access..."}
                    </p>
                </div>
            </div>
        );
    }

    if (!currentUser) return <div className="p-10 text-white">Please log in.</div>;

    return (
        <div className="p-6 md:p-10 min-h-screen text-white bg-black relative">

            {/* HIDDEN CONTAINERS FOR SPLIT DOWNLOAD */}
            {existingCard && (
                <div style={{ position: 'fixed', top: '-10000px', left: '-10000px', opacity: 0 }}>
                    <div ref={printFrontRef} className="p-4 bg-white">
                        <IDCard3D card={existingCard} mode="static-front" />
                    </div>
                    <div ref={printBackRef} className="p-4 bg-white">
                        <IDCard3D card={existingCard} mode="static-back" />
                    </div>
                </div>
            )}

            <h1 className="text-3xl font-bold mb-8 text-white"><span className="text-[#D90429]">NCSS</span> ID Portal</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start max-w-7xl mx-auto">

                {/* FORM SECTION */}
                {!existingCard ? (
                    <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Edit className="w-5 h-5 text-[#D90429]" />
                            {formData.memberId ? "Edit Details" : "New Registration"}
                        </h2>
                        <form onSubmit={handleGenerate} className="space-y-4">
                            {/* Inputs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400">Profile Image URL</label>
                                    <input className="glass-input w-full p-3 rounded-lg bg-black/50 border border-white/10"
                                        type="url" name="profileImage" required
                                        value={formData.profileImage} onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400">Full Name</label>
                                    <input className="glass-input w-full p-3 rounded-lg bg-black/50 border border-white/10"
                                        type="text" name="fullName" required
                                        value={formData.fullName} onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400">Member ID</label>
                                    <input className="glass-input w-full p-3 rounded-lg bg-black/50 border border-white/10"
                                        type="text" name="memberId" required
                                        value={formData.memberId} onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400">Position</label>
                                    <input className="glass-input w-full p-3 rounded-lg bg-black/50 border border-white/10"
                                        type="text" name="position" required
                                        value={formData.position} onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400">Phone</label>
                                <input className="glass-input w-full p-3 rounded-lg bg-black/50 border border-white/10"
                                    type="tel" name="phone" required
                                    value={formData.phone} onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })} />
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <p className="text-xs font-bold text-[#D90429] mb-3 uppercase tracking-wider">Card Details (Editable)</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-400">Motto</label>
                                        <input className="w-full p-2 text-xs rounded bg-black/50 border border-white/10"
                                            type="text" name="motto" value={formData.motto} onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400">Batch</label>
                                        <input className="w-full p-2 text-xs rounded bg-black/50 border border-white/10"
                                            type="text" name="batch" value={formData.batch} onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400">Issued</label>
                                        <input className="w-full p-2 text-xs rounded bg-black/50 border border-white/10"
                                            type="text" name="issuedDate" value={formData.issuedDate} onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400">Expires</label>
                                        <input className="w-full p-2 text-xs rounded bg-black/50 border border-white/10"
                                            type="text" name="expiryDate" value={formData.expiryDate} onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs text-gray-400">Secretary Sign Name</label>
                                        <input className="w-full p-2 text-xs rounded bg-black/50 border border-white/10"
                                            type="text" name="secretaryName" value={formData.secretaryName} onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={generating}
                                className="w-full mt-4 bg-[#D90429] hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg disabled:opacity-50">
                                {generating ? "Processing..." : "Save ID Card"}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md text-center">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">ID Card Active</h2>
                        <p className="text-gray-400 text-sm mb-6">Verified Membership.</p>

                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => downloadSide('front')} disabled={downloading}
                                    className="flex flex-col items-center justify-center gap-2 bg-white text-black hover:bg-gray-200 font-bold py-4 rounded-xl transition-all shadow-lg disabled:opacity-50">
                                    {downloading ? <Loader className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
                                    <span className="text-xs">Download Front PDF</span>
                                </button>
                                <button onClick={() => downloadSide('back')} disabled={downloading}
                                    className="flex flex-col items-center justify-center gap-2 bg-white text-black hover:bg-gray-200 font-bold py-4 rounded-xl transition-all shadow-lg disabled:opacity-50">
                                    {downloading ? <Loader className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
                                    <span className="text-xs">Download Back PDF</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                                <button onClick={handleEdit}
                                    className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all border border-white/10">
                                    <Edit className="w-4 h-4" /> Edit
                                </button>
                                <button onClick={handleDelete}
                                    className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-3 rounded-xl transition-all border border-red-500/20">
                                    <Trash2 className="w-4 h-4" /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* PREVIEW */}
                <div className="flex flex-col items-center">
                    <p className="text-gray-500 text-xs mb-4 font-bold tracking-widest uppercase items-center flex gap-2">
                        <Lock className="w-3 h-3" /> Public Access Restricted
                    </p>
                    <div className="scale-90 md:scale-100 transition-transform">
                        <IDCard3D
                            card={existingCard || {
                                uid: currentUser.id,
                                email: currentUser.email || 'email@...',
                                fullName: formData.fullName || 'YOUR NAME',
                                memberId: formData.memberId || 'NCSS-000',
                                position: formData.position || 'MEMBER',
                                profileImage: formData.profileImage || 'https://via.placeholder.com/300',
                                phone: formData.phone || '+94...',
                                generatedAt: new Date().toISOString(),
                                motto: formData.motto,
                                batch: formData.batch,
                                issuedDate: formData.issuedDate,
                                expiryDate: formData.expiryDate,
                                secretaryName: formData.secretaryName
                            }}
                            mode="3d"
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default GenerateID;
