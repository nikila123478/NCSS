import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { GalleryAlbum } from '../types';
import { Folder, Image as ImageIcon, ArrowLeft, X } from 'lucide-react';

const Gallery: React.FC = () => {
    const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
    const [selectedAlbum, setSelectedAlbum] = useState<GalleryAlbum | null>(null);
    const [loading, setLoading] = useState(true);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    // Fetch Albums from Firestore
    useEffect(() => {
        const fetchAlbums = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'gallery_albums'));
                const albumsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as GalleryAlbum[];
                setAlbums(albumsData);
            } catch (error) {
                console.error("Error fetching albums: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAlbums();
    }, []);

    // --- ANIMATION VARIANTS ---
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 100 }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen live-red-bg text-white pt-24 pb-12 px-4 md:px-8 relative overflow-hidden">

            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-900/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">

                {/* HEADER */}
                <div className="mb-12 text-center">
                    <motion.h1
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-5xl md:text-6xl font-black mb-4 tracking-tighter"
                    >
                        COSMIC <span className="text-red-600">GALLERY</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-400 max-w-2xl mx-auto"
                    >
                        Explore the universe through our lens. From deep space nebulae to campus events.
                    </motion.p>
                </div>

                <AnimatePresence mode="wait">
                    {selectedAlbum === null ? (
                        /* --- VIEW 1: ALBUMS GRID --- */
                        <motion.div
                            key="albums-grid"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, x: -50 }}
                            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
                        >
                            {albums.length === 0 ? (
                                <div className="col-span-full py-20 text-center text-gray-500 border border-dashed border-gray-800 rounded-2xl bg-white/5 backdrop-blur-sm">
                                    <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p>No albums found. Check back later.</p>
                                </div>
                            ) : (
                                albums.map((album) => (
                                    <div
                                        key={album.id}
                                        onClick={() => setSelectedAlbum(album)}
                                        className="relative group w-full aspect-[4/3] flex items-center justify-center perspective-1000 cursor-pointer"
                                    >
                                        {/* --- 1. THE FANNING IMAGES (Behind the Glass) --- */}
                                        <div className="absolute inset-0 flex items-center justify-center z-0 mt-8">
                                            {/* Image Left */}
                                            <div className="absolute w-24 h-32 bg-gray-800 rounded-lg shadow-2xl overflow-hidden transform transition-all duration-500 origin-bottom group-hover:-translate-x-12 group-hover:-translate-y-10 group-hover:-rotate-12 border border-white/10">
                                                <img src={album.images?.[0] || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"} className="w-full h-full object-cover opacity-80" alt="Preview 1" />
                                            </div>
                                            {/* Image Right */}
                                            <div className="absolute w-24 h-32 bg-gray-800 rounded-lg shadow-2xl overflow-hidden transform transition-all duration-500 origin-bottom group-hover:translate-x-12 group-hover:-translate-y-10 group-hover:rotate-12 border border-white/10">
                                                <img src={album.images?.[1] || album.images?.[0] || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"} className="w-full h-full object-cover opacity-80" alt="Preview 2" />
                                            </div>
                                            {/* Image Center (Top) */}
                                            <div className="absolute w-28 h-36 bg-gray-900 rounded-lg shadow-2xl overflow-hidden transform transition-all duration-500 origin-bottom z-10 group-hover:-translate-y-16 border border-white/20">
                                                <img src={album.images?.[2] || album.images?.[0] || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"} className="w-full h-full object-cover" alt="Preview 3" />
                                            </div>
                                        </div>

                                        {/* --- 2. THE FRONT GLASS FOLDER --- */}
                                        <div className="absolute bottom-0 w-4/5 h-2/5 bg-gradient-to-t from-red-900/80 to-black/60 backdrop-blur-xl border-t border-white/20 rounded-t-2xl shadow-[0_-5px_20px_rgba(0,0,0,0.5)] z-20 flex flex-col items-center justify-center transition-all duration-300 group-hover:h-1/2">
                                            <Folder className="text-red-500 w-8 h-8 mb-1 drop-shadow-lg" />
                                            <h3 className="text-white font-bold text-lg tracking-wide drop-shadow-md">{album.name}</h3>
                                            <p className="text-xs text-gray-300">{album.images?.length || 0} Items</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>

                    ) : (
                        /* --- VIEW 2: IMAGE GRID (ALBUM DETAILS) --- */
                        <motion.div
                            key="album-details"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            className="space-y-8"
                        >
                            {/* Back & Title */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
                                <button
                                    onClick={() => setSelectedAlbum(null)}
                                    className="flex items-center gap-2 text-gray-400 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all w-fit"
                                >
                                    <ArrowLeft className="w-5 h-5" /> Back to Albums
                                </button>
                                <div className="text-right">
                                    <h2 className="text-3xl font-bold text-white">{selectedAlbum.name}</h2>
                                    <p className="text-gray-500 text-sm">{selectedAlbum.images?.length || 0} items</p>
                                </div>
                            </div>

                            {/* Images Grid */}
                            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                                {selectedAlbum.images?.map((img, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => setLightboxImage(img)}
                                        className="break-inside-avoid relative group cursor-zoom-in rounded-xl overflow-hidden bg-gray-900 border border-white/5 hover:border-red-500/30 transition-all"
                                    >
                                        <img src={img} alt={`${selectedAlbum.name} ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                    </motion.div>
                                ))}
                            </div>

                            {selectedAlbum.images?.length === 0 && (
                                <div className="py-20 text-center text-gray-500">
                                    <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p>This album is currenty empty.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* LIGHTBOX */}
            <AnimatePresence>
                {lightboxImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4"
                        onClick={() => setLightboxImage(null)}
                    >
                        <button
                            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                            onClick={() => setLightboxImage(null)}
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <motion.img
                            src={lightboxImage}
                            alt="Full screen"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default Gallery;
