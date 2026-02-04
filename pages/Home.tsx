import React, { useState, useEffect } from 'react';
import Footer from '../components/Footer';
import { ChevronRight, ArrowRight, Target, Eye, Shield, Lock, Zap } from 'lucide-react';
import { db } from '../utils/firebase';
import { doc, getDoc, collection, getDocs, limit, query } from 'firebase/firestore';
import { ContentItem } from '../types';

interface SiteOptions {
  heroTitle: string;
  heroSubtitle: string;
  heroImages: string[];
  missionTitle?: string;
  missionText?: string;
  visionTitle?: string;
  visionText?: string;
  aboutText?: string;
  aboutImages?: string[];
}

const Home: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Data State
  const [siteData, setSiteData] = useState<SiteOptions>({
    heroTitle: "EXPLORE THE UNIVERSE",
    heroSubtitle: "Join the NCSS on a journey through space, science, and innovation.",
    heroImages: ["https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"],
    missionTitle: "Our Mission",
    missionText: "To inspire the next generation of scientists and explorers through practical education and immersive experiences.",
    visionTitle: "Our Vision",
    visionText: "A world where scientific literacy is universal and space exploration is accessible to all."
  });

  const [featuredNews, setFeaturedNews] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Site Settings
        const settingsRef = doc(db, 'settings', 'homepage');
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          const data = settingsSnap.data() as SiteOptions;
          setSiteData(prev => ({
            ...prev,
            ...data,
            // Fallback for array incase it's empty
            heroImages: (data.heroImages && data.heroImages.length > 0) ? data.heroImages : prev.heroImages
          }));
        }

        // 2. Fetch Latest News (Limit 3)
        const q = query(collection(db, 'news'), limit(3)); // Add orderBy date if indexed
        const newsSnap = await getDocs(q);
        const newsData = newsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ContentItem[];

        // Client side sort
        newsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setFeaturedNews(newsData);

      } catch (error) {
        console.error("Error loading home data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Netflix-style auto slider
  useEffect(() => {
    if (siteData.heroImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % siteData.heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [siteData.heroImages]);

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
    </div>;
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 overflow-x-hidden font-outfit">

      {/* CMS Hero Slider */}
      <section className="relative h-screen w-full overflow-hidden">
        {siteData.heroImages.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
            <img src={img} alt="Hero" className="w-full h-full object-cover" />
          </div>
        ))}

        <div className="absolute inset-0 z-20 flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <h1 className="text-7xl md:text-9xl font-black text-white tracking-tighter mb-6 drop-shadow-2xl">
              {siteData.heroTitle.split(" ").map((word, i) => (
                <span key={i} className={i === siteData.heroTitle.split(" ").length - 1 ? 'text-red-600' : ''}>{word} </span>
              ))}
            </h1>
            <p className="text-xl text-gray-200 max-w-2xl mb-8 font-light border-l-4 border-red-600 pl-6 backdrop-blur-sm">
              {siteData.heroSubtitle}
            </p>
            <button
              onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
              className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg shadow-red-600/40 transition-all flex items-center gap-2"
            >
              Start Exploration <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-10 right-10 z-30 flex gap-2">
          {siteData.heroImages.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-red-600' : 'w-4 bg-white/50'}`}
            />
          ))}
        </div>
      </section>

      {/* Live Red Background Container for Lower Sections */}
      <div className="live-red-bg">
        {/* NEW: ABOUT US SECTION (Image Slider + Text) */}
        <section className="relative z-10 mt-10 py-16 px-6">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">

            {/* About Text Card */}
            <div className="bg-gradient-to-br from-black/80 via-red-950/50 to-black/80 backdrop-blur-xl border border-red-500/50 rounded-3xl p-8 shadow-[0_0_30px_rgba(220,38,38,0.3)] hover:shadow-[0_0_50px_rgba(220,38,38,0.6)] transition-all duration-500 group flex flex-col justify-center">
              <span className="text-red-500 font-bold tracking-widest uppercase text-xs mb-2">About Us</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 drop-shadow-md">Pioneering <span className="text-red-500">Space Science</span></h2>
              <p className="text-gray-100 leading-relaxed text-lg font-medium">
                {siteData.aboutText || "The NCSS is committed to advancing the frontiers of human knowledge through rigorous scientific inquiry and daring exploration. We believe the future belongs to those who look up."}
              </p>
            </div>

            {/* About Image Slider */}
            <div className="rounded-3xl overflow-hidden border border-red-500/30 relative h-[450px] shadow-2xl">
              {(siteData.aboutImages && siteData.aboutImages.length > 0) ? (
                <>
                  {siteData.aboutImages.map((img, idx) => (
                    <div
                      key={idx}
                      className={`absolute inset-0 transition-opacity duration-1000 ${currentSlide % siteData.aboutImages.length === idx ? 'opacity-100' : 'opacity-0'}`}
                    >
                      <img src={img} alt="About Us" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  <div className="absolute bottom-6 right-6 flex gap-1 z-10">
                    {siteData.aboutImages.map((_, i) => (
                      <div key={i} className={`h-1.5 rounded-full transition-all ${currentSlide % siteData.aboutImages.length === i ? 'w-6 bg-red-600' : 'w-2 bg-white/50'}`} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                  <span className="text-gray-700 font-bold">No Images Available</span>
                </div>
              )}
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            </div>

          </div>
        </section>

        {/* NEW: VISION & MISSION GRID */}
        <section className="py-12 px-6 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">

            {/* Vision Card */}
            <div className="bg-gradient-to-br from-black/80 via-red-950/50 to-black/80 backdrop-blur-xl border border-red-500/50 rounded-3xl p-8 shadow-[0_0_30px_rgba(220,38,38,0.3)] hover:shadow-[0_0_50px_rgba(220,38,38,0.6)] hover:scale-[1.02] transition-all duration-500 group">
              <Eye className="w-10 h-10 text-red-500 mb-4" />
              <h3 className="text-3xl font-bold text-white mb-4 drop-shadow-md">{siteData.visionTitle || "Our Vision"}</h3>
              <p className="text-gray-100 leading-relaxed text-lg font-medium">
                {siteData.visionText || "A future where the cosmos is within reach for every curious mind."}
              </p>
            </div>

            {/* Mission Card */}
            <div className="bg-gradient-to-br from-black/80 via-red-950/50 to-black/80 backdrop-blur-xl border border-red-500/50 rounded-3xl p-8 shadow-[0_0_30px_rgba(220,38,38,0.3)] hover:shadow-[0_0_50px_rgba(220,38,38,0.6)] hover:scale-[1.02] transition-all duration-500 group">
              <Target className="w-10 h-10 text-red-500 mb-4" />
              <h3 className="text-3xl font-bold text-white mb-4 drop-shadow-md">{siteData.missionTitle || "Our Mission"}</h3>
              <p className="text-gray-100 leading-relaxed text-lg font-medium">
                {siteData.missionText || "To provide the tools, knowledge, and platform for the next generation of explorers."}
              </p>
            </div>

          </div>
        </section>

        {/* Featured Content / Latest Updates */}
        <section className="py-24 max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-black text-gray-900 mb-2">Latest <span className="text-red-600">Discoveries</span></h2>
              <div className="h-1 w-20 bg-red-600"></div>
            </div>
            <a href="#/news" className="text-sm font-bold text-gray-500 hover:text-red-600 flex items-center gap-1">View All <ArrowRight className="w-4 h-4" /></a>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Show first 3 News items */}
            {featuredNews.length > 0 ? featuredNews.slice(0, 3).map((item) => (
              <div key={item.id} className="group relative overflow-hidden rounded-2xl shadow-xl h-80 cursor-pointer" onClick={() => window.location.hash = '#/news'}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <span className="text-gray-700 font-bold text-4xl opacity-20">NCSS</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex flex-col justify-end p-6">
                  <div className="text-red-500 text-xs font-bold mb-2 uppercase">{new Date(item.date).toLocaleDateString()}</div>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-red-500 transition-colors">{item.title}</h3>
                  <p className="text-gray-300 text-sm line-clamp-2">{item.description}</p>
                </div>
              </div>
            )) : (
              [1, 2, 3].map(i => (
                <div key={i} className="h-80 bg-gray-200 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300">
                  <span className="text-gray-400 font-bold">No Updates Yet</span>
                </div>
              ))
            )}
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
};

export default Home;