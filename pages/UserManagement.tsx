import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Trash2, Shield, User as UserIcon, Plus, X, Loader2, Briefcase, Key } from 'lucide-react';
import { Role } from '../types';
import { db, firebaseConfig } from '../utils/firebase';
import { initializeApp as initApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, deleteDoc, serverTimestamp, collection, onSnapshot, query, orderBy, updateDoc } from 'firebase/firestore';

interface FirestoreUser {
    id: string;
    uid: string;
    displayName: string;
    email: string;
    role: Role;
    designation: string;
    accessCode?: string;
    transparencyCode?: string;
    createdAt?: any;
}

const UserManagement: React.FC = () => {
    const { currentUser } = useStore();
    const [allUsers, setAllUsers] = useState<FirestoreUser[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<FirestoreUser | null>(null);
    const [newAccessCode, setNewAccessCode] = useState('');
    const [newTransparencyCode, setNewTransparencyCode] = useState('');

    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: 'member123',
        role: 'USER' as Role,
        designation: ''
    });

    useEffect(() => {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedUsers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as FirestoreUser[];
            setAllUsers(fetchedUsers);
        });
        return () => unsubscribe();
    }, []);

    const handleCreateUser = async () => {
        if (!newUser.name || !newUser.email || !newUser.password) {
            alert("Please fill in all fields.");
            return;
        }

        setLoading(true);
        let secondaryApp: any = null;

        try {
            const appName = "SecondaryApp-" + new Date().getTime();
            secondaryApp = initApp(firebaseConfig, appName);
            const secondaryAuth = getAuth(secondaryApp);
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newUser.email, newUser.password);

            await setDoc(doc(db, "users", userCredential.user.uid), {
                uid: userCredential.user.uid,
                email: newUser.email,
                displayName: newUser.name,
                name: newUser.name,
                role: newUser.role,
                designation: newUser.designation,
                createdAt: serverTimestamp()
            });

            await signOut(secondaryAuth);
            await deleteApp(secondaryApp);
            secondaryApp = null;

            alert("User created and saved successfully!");
            setNewUser({ name: '', email: '', password: 'member123', role: 'USER', designation: '' });
            setShowModal(false);

        } catch (error: any) {
            console.error("Error creating user:", error);
            alert("Error: " + error.message);
            if (secondaryApp) {
                try { await deleteApp(secondaryApp); } catch (e) { }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (confirm("Are you sure you want to delete this user?")) {
            try { await deleteDoc(doc(db, 'users', id)); } catch (e) { }
        }
    };

    const handleRoleUpdate = async (id: string, newRole: Role) => {
        try { await setDoc(doc(db, 'users', id), { role: newRole }, { merge: true }); } catch (e) { }
    };

    const openCodeModal = (user: FirestoreUser) => {
        setSelectedUser(user);
        setNewAccessCode(user.accessCode || '');
        setNewTransparencyCode(user.transparencyCode || '');
        setShowCodeModal(true);
    };

    const handleSaveCode = async () => {
        if (!selectedUser) return;
        try {
            await updateDoc(doc(db, 'users', selectedUser.id), {
                accessCode: newAccessCode,
                transparencyCode: newTransparencyCode
            });
            alert("Access Codes Updated!");
            setShowCodeModal(false);
        } catch (e) {
            console.error(e);
            alert("Failed to update access code.");
        }
    };

    return (
        <div className="space-y-8 animate-fade-in text-white">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-white text-glow">User Management</h2>
                    <p className="text-gray-400">Create users, assign roles, and manage verification codes.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg shadow-lg hover:bg-red-700 flex items-center gap-2 transition-all"
                >
                    <Plus className="w-5 h-5" /> Add New User
                </button>
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-xs font-bold text-gray-400 uppercase">
                        <tr>
                            <th className="p-4">User</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Designation</th>
                            <th className="p-4">Access Code</th>
                            <th className="p-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {allUsers.map(u => (
                            <tr key={u.id} className="hover:bg-white/5 text-sm transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-white">
                                            {(u.displayName || u.name || '?')[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{u.displayName || u.name}</p>
                                            <p className="text-xs text-gray-400">{u.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${u.role === 'SUPER_ADMIN' ? 'bg-white text-black' :
                                        u.role === 'MEMBER_ADMIN' ? 'bg-red-500/20 text-red-500' :
                                            'bg-gray-700/50 text-gray-400'
                                        }`}>
                                        {u.role ? u.role.replace('_', ' ') : 'USER'}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-400">
                                    {u.designation || 'Member'}
                                </td>
                                <td className="p-4">
                                    {u.accessCode ? (
                                        <span className="text-green-400 font-mono bg-green-900/20 px-2 py-1 rounded border border-green-500/30">
                                            {u.accessCode}
                                        </span>
                                    ) : (
                                        <span className="text-gray-600 italic">Not Set</span>
                                    )}
                                </td>
                                <td className="p-4 flex justify-center gap-2">
                                    {u.role !== 'SUPER_ADMIN' && (
                                        <>
                                            <button
                                                onClick={() => openCodeModal(u)}
                                                className="p-2 text-yellow-400 hover:bg-yellow-500/10 rounded transition-colors"
                                                title="Set Access Code"
                                            >
                                                <Key className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleRoleUpdate(u.id, u.role === 'MEMBER_ADMIN' ? 'USER' : 'MEMBER_ADMIN')}
                                                className="p-2 text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                                                title="Toggle Admin"
                                            >
                                                <Shield className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(u.id)}
                                                className="p-2 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* CREATE USER MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass-panel bg-[#0a0a0a] rounded-2xl shadow-2xl w-full max-w-lg p-8 animate-scale-in border border-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-white">Create Account</h3>
                            <button onClick={() => setShowModal(false)}><X className="text-gray-400 hover:text-white" /></button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        className="w-full glass-input p-3 rounded-lg font-bold"
                                        value={newUser.name}
                                        onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Role</label>
                                    <select
                                        className="w-full glass-input p-3 rounded-lg font-bold"
                                        value={newUser.role}
                                        onChange={e => setNewUser({ ...newUser, role: e.target.value as Role })}
                                    >
                                        <option value="USER">Member</option>
                                        <option value="MEMBER_ADMIN">Admin</option>
                                        <option value="SUPER_ADMIN">Super Admin</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email (Login ID)</label>
                                <input
                                    type="email"
                                    className="w-full glass-input p-3 rounded-lg"
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Designation / Position</label>
                                <div className="flex items-center gap-2 glass-input border rounded-lg p-3">
                                    <Briefcase className="w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        className="w-full bg-transparent outline-none text-sm text-white placeholder-gray-500"
                                        placeholder="e.g. Treasurer, Secretary"
                                        value={newUser.designation}
                                        onChange={e => setNewUser({ ...newUser, designation: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Password</label>
                                <input
                                    type="text"
                                    className="w-full glass-input p-3 rounded-lg"
                                    value={newUser.password}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                />
                            </div>

                            <button
                                onClick={handleCreateUser}
                                disabled={loading}
                                className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                                {loading ? "Creating..." : "Create User"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SET CODE MODAL */}
            {showCodeModal && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass-panel bg-[#0a0a0a] rounded-2xl shadow-2xl w-full max-w-md p-8 animate-scale-in border border-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white">Set Access Code</h3>
                                <p className="text-sm text-gray-400">For {selectedUser.displayName}</p>
                            </div>
                            <button onClick={() => setShowCodeModal(false)}><X className="text-gray-400 hover:text-white" /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">ID Access Code</label>
                                <input
                                    type="text"
                                    autoFocus
                                    className="w-full glass-input p-3 rounded-lg font-mono text-center text-lg tracking-widest text-[#D90429] border-[#D90429]/30"
                                    placeholder="e.g. NCSS-ID-550"
                                    value={newAccessCode}
                                    onChange={e => setNewAccessCode(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Transparency Access Code</label>
                                <input
                                    type="text"
                                    className="w-full glass-input p-3 rounded-lg font-mono text-center text-lg tracking-widest text-blue-400 border-blue-500/30"
                                    placeholder="e.g. NCSS-TR-2025"
                                    value={newTransparencyCode}
                                    onChange={e => setNewTransparencyCode(e.target.value)}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Users must enter these exact codes in the Navbar to unlock respective features.
                            </p>
                            <button
                                onClick={handleSaveCode}
                                className="w-full py-3 bg-[#D90429] text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg"
                            >
                                Save Codes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;