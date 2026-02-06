import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard, LogOut, CheckCircle, AlertCircle, ShieldCheck, Eye, User } from 'lucide-react';
import { RoutePath } from '../types';
import { useStore } from '../context/StoreContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser, logout, access } = useStore();
  const navigate = useNavigate();

  // Verification State
  const [code, setCode] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync access state from session (Stability Fix)
  useEffect(() => {
    if (sessionStorage.getItem('id_access_unlocked') === 'true') access.unlockId();
    if (sessionStorage.getItem('transparency_access_unlocked') === 'true') access.unlockTransparency();
  }, []);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const verifyCode = async () => {
    if (!code || !currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.id));
      if (userDoc.exists()) {
        const data = userDoc.data();
        let success = false;

        // Check ID Access
        if (data.accessCode === code) {
          access.unlockId();
          sessionStorage.setItem('id_access_unlocked', 'true');
          showToast("ID Access Unlocked! ✅", "success");
          success = true;
        }

        // Check Transparency Access
        if (data.transparencyCode === code) {
          access.unlockTransparency();
          sessionStorage.setItem('transparency_access_unlocked', 'true');
          showToast("Transparency Unlocked! ✅", "success");
          success = true;
        }

        if (!success) {
          showToast("Invalid Code ❌", "error");
        } else {
          setCode(''); // Clear code on success
        }

      } else {
        showToast("User Error", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Error Verifying Code", "error");
    }
  };

  const handleLogout = () => {
    logout();
    navigate(RoutePath.HOME);
  };

  const navLinks = [
    { label: 'Home', path: RoutePath.HOME },
    { label: 'Gallery', path: RoutePath.GALLERY },
    { label: 'News', path: RoutePath.NEWS },
    // Removed Public Transparency Link
  ];

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 py-3 bg-black/80 backdrop-blur-2xl border-b border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center relative">
          {/* Logo */}
          <div onClick={() => navigate('/')} className="flex items-center group cursor-pointer drop-shadow-[0_0_10px_rgba(220,38,38,0.6)]">
            <img
              src="https://i.postimg.cc/Qtzp5v4x/ncss-crest-Nalanda-College-Science-Society-300x300-removebg-preview.png"
              alt="NCSS Logo"
              className="h-8 w-auto object-contain"
            />
            <span className="ml-3 font-extrabold text-xl tracking-tight text-red-500">NCSS MEMBERS</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `text-lg font-bold tracking-wider transition-all duration-300 relative group hover:drop-shadow-[0_0_10px_rgba(248,113,113,1)] ${isActive
                    ? 'text-red-400'
                    : 'text-white hover:text-red-400'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            {/* UNIFIED ACCESS SECTION */}
            {currentUser && (
              <div className="flex items-center gap-2 ml-4">
                {/* Buttons appear when unlocked */}
                {access.transparencyUnlocked && (
                  <button
                    onClick={() => navigate(RoutePath.TRANSPARENCY)}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full text-xs font-bold border border-white/10 transition-all"
                    title="View Transparency"
                  >
                    <Eye className="w-3 h-3" /> Transparency
                  </button>
                )}

                {access.idUnlocked && (
                  <button
                    onClick={() => navigate(RoutePath.GENERATE_ID)}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-[0_0_10px_rgba(220,38,38,0.5)] animate-pulse hover:animate-none transition-all"
                    title="Get Digital ID"
                  >
                    <ShieldCheck className="w-3 h-3" /> Get ID
                  </button>
                )}

                {/* Input always visible if not fully unlocked? Or act as an "Adder" */}
                <div className="flex items-center gap-1 animate-fade-in ml-2">
                  <input
                    type="text"
                    className="bg-black/50 border border-red-500/30 rounded px-2 py-1 text-xs text-white focus:border-red-500 outline-none w-24 placeholder-red-500/50"
                    placeholder="Secret Code..."
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && verifyCode()}
                  />
                  <button
                    onClick={verifyCode}
                    className="text-red-500 hover:text-white transition font-bold text-xs px-1"
                  >
                    Go
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Auth Actions */}
          <div className="hidden md:flex items-center gap-4">
            {currentUser ? (
              <div className="relative group/profile">
                {/* Profile Trigger */}
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-3 p-1 pr-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-800 p-[2px]">
                    <div className="w-full h-full rounded-full bg-black overflow-hidden flex items-center justify-center">
                      {currentUser.photoURL ? (
                        <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-white">{currentUser.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-bold text-white leading-tight max-w-[80px] truncate">{currentUser.name}</span>
                    <span className="text-[10px] text-gray-400 leading-tight capitalize">{currentUser.role === "SUPER_ADMIN" ? "Super Admin" : "Member"}</span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute top-full right-0 mt-2 w-56 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible transition-all duration-200 transform origin-top-right overflow-hidden z-50">
                  <div className="p-2 flex flex-col gap-1">
                    <button onClick={() => navigate('/profile')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 text-sm font-medium text-gray-200 hover:text-white transition-colors flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                        <User className="w-4 h-4" /> {/* Lucide User icon needs to be imported if not already, but I saw it imported in Profile.tsx, need to check Navbar imports */}
                      </div>
                      My Profile
                    </button>

                    {(currentUser.role === 'MEMBER_ADMIN' || currentUser.role === 'SUPER_ADMIN') && (
                      <button onClick={() => navigate(RoutePath.DASHBOARD)} className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 text-sm font-medium text-gray-200 hover:text-white transition-colors flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                          <LayoutDashboard className="w-4 h-4" />
                        </div>
                        {currentUser.role === 'SUPER_ADMIN' ? <span className="text-red-400 font-bold">Admin Panel (Super)</span> : "Admin Panel"}
                      </button>
                    )}

                    <div className="h-px bg-white/10 my-1 mx-2"></div>

                    <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-900/20 text-sm font-medium text-red-400 hover:text-red-300 transition-colors flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-900/20 flex items-center justify-center text-red-500">
                        <LogOut className="w-4 h-4" />
                      </div>
                      Log Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(RoutePath.LOGIN)}
                  className="font-semibold text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate(RoutePath.LOGIN)}
                  className="px-6 py-2 bg-gradient-to-r from-red-700 to-red-900 text-white text-sm font-bold rounded-full border border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.5)] hover:scale-105 hover:shadow-[0_0_25px_rgba(220,38,38,0.8)] transition-transform duration-300"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-red-500 hover:drop-shadow-[0_0_10px_rgba(239,68,68,1)] transition-all">
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>

          {/* CUSTOM TOAST NOTIFICATION */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className={`absolute top-20 right-5 px-6 py-3 rounded-xl border backdrop-blur-md shadow-2xl flex items-center gap-3 z-50 ${toast.type === 'success'
                  ? 'bg-green-900/90 border-green-500 text-white shadow-green-500/20'
                  : 'bg-red-900/90 border-red-500 text-white shadow-red-500/20'
                  }`}
              >
                {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-400" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                <span className="font-bold text-sm tracking-wide">{toast.msg}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 py-6 px-6 flex flex-col gap-4 shadow-xl">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `text-lg font-bold ${isActive ? 'text-red-600' : 'text-gray-600'}`
                }
              >
                {link.label}
              </NavLink>
            ))}

            {/* Mobile Unified Access */}
            {currentUser && (
              <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                <p className="text-xs font-bold text-red-500 mb-2 uppercase">Secret Access</p>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter Code..."
                      className="flex-1 bg-white border border-gray-200 rounded px-2 py-2 text-sm outline-none focus:border-red-500"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                    />
                    <button onClick={verifyCode} className="bg-red-600 text-white px-4 rounded font-bold">Go</button>
                  </div>

                  {/* Unlocked Buttons Mobile */}
                  <div className="flex gap-2 mt-2">
                    {access.transparencyUnlocked && (
                      <button onClick={() => { navigate(RoutePath.TRANSPARENCY); setIsMobileMenuOpen(false) }} className="flex-1 bg-gray-800 text-white py-2 rounded text-xs font-bold">
                        Transparency
                      </button>
                    )}
                    {access.idUnlocked && (
                      <button onClick={() => { navigate(RoutePath.GENERATE_ID); setIsMobileMenuOpen(false) }} className="flex-1 bg-red-600 text-white py-2 rounded text-xs font-bold">
                        Get ID
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="h-px w-full bg-gray-100 my-2" />
            {currentUser ? (
              <button onClick={handleLogout} className="text-left font-bold text-red-600">Log Out</button>
            ) : (
              <button onClick={() => { navigate(RoutePath.LOGIN); setIsMobileMenuOpen(false) }} className="w-full py-3 bg-red-600 text-white font-bold rounded-lg">Sign In / Sign Up</button>
            )}
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;