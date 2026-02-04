import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { RoutePath } from '../types';
import { useNavigate } from 'react-router-dom';
import DashboardHome from '../components/DashboardHome';
import FundsManagement from './FundsManagement';
import UserManagement from './UserManagement';
import SiteEditor from './SiteEditor';
import GalleryAdmin from './GalleryAdmin';
import NewsAdmin from './NewsAdmin';
import Sidebar from '../components/Sidebar';
import RequestsAdmin from './RequestsAdmin';
import AdminChat from './AdminChat';
import { Bell, Calendar, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard: React.FC = () => {
  const { currentUser, sendNotification } = useStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [notifyMsg, setNotifyMsg] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate(RoutePath.LOGIN);
    }
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const restrictedTabs = ['approve-requests', 'users', 'news-admin', 'gallery-admin', 'site-editor', 'notify', 'meetings'];

  if (!isSuperAdmin && restrictedTabs.includes(activeTab)) {
    setActiveTab('overview');
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24 md:pt-4 flex relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black pointer-events-none" />

      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={currentUser.role} />

      {/* Main Content */}
      <main className="relative z-10 flex-1 md:ml-[20rem] p-6 lg:p-10 animate-fade-in pb-24 min-h-screen">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && <DashboardHome />}
          {activeTab === 'funds' && <FundsManagement />}
          {activeTab === 'chat' && <AdminChat />}

          {isSuperAdmin && (
            <>
              {activeTab === 'users' && <UserManagement />}
              {activeTab === 'site-editor' && <SiteEditor />}
              {activeTab === 'gallery-admin' && <GalleryAdmin />}
              {activeTab === 'news-admin' && <NewsAdmin />}
              {activeTab === 'approve-requests' && <RequestsAdmin />}

              {activeTab === 'meetings' && (
                <div className="glass-panel p-10 rounded-3xl flex flex-col items-center justify-center h-96 text-gray-400">
                  <Calendar className="w-16 h-16 mb-4 opacity-20" />
                  <h3 className="text-xl font-bold">Meetings Module</h3>
                  <p>Coming Soon</p>
                </div>
              )}

              {activeTab === 'notify' && (
                <div className="glass-card p-8 rounded-3xl max-w-2xl">
                  <h3 className="text-xl font-bold mb-6 text-white text-glow">Broadcast Notification</h3>
                  <textarea
                    placeholder="Message to all admins..."
                    rows={4}
                    className="w-full p-4 glass-input rounded-xl mb-6 text-white"
                    onChange={(e) => setNotifyMsg(e.target.value)}
                  ></textarea>
                  <button
                    onClick={() => { sendNotification(notifyMsg); alert("Sent!"); }}
                    className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 flex items-center gap-2 transition-all"
                  >
                    <Bell className="w-4 h-4" /> Send Broadcast
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;