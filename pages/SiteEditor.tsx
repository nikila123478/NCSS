import React, { useState, useEffect } from 'react';
import { Save, Image as ImageIcon, Trash2, Layout, Type, Upload, Loader2, X, Link as LinkIcon, Plus } from 'lucide-react';
import { db, storage } from '../utils/firebase';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface SiteOptions {
    heroTitle: string;
    heroSubtitle: string;
    heroImages: string[];
    missionTitle: string;
    missionText: string;
    visionTitle: string;
    visionText: string;
    aboutText: string;
    aboutImages: string[];
}

interface FooterOptions {
    aboutText: string;
    socialLinks: { id: string; name: string; url: string }[];
}

const SiteEditor: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'hero' | 'content' | 'footer'>('hero');

    // Home Page State
    const [form, setForm] = useState<SiteOptions>({
        heroTitle: "EXPLORE THE UNIVERSE",
        heroSubtitle: "Join the NCSS on a journey through space, science, and innovation. We are the future of exploration.",
        heroImages: [
            "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1446776811953-ad5497f3581a?q=80&w=2072&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?q=80&w=2072&auto=format&fit=crop"
        ],
        missionTitle: "Our Mission",
        missionText: "To inspire the next generation of scientists and explorers through practical education and immersive experiences.",
        visionTitle: "Our Vision",
        visionText: "A world where scientific literacy is universal and space exploration is accessible to all.",
        aboutText: "NCSS is dedicated to fostering curiosity and innovation in the field of space exploration.",
        aboutImages: []
    });

    // Footer State
    const [footerForm, setFooterForm] = useState<FooterOptions>({
        aboutText: "Advancing humanity through the exploration of the cosmos. Join the Next-Gen Cosmos Science Society today.",
        socialLinks: [
            { id: '1', name: 'Twitter', url: '#' },
            { id: '2', name: 'Instagram', url: '#' },
            { id: '3', name: 'LinkedIn', url: '#' },
        ]
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    // New Image Handling
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [newImageUrl, setNewImageUrl] = useState(''); // Fallback for URL input

    // Fetch Settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Fetch Home Settings
                const homeDocRef = doc(db, 'settings', 'homepage');
                const homeSnap = await getDoc(homeDocRef);
                if (homeSnap.exists()) {
                    setForm(homeSnap.data() as SiteOptions);
                } else {
                    await setDoc(homeDocRef, form);
                }

                // Fetch Footer Settings
                const footerDocRef = doc(db, 'site_config', 'footer_data');
                const footerSnap = await getDoc(footerDocRef);
                if (footerSnap.exists()) {
                    setFooterForm(footerSnap.data() as FooterOptions);
                } else {
                    await setDoc(footerDocRef, footerForm);
                }

            } catch (error) {
                console.error("Error fetching settings:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save based on Active Tab or Save All? Let's Save All to be safe and simple.
            await setDoc(doc(db, 'settings', 'homepage'), form);
            await setDoc(doc(db, 'site_config', 'footer_data'), footerForm);
            alert('Changes saved successfully!');
        } catch (error) {
            console.error("Error saving settings:", error);
            alert('Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleAddImage = async () => {
        if (imageFile) {
            setUploading(true);
            try {
                const storageRef = ref(storage, `site_assets/hero_${Date.now()}_${imageFile.name}`);
                await uploadBytes(storageRef, imageFile);
                const downloadUrl = await getDownloadURL(storageRef);

                setForm(prev => ({ ...prev, heroImages: [...prev.heroImages, downloadUrl] }));
                setImageFile(null);
            } catch (error) {
                console.error("Error uploading image:", error);
                alert("Failed to upload image.");
            } finally {
                setUploading(false);
            }
        } else if (newImageUrl) {
            setForm(prev => ({ ...prev, heroImages: [...prev.heroImages, newImageUrl] }));
            setNewImageUrl('');
        }
    };

    const handleDeleteImage = (index: number) => {
        const updatedImages = form.heroImages.filter((_, i) => i !== index);
        setForm({ ...form, heroImages: updatedImages });
    };

    // Social Link Handlers
    const addSocialLink = () => {
        const newLink = { id: Date.now().toString(), name: 'New Platform', url: 'https://' };
        setFooterForm(prev => ({ ...prev, socialLinks: [...prev.socialLinks, newLink] }));
    };

    const updateSocialLink = (id: string, field: 'name' | 'url', value: string) => {
        setFooterForm(prev => ({
            ...prev,
            socialLinks: prev.socialLinks.map(l => l.id === id ? { ...l, [field]: value } : l)
        }));
    };

    const removeSocialLink = (id: string) => {
        setFooterForm(prev => ({
            ...prev,
            socialLinks: prev.socialLinks.filter(l => l.id !== id)
        }));
    };

    if (loading) return <div className="p-8 text-center">Loading editor...</div>;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-gray-900">Site Editor</h2>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save Changes
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
                <div className="flex border-b border-gray-100 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('hero')}
                        className={`px-8 py-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'hero' ? 'border-red-600 text-red-600 bg-red-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                    >
                        <ImageIcon className="w-4 h-4" /> Hero Slider
                    </button>
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`px-8 py-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'content' ? 'border-red-600 text-red-600 bg-red-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Type className="w-4 h-4" /> Text Content
                    </button>
                    <button
                        onClick={() => setActiveTab('footer')}
                        className={`px-8 py-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'footer' ? 'border-red-600 text-red-600 bg-red-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Layout className="w-4 h-4" /> Footer Settings
                    </button>
                </div>

                <div className="p-8">
                    {activeTab === 'hero' && (
                        <div className="space-y-8">
                            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end bg-gray-50 p-6 rounded-xl border border-gray-100">
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Upload New Slide</label>
                                    <div className="flex gap-2">
                                        <label className="flex-1 cursor-pointer">
                                            <div className="w-full p-3 bg-white border border-gray-200 border-dashed rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                                                <Upload className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-500 truncate">{imageFile ? imageFile.name : "Choose File..."}</span>
                                            </div>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} />
                                        </label>
                                        {imageFile && (
                                            <button onClick={() => setImageFile(null)} className="p-3 bg-red-100 text-red-600 rounded-lg">
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="text-center font-bold text-gray-400 text-sm py-3">OR</div>
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Paste Image URL</label>
                                    <input
                                        type="text"
                                        placeholder="https://..."
                                        value={newImageUrl}
                                        onChange={e => setNewImageUrl(e.target.value)}
                                        className="w-full p-3 bg-white border border-gray-200 rounded-lg"
                                    />
                                </div>

                                <button
                                    onClick={handleAddImage}
                                    disabled={uploading || (!imageFile && !newImageUrl)}
                                    className="px-6 py-3 bg-black text-white font-bold rounded-lg disabled:opacity-50 flex items-center gap-2"
                                >
                                    {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Add Slide
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {form.heroImages.map((img, idx) => (
                                    <div key={idx} className="group relative aspect-video rounded-xl overflow-hidden shadow-md bg-gray-100">
                                        <img src={img} alt={`Hero ${idx}`} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                onClick={() => handleDeleteImage(idx)}
                                                className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg transform hover:scale-110 transition-all"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                            Slide {idx + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'content' && (
                        <div className="space-y-6 max-w-3xl">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Hero Main Title</label>
                                <input
                                    type="text"
                                    value={form.heroTitle}
                                    onChange={e => setForm({ ...form, heroTitle: e.target.value })}
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg font-bold text-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Hero Subtitle</label>
                                <textarea
                                    rows={3}
                                    value={form.heroSubtitle}
                                    onChange={e => setForm({ ...form, heroSubtitle: e.target.value })}
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Mission Title</label>
                                    <input
                                        type="text"
                                        value={form.missionTitle}
                                        onChange={e => setForm({ ...form, missionTitle: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg mb-2"
                                    />
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Mission Text</label>
                                    <textarea
                                        rows={4}
                                        value={form.missionText}
                                        onChange={e => setForm({ ...form, missionText: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Vision Title</label>
                                    <input
                                        type="text"
                                        value={form.visionTitle}
                                        onChange={e => setForm({ ...form, visionTitle: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg mb-2"
                                    />
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Vision Text</label>
                                    <textarea
                                        rows={4}
                                        value={form.visionText}
                                        onChange={e => setForm({ ...form, visionText: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                    />
                                </div>
                            </div>

                            <div className="pt-8 border-t border-gray-100">
                                <h3 className="text-xl font-bold text-gray-900 mb-6">About Us Section</h3>

                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">About Us Description</label>
                                    <textarea
                                        rows={4}
                                        value={form.aboutText}
                                        onChange={e => setForm({ ...form, aboutText: e.target.value })}
                                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">About Us Images (Slider)</label>
                                    <div className="flex gap-2 mb-4">
                                        <input
                                            type="text"
                                            placeholder="Add Image URL"
                                            value={newImageUrl}
                                            onChange={e => setNewImageUrl(e.target.value)}
                                            className="flex-1 p-3 bg-white border border-gray-200 rounded-lg"
                                        />
                                        <button
                                            onClick={() => {
                                                if (newImageUrl) {
                                                    setForm({ ...form, aboutImages: [...(form.aboutImages || []), newImageUrl] });
                                                    setNewImageUrl('');
                                                }
                                            }}
                                            className="px-4 py-2 bg-black text-white font-bold rounded-lg"
                                        >
                                            Add
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {/* Use form.aboutImages with fallback to prevent crash */}
                                        {(form.aboutImages || []).map((img, i) => (
                                            <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                                                <img src={img} alt="About" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => setForm({ ...form, aboutImages: form.aboutImages.filter((_, idx) => idx !== i) })}
                                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'footer' && (
                        <div className="space-y-8 max-w-3xl animate-fade-in">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4">About Footer</h3>
                                <label className="block text-sm font-bold text-gray-500 uppercase mb-2">About Text / Bio</label>
                                <textarea
                                    rows={3}
                                    placeholder="Describe your organization..."
                                    value={footerForm.aboutText}
                                    onChange={e => setFooterForm({ ...footerForm, aboutText: e.target.value })}
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                                />
                                <p className="text-xs text-gray-400 mt-2">This text appears under the logo in the footer.</p>
                            </div>

                            <div className="pt-8 border-t border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-900">Social Media Links</h3>
                                    <button
                                        onClick={addSocialLink}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm"
                                    >
                                        <Plus className="w-4 h-4" /> Add Link
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {footerForm.socialLinks.map((link) => (
                                        <div key={link.id} className="flex gap-3 items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <div className="p-2 bg-white rounded-lg border border-gray-200 text-gray-400">
                                                <LinkIcon className="w-4 h-4" />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Platform Name (e.g. GitHub)"
                                                value={link.name}
                                                onChange={e => updateSocialLink(link.id, 'name', e.target.value)}
                                                className="w-1/3 p-2 bg-white border border-gray-200 rounded-lg text-sm font-bold"
                                            />
                                            <input
                                                type="text"
                                                placeholder="URL (https://...)"
                                                value={link.url}
                                                onChange={e => updateSocialLink(link.id, 'url', e.target.value)}
                                                className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600"
                                            />
                                            <button
                                                onClick={() => removeSocialLink(link.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {footerForm.socialLinks.length === 0 && (
                                        <div className="text-center py-8 text-gray-400 italic bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                            No social links added yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SiteEditor;