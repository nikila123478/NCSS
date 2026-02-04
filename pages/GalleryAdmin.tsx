import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Folder, Image as ImageIcon, ArrowLeft, Loader2, X } from 'lucide-react';
import { GalleryAlbum } from '../types';
import { db } from '../utils/firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';

const GalleryAdmin: React.FC = () => {
    // Local State
    const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
    const [loading, setLoading] = useState(true);

    const [view, setView] = useState<'ALBUMS' | 'IMAGES'>('ALBUMS');
    const [selectedAlbum, setSelectedAlbum] = useState<GalleryAlbum | null>(null);

    // Form States
    const [newAlbumName, setNewAlbumName] = useState('');
    const [saving, setSaving] = useState(false);
    const [newImageUrl, setNewImageUrl] = useState('');

    // Fetch Albums Realtime
    useEffect(() => {
        const q = collection(db, 'gallery_albums');
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const albumsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as GalleryAlbum[];
            setAlbums(albumsData);
            setLoading(false);

            // Sync selected album
            if (selectedAlbum) {
                const updated = albumsData.find(a => a.id === selectedAlbum.id);
                if (updated) setSelectedAlbum(updated);
            }
        });
        return () => unsubscribe();
    }, [selectedAlbum?.id]);

    const handleCreateAlbum = async () => {
        if (!newAlbumName.trim()) return;
        setSaving(true);
        try {
            await addDoc(collection(db, 'gallery_albums'), {
                name: newAlbumName,
                images: [],
                createdAt: serverTimestamp()
            });
            setNewAlbumName('');
        } catch (error) {
            console.error("Error creating album:", error);
            alert("Failed to create album.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAlbum = async (id: string) => {
        if (window.confirm("Delete this album completely?")) {
            try {
                await deleteDoc(doc(db, 'gallery_albums', id));
                if (selectedAlbum?.id === id) {
                    setSelectedAlbum(null);
                    setView('ALBUMS');
                }
            } catch (error) {
                console.error("Error deleting album:", error);
            }
        }
    };

    const handleOpenAlbum = (album: GalleryAlbum) => {
        setSelectedAlbum(album);
        setView('IMAGES');
    };

    const handleBack = () => {
        setSelectedAlbum(null);
        setView('ALBUMS');
        setNewImageUrl('');
    };

    const handleAddImage = async () => {
        if (!selectedAlbum || !newImageUrl.trim()) return;
        setSaving(true);
        try {
            // Update Firestore Doc directly with the string URL
            const albumRef = doc(db, 'gallery_albums', selectedAlbum.id);
            await updateDoc(albumRef, {
                images: arrayUnion(newImageUrl.trim())
            });

            setNewImageUrl('');
        } catch (error) {
            console.error("Error adding image:", error);
            alert("Failed to add image.");
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveImage = async (url: string) => {
        if (!selectedAlbum) return;
        if (window.confirm("Remove this image?")) {
            try {
                const albumRef = doc(db, 'gallery_albums', selectedAlbum.id);
                await updateDoc(albumRef, {
                    images: arrayRemove(url)
                });
            } catch (error) {
                console.error("Error removing image:", error);
                alert("Failed to remove image.");
            }
        }
    };

    return (
        <div className="space-y-8 animate-fade-in min-h-[600px]">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-gray-900">Gallery Management</h2>
                    <p className="text-gray-500">Organize media into albums.</p>
                </div>
                {view === 'IMAGES' && (
                    <button onClick={handleBack} className="px-4 py-2 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 flex items-center gap-2 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Albums
                    </button>
                )}
            </div>

            {/* --- VIEW: ALBUM LIST --- */}
            {view === 'ALBUMS' && (
                <div className="space-y-8">
                    {/* Create Album Input */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-end max-w-2xl">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Album Name</label>
                            <input
                                type="text"
                                value={newAlbumName}
                                onChange={(e) => setNewAlbumName(e.target.value)}
                                placeholder="e.g. Mars Mission 2024"
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
                            />
                        </div>
                        <button
                            onClick={handleCreateAlbum}
                            disabled={saving}
                            className="px-6 py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />} Create
                        </button>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {loading && <p className="col-span-full text-center text-gray-400">Loading albums...</p>}

                        {!loading && albums.length === 0 && (
                            <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No albums created.</p>
                            </div>
                        )}

                        {albums.map(album => (
                            <div key={album.id} className="group relative bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer" onClick={() => handleOpenAlbum(album)}>
                                <div className="aspect-square bg-red-50 rounded-lg flex items-center justify-center mb-4 text-red-200 group-hover:text-red-500 transition-colors relative overflow-hidden">
                                    {album.images && album.images.length > 0 ? (
                                        <img src={album.images[0]} className="w-full h-full object-cover" alt="cover" />
                                    ) : (
                                        <Folder className="w-16 h-16" />
                                    )}
                                </div>
                                <h3 className="font-bold text-gray-900 truncate">{album.name}</h3>
                                <p className="text-xs text-gray-400">{album.images?.length || 0} items</p>

                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteAlbum(album.id); }}
                                    className="absolute top-2 right-2 p-2 bg-white text-gray-400 rounded-full hover:text-red-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- VIEW: IMAGES IN ALBUM --- */}
            {view === 'IMAGES' && selectedAlbum && (
                <div className="space-y-8 animate-fade-in">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                        <Folder className="w-6 h-6 text-red-600" />
                        <h3 className="text-2xl font-bold text-gray-800">{selectedAlbum.name}</h3>
                    </div>

                    {/* Add Image Input */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Paste Photo URL</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newImageUrl}
                                    onChange={(e) => setNewImageUrl(e.target.value)}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleAddImage}
                            disabled={!newImageUrl.trim() || saving}
                            className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                            {saving ? "Adding..." : "Add Photo"}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {selectedAlbum.images && selectedAlbum.images.map((img, idx) => (
                            <div key={idx} className="group relative aspect-square bg-black rounded-xl overflow-hidden shadow-sm">
                                <img src={img} alt={`Album Item ${idx}`} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        onClick={() => handleRemoveImage(img)}
                                        className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg transform scale-90 hover:scale-110 transition-all"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {(!selectedAlbum.images || selectedAlbum.images.length === 0) && (
                            <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>This album is empty.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GalleryAdmin;