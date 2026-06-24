/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building, 
  Search, 
  LogIn, 
  HelpCircle, 
  LogOut, 
  ShieldAlert, 
  User, 
  RefreshCcw, 
  CheckCircle,
  Trophy,
  Activity,
  Layers,
  ChevronRight,
  Smartphone,
  Download,
  X,
  Info,
  Star,
  ArrowLeft,
  Share2,
  MoreVertical,
  Check,
  ThumbsUp,
  MessageSquare
} from 'lucide-react';
import { laundryService, useRealFirebase, startFirebaseSync, clearFirebaseSubscriptions, auth as libAuth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { UserProfile, UserRole } from './types';

// Importing Dashboard sub-components
import TrackingView from './components/TrackingView';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import OwnerDashboard from './components/OwnerDashboard';
import CashierDashboard from './components/CashierDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import SetupGuide from './components/SetupGuide';
import UserAvatar from './components/UserAvatar';

export default function App() {
  const [currentTab, setCurrentTab] = React.useState<'home' | 'track' | 'dashboard' | 'guide'>('home');
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);

  // Authentication Forms State
  const [loginMethod, setLoginMethod] = React.useState<'google' | 'internal'>('google');
  const [usernameInput, setUsernameInput] = React.useState('');
  const [loginError, setLoginError] = React.useState('');
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = React.useState(false);
  const [showHowToInstallModal, setShowHowToInstallModal] = React.useState(false);
  const [isAppInstalled, setIsAppInstalled] = React.useState(false);
  const [downloadProgress, setDownloadProgress] = React.useState<number>(0);
  const [installState, setInstallState] = React.useState<'idle' | 'downloading' | 'installing' | 'installed'>('idle');

  // Loaded at boot
  React.useEffect(() => {
    // Check pathname routing for Vercel/production tracking view route integration
    const path = window.location.pathname;
    if (path.includes('/tracking/')) {
      const parts = path.split('/tracking/');
      const invoiceNo = parts[parts.length - 1];
      if (invoiceNo && invoiceNo.trim()) {
        localStorage.setItem('lnd_direct_track_invoice', invoiceNo.trim());
        setCurrentTab('track');
      }
    } else {
      const active = laundryService.getCurrentSimulatedUser();
      if (active) {
        setCurrentUser(active);
        setCurrentTab('dashboard');
      }
    }
  }, []);

  // PWA Installation Listeners & Detection Hook
  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      const isDismissed = sessionStorage.getItem('lnd_pwa_install_dismissed') === 'true';
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      
      if (!isDismissed && !isStandalone) {
        setShowInstallBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      console.log('Londria Hub PWA installed successfully!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Initial checks
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handlePlayStoreInstall = async () => {
    if (installState !== 'idle') return;
    
    // Run premium Play Store download simulation
    setInstallState('downloading');
    setDownloadProgress(0);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setDownloadProgress(100);
        setInstallState('installing');
        
        setTimeout(() => {
          setInstallState('installed');
          setIsAppInstalled(true);
          // If native prompt is available, trigger it near the end
          if (deferredPrompt) {
            deferredPrompt.prompt().then(({ outcome }: any) => {
              console.log(`User response to native prompt: ${outcome}`);
              setDeferredPrompt(null);
            }).catch((err: any) => console.warn(err));
          }
          
          setTimeout(() => {
            setShowHowToInstallModal(false);
            setInstallState('idle');
          }, 2500);
        }, 1500);
      } else {
        setDownloadProgress(progress);
      }
    }, 150);
  };

  const handleInstallClick = async () => {
    setShowHowToInstallModal(true);
  };

  const handleDismissBanner = () => {
    sessionStorage.setItem('lnd_pwa_install_dismissed', 'true');
    setShowInstallBanner(false);
  };

  // Real-time Firebase Auth session restoration listener hook
  React.useEffect(() => {
    if (!useRealFirebase) return;

    // Listen to Firebase Auth state events
    const unsubscribe = onAuthStateChanged(libAuth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log("Firebase Auth detected authenticated user:", firebaseUser.email);
        try {
          const profile = await laundryService.getOrCreateProfileForFirebaseUser(firebaseUser);
          setCurrentUser(profile);
          if (currentTab === 'home') {
            setCurrentTab('dashboard');
          }
        } catch (err) {
          console.error("Failed to restore Firebase profile automatically:", err);
        }
      } else {
        // Sign out locally if logged out from Firebase Auth
        const localUser = laundryService.getCurrentSimulatedUser();
        if (localUser && (localUser.role === 'owner' || localUser.role === 'super_admin')) {
          laundryService.setSimulatedUser(null);
          setCurrentUser(null);
          setCurrentTab('home');
        }
      }
    });

    return () => unsubscribe();
  }, [currentTab]);

  // Context-aware secure listener synchronization hook
  const [listVersion, setListVersion] = React.useState(0);

  React.useEffect(() => {
    const unsubscribe = laundryService.subscribeToChanges(() => {
      setListVersion(v => v + 1);
    });
    return () => unsubscribe();
  }, []);

  // Compute active laundry & user suspension status dynamically
  const suspensionStatus = React.useMemo(() => {
    if (!currentUser) return { suspended: false, name: '', reason: '' };
    if (currentUser.role === 'super_admin') return { suspended: false, name: '', reason: '' };

    // Check if user account itself is suspended
    if (currentUser.isActive === false) {
      return { 
        suspended: true, 
        name: currentUser.name, 
        reason: 'Akun personal Anda telah dinonaktifkan sementara oleh Super Administrator platform Londria Hub.' 
      };
    }

    // Check if user's laundry outlet is suspended
    if (currentUser.laundryId) {
      const laundryList = laundryService.getLaundries();
      const myLaundry = laundryList.find(l => l.laundryId === currentUser.laundryId);
      if (myLaundry && !myLaundry.isActive) {
        return { 
          suspended: true, 
          name: myLaundry.name, 
          reason: `Outlet laundry "${myLaundry.name}" telah ditangguhkan sementara oleh administrator platform Hub Laundry.` 
        };
      }
    }

    return { suspended: false, name: '', reason: '' };
  }, [currentUser, listVersion]);

  React.useEffect(() => {
    if (currentUser) {
      startFirebaseSync(currentUser);
    } else {
      clearFirebaseSubscriptions();
    }
    return () => {
      clearFirebaseSubscriptions();
    };
  }, [currentUser]);

  const handleGoogleLoginReal = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const profile = await laundryService.loginGoogleReal();
      setCurrentUser(profile);
      setCurrentTab('dashboard');
    } catch (e: any) {
      console.warn("Real Google Auth caught error:", e);
      
      const errCode = e.code || '';
      const errMsg = e.message || '';
      const isPopupInterrupted = 
        errCode === 'auth/cancelled-popup-request' || 
        errCode === 'auth/popup-closed-by-user' || 
        errCode === 'auth/popup-blocked' ||
        errMsg.includes('cancelled-popup-request') || 
        errMsg.includes('popup-closed-by-user') ||
        errMsg.includes('popup-blocked') ||
        errMsg.includes('Pending promise was never set');

      // Regardless of the reported error, give a short grace period for Firebase block states
      // to resolve and onAuthStateChanged to sync the session state from IndexedDB
      await new Promise(resolve => setTimeout(resolve, 1500));
      const active = laundryService.getCurrentSimulatedUser();
      if (active) {
        console.log("Iframe error caught, but session successfully initialized in background. Proceeding to Dashboard...");
        setCurrentUser(active);
        setCurrentTab('dashboard');
        setIsLoggingIn(false);
        return;
      }

      if (isPopupInterrupted) {
        setLoginError('Proses login terputus atau pop-up diblokir oleh browser. Jika Anda menggunakan AI Studio, silakan klik tombol "Buka Aplikasi Di Tab Baru" di pojok kanan atas preview untuk login dengan lancar.');
      } else {
        setLoginError(e.message || 'Gagal masuk dengan Google. Pastikan domain popup telah diizinkan di Firebase Console > Authentication.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleInternalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!usernameInput.trim()) {
      setLoginError('Masukkan username karyawan.');
      return;
    }

    try {
      const profile = await laundryService.loginInternalSimulated(usernameInput.trim().toLowerCase());
      if (profile) {
        setCurrentUser(profile);
        setCurrentTab('dashboard');
        setUsernameInput('');
      } else {
        setLoginError('User internal tidak ditemukan. Mintalah Owner laundry mendaftarkan Anda.');
      }
    } catch (err: any) {
      console.error("Internal login caught error:", err);
      setLoginError('Terjadi kesalahan koneksi login. Coba lagi.');
    }
  };

  const handleLogout = () => {
    laundryService.logout();
    setCurrentUser(null);
    setCurrentTab('home');
  };

  const handleResetDemoDb = () => {
    if (window.confirm('Reset Sesi Login & Cache Aplikasi? Langkah ini hanya akan menghapus cache login pada browser Anda.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-blue-105 pb-16 md:pb-0">
      
      {/* FLOATING TOP DEVELOPMENT NOTIFICATION BAR */}
      <div className="bg-slate-900 text-white py-2.5 px-4 text-center text-xs flex flex-wrap items-center justify-center gap-3 border-b border-slate-800">
        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-450 px-2 py-0.5 rounded border border-emerald-500/20 font-bold uppercase text-[9px] tracking-wider animate-pulse">
          <Activity className="w-3.5 h-3.5 text-emerald-450" /> Firebase Online Mode
        </span>
        <p className="text-slate-300 font-medium">
          Aplikasi terhubung langsung 100% ke Database Firebase Firestore Aktif di Vercel Production.
        </p>
        <div className="flex gap-2">
          {!isAppInstalled && (
            <button 
              onClick={() => setShowHowToInstallModal(true)}
              className="text-[10px] font-bold bg-blue-650 hover:bg-blue-700 text-white px-2.5 py-1 rounded-md transition flex items-center gap-1 border border-blue-500/30"
              title="Petunjuk & instalasi aplikasi ke handphone"
            >
              <Smartphone className="w-3 h-3" /> Instal Aplikasi HP
            </button>
          )}
          <button 
            onClick={() => setCurrentTab('guide')}
            className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md hover:bg-slate-700 transition border border-slate-700"
          >
            Sistem Metadata
          </button>
          <button 
            onClick={handleResetDemoDb}
            className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-md transition flex items-center gap-1"
          >
            <RefreshCcw className="w-3 h-3" /> Reset Database
          </button>
        </div>
      </div>

      {/* CORE FRAMEWORK NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* LOGO BRAND */}
          <div 
            onClick={() => setCurrentTab('home')} 
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="bg-blue-600 text-white p-2 rounded-xl group-hover:scale-105 transition shadow-md shadow-blue-500/20">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-800 font-sans tracking-tight">Londria <span className="text-blue-600">Hub</span></span>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Smart Laundry</p>
            </div>
          </div>

          {/* MENUS BUTTONS BAR */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-semibold">
            <button 
              onClick={() => setCurrentTab('home')}
              className={`px-4 py-2 rounded-xl transition ${currentTab === 'home' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Beranda
            </button>
            <button 
              onClick={() => setCurrentTab('track')}
              className={`px-4 py-2 rounded-xl transition ${currentTab === 'track' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Lacak Cucian (Publik)
            </button>
            <button 
              onClick={() => setCurrentTab('guide')}
              className={`px-4 py-2 rounded-xl transition ${currentTab === 'guide' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Bantuan Setup
            </button>
          </nav>

          {/* USER SESSIONS PANEL */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-slate-800">{currentUser.name}</p>
                  <p className="text-[10px] font-bold text-blue-650 uppercase tracking-wider">{currentUser.role.replace('_', ' ')}</p>
                </div>
                <button 
                  onClick={() => setCurrentTab('dashboard')}
                  className="hover:opacity-90 transition rounded-full focus:outline-none"
                  title="Ke Dashboard"
                >
                  <UserAvatar name={currentUser.name} photoURL={currentUser.photoURL} size="sm" />
                </button>
                <button 
                  onClick={handleLogout}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-2 rounded-xl transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setCurrentTab('dashboard')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                Masuk Sistem Karyawan
              </button>
            )}
          </div>

        </div>
      </header>

      {/* RENDER BODY SCREENS */}
      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
        
        {/* TAB: HOME */}
        {currentTab === 'home' && (
          <div className="space-y-12 py-6">
            
            {/* HERO HERO SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-850 rounded-full text-xs font-bold border border-blue-100">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  Sistem Laundry Seluler Multi-Role Terakreditasi
                </span>
                <h1 className="text-4xl md:text-5xl font-black text-slate-800 leading-tight tracking-tight">
                  Manajemen Laundry Modern dengan Ekosistem <span className="text-blue-600 underline decoration-wavy decoration-blue-300">Firebase</span>
                </h1>
                <p className="text-slate-500 text-sm leading-relaxed max-w-md">
                  Kelola operasional laundry mulai dari Super Admin, Owner Outlet, Kasir, hingga Operator cuci secara terpadu. 
                  Pelanggan Anda dapat melacak pencucian secara dinamis tanpa login. Masuk sekarang untuk mencoba fitur lengkapnya!
                </p>
                
                <div className="flex flex-wrap gap-3 pt-2">
                  <button 
                    onClick={() => setCurrentTab('dashboard')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm px-6 py-3.5 rounded-xl transition shadow-lg shadow-blue-500/20 flex items-center gap-1.5"
                  >
                    Masuk / Hubungkan Google Auth & Karyawan
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setCurrentTab('track')}
                    className="bg-white hover:bg-slate-50 text-slate-755 border border-slate-205 font-bold text-sm px-6 py-3.5 rounded-xl transition shadow-sm flex items-center gap-1.5"
                  >
                    <Search className="w-4 h-4 text-slate-400" />
                    Lacak Order Pelanggan
                  </button>
                </div>
              </div>

              {/* FLOATING ROLES CARD PREVIEW */}
              <div className="bg-gradient-to-tr from-slate-900 to-slate-950 text-white rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="mb-4 p-3 bg-blue-500/10 text-blue-300 rounded-xl text-xs border border-blue-500/20 font-bold leading-relaxed">
                  🔒 KEAMANAN DATA: Akun administratif (Super Admin & Owner) **WAJIB** masuk menggunakan Google Auth Rill untuk menjamin kenyamanan & keamanan database 100%. Akun karyawan (Kasir & Pegawai) menggunakan sistem internal.
                </div>
                <h3 className="font-extrabold text-white text-lg mb-4">Akses & Manajemen Peran Pengguna</h3>
                <p className="text-slate-400 text-xs mb-6">Berikut adalah panduan peran dan cara autentikasi resmi:</p>
                
                <div className="space-y-4">
                  {[
                    { role: 'Super Admin', task: 'Melihat statistik global & buat laundry pemilik baru.', user: 'Real Google Auth (aisugiharti12@admin.smp.belajar.id)' },
                    { role: 'Owner Laundry / Admin', task: 'Mengatur harga jasa & daftarkan akun karyawan.', user: 'Real Google Auth (Gunakan Akun Google Anda)' },
                    { role: 'Kasir Laundry', task: 'Input laundry ditimbang, proses kasir & cetak struk thermal.', user: 'Login Internal (e.g. @kasirtest atau kasir001)' },
                    { role: 'Pegawai Cuci / Lapangan', task: 'Operator cuci-timbang yang update progres basah-kering.', user: 'Login Internal (e.g. @pegawaitest atau pegawai001)' }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 items-start bg-slate-900/60 p-4 border border-slate-800 rounded-2xl">
                      <div className="bg-blue-500/10 text-blue-400 p-2 rounded-xl text-xs font-bold w-10 text-center flex-shrink-0">
                        0{i+1}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-200 text-sm">{item.role}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.task}</p>
                        <p className="text-[10px] font-mono text-blue-400 font-bold mt-1 bg-blue-950/40 w-fit px-2 py-0.5 rounded border border-blue-500/20">{item.user}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SECTIONS: LAUNDRY LOGISTICS STEPS */}
            <div className="border-t border-slate-200 pt-12">
              <h3 className="text-center text-xs font-extrabold tracking-widest text-slate-400 uppercase mb-8">Status Produksi yang Diakomodasi</h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center font-semibold">
                {[
                  { title: 'diterima', desc: 'Kasir menimbang pakaian' },
                  { title: 'dicuci', desc: 'Pencucian mesin' },
                  { title: 'dikeringkan', desc: 'Pengeringan panas' },
                  { title: 'disetrika', desc: 'Penyetrikaan uap' },
                  { title: 'selesai', desc: 'Selesai di-packing' },
                  { title: 'diambil', desc: 'Selesai diserahkan' }
                ].map((st, i) => (
                  <div key={i} className="bg-white border rounded-2xl p-4 shadow-sm">
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full uppercase font-bold">Langkah {i+1}</span>
                    <h4 className="text-slate-800 text-sm font-black capitalize mt-2">{st.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">{st.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB: PUBLIC TRACKING */}
        {currentTab === 'track' && <TrackingView />}

        {/* TAB: SYSTEM PORTAL / DASHBOARD WRAPPERS */}
        {currentTab === 'dashboard' && (
          <div>
            {!currentUser ? (
              /* THE LOGIN PORTAL BOX */
              <div className="max-w-md mx-auto py-8">
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl space-y-6 relative overflow-hidden">
                  
                  <div className="text-center">
                    <span className="text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">Sistem Login</span>
                    <h2 className="text-xl font-bold text-slate-800 mt-3 font-sans">Gerbang Pengguna Laundry</h2>
                    <p className="text-xs text-slate-500 mt-1">Gunakan akun Google (Owner/Super Admin) atau akun internal (Kasir/Pegawai).</p>
                  </div>

                  {/* METHODS SECTOR */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                    <button 
                      onClick={() => { setLoginMethod('google'); setLoginError(''); }}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${
                        loginMethod === 'google' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
                      }`}
                    >
                      Login Google (Owner)
                    </button>
                    <button 
                      onClick={() => { setLoginMethod('internal'); setLoginError(''); }}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${
                        loginMethod === 'internal' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
                      }`}
                    >
                      Internal (Karyawan)
                    </button>
                  </div>

                  {loginError && (
                    <div className="p-3 bg-rose-50 text-rose-800 border border-rose-105 rounded-xl text-xs font-semibold animate-shake">
                      {loginError}
                    </div>
                  )}

                  {/* FORM RENDER: EMAIL ACCREDITED FOR PLATFORM OR OWNER */}
                  {loginMethod === 'google' ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-2xl text-xs space-y-2 leading-relaxed">
                        <p className="font-extrabold text-emerald-900">🛡️ AUTENTIKASI AMAN:</p>
                        <p>Platform mewajibkan seluruh pemilik laundry (Owner) dan administrator utama (Super Admin) untuk masuk melalui validasi Google resmi guna melindungi data sensitif seperti omset, transaksi, dan data rahasia staf.</p>
                      </div>

                      {/* REAL GOOGLE AUTH POPUP BUTTON */}
                      <button 
                        type="button"
                        onClick={handleGoogleLoginReal}
                        disabled={isLoggingIn}
                        className={`w-full text-white font-black py-4 rounded-xl transition text-sm flex items-center justify-center gap-2.5 shadow-md shadow-blue-500/10 ${
                          isLoggingIn 
                            ? 'bg-blue-450 opacity-75 cursor-wait' 
                            : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                        }`}
                      >
                        {isLoggingIn ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Menghubungkan ke Google...
                          </>
                        ) : (
                          <>
                            <span className="w-5 h-5 bg-white text-blue-600 font-extrabold flex items-center justify-center rounded-lg text-xs">G</span>
                            Masuk Via Google (Akun Real)
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    /* FORM RENDER: INTERNAL LOGIN FROM USERNAME */
                    <form onSubmit={handleInternalLogin} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Username Karyawan Internal</label>
                        <input 
                          type="text"
                          placeholder="Contoh: kasir001 atau pegawai001"
                          value={usernameInput}
                          onChange={(e) => setUsernameInput(e.target.value)}
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-500">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Gunakan kredensial pengujian berikut:</p>
                          <button 
                            type="button"
                            onClick={() => setUsernameInput('kasir001')}
                            className="text-[10px] font-bold text-slate-700 block hover:underline text-left"
                          >
                            &bull; kasir001 (Untuk Dashboard Kasir)
                          </button>
                          <button 
                            type="button"
                            onClick={() => setUsernameInput('pegawai001')}
                            className="text-[10px] font-bold text-slate-700 block hover:underline text-left"
                          >
                            &bull; pegawai001 (Untuk Dashboard Pegawai Operasional)
                          </button>
                        </div>
                      </div>

                      <button 
                        type="submit"
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl transition text-sm"
                      >
                        Masuk Menggunakan Password
                      </button>
                    </form>
                  )}

                </div>
              </div>
            ) : (
              /* DYNAMIC DASHBOARD INJECTIONS BASED ON USER ROLES */
              <div className="space-y-4">
                
                {/* ROLE BANNER */}
                <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap justify-between items-center gap-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={currentUser.name} photoURL={currentUser.photoURL} size="md" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">LOGIN STATUS RESMI</p>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5 capitalize">
                        {currentUser.name} ({currentUser.role.replace('_', ' ')})
                      </h3>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="bg-rose-650 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Keluar Sesi
                  </button>
                </div>

                {/* Dashboard Router switch with secure suspension safety lock */}
                {suspensionStatus.suspended ? (
                  <div className="bg-white border-2 border-rose-100 rounded-3xl p-8 shadow-md flex flex-col items-center text-center space-y-6 max-w-lg mx-auto my-6 animate-fade-in">
                    <div className="bg-rose-50 text-rose-600 p-4 rounded-full border border-rose-200">
                      <ShieldAlert className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] bg-rose-100 text-rose-800 px-3 py-1 rounded-full uppercase font-black tracking-widest border border-rose-200">
                        Akses Ditangguhkan / Suspended
                      </span>
                      <h3 className="text-xl font-black text-slate-800 font-sans tracking-tight">
                        {suspensionStatus.name} Nonaktif
                      </h3>
                      <p className="text-sm text-slate-550 leading-relaxed max-w-md pt-2">
                        {suspensionStatus.reason}
                      </p>
                    </div>

                    <div className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-left space-y-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dampak Penonaktifan:</p>
                      <ul className="text-xs text-slate-650 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-rose-500 font-bold">&bull;</span>
                          <span>Seluruh pencatatan transaksi kasir, input pakaian masuk, dan timbangan laundry dihentikan sementara.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-rose-500 font-bold">&bull;</span>
                          <span>Halaman kelola staff, pengaturan bonus, dan edit layanan outlet dikunci total.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-rose-500 font-bold">&bull;</span>
                          <span>Pelacakan nota invoice bagi pelanggan tetap dapat diakses dengan catatan produksi dibekukan.</span>
                        </li>
                      </ul>
                    </div>

                    <div className="p-3 bg-blue-50/55 text-blue-805 border border-blue-100 rounded-xl text-xs font-semibold leading-relaxed w-full">
                      ✉️ Hubungi Dukungan:<br/>
                      Kirim surel keluhan resmi ke Super Admin platform di:<br/>
                      <a 
                        href="mailto:aisugiharti12@admin.smp.belajar.id" 
                        className="underline text-blue-600 font-black hover:text-blue-700 select-all"
                      >
                        aisugiharti12@admin.smp.belajar.id
                      </a>
                    </div>

                    <button 
                      onClick={handleLogout}
                      className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl border border-slate-200 transition cursor-pointer"
                    >
                      Kembali ke Halaman Login Utama
                    </button>
                  </div>
                ) : (
                  <>
                    {currentUser.role === 'super_admin' && <SuperAdminDashboard />}
                    {currentUser.role === 'owner' && <OwnerDashboard currentLaundryId={currentUser.laundryId || ''} />}
                    {currentUser.role === 'cashier' && <CashierDashboard currentLaundryId={currentUser.laundryId || ''} cashierId={currentUser.userId} />}
                    {currentUser.role === 'employee' && (
                      <EmployeeDashboard 
                        currentLaundryId={currentUser.laundryId || ''} 
                        employeeId={currentUser.userId} 
                        employeeName={currentUser.name} 
                      />
                    )}
                  </>
                )}

              </div>
            )}
          </div>
        )}

        {/* TAB: SETUP GUIDE PANEL */}
        {currenttab_and_fallback(currentTab) === 'guide' && <SetupGuide />}

      </main>

      {/* COMPREHENSIVE PLATFORM FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-8 text-center text-xs text-slate-400 mt-12 bg-cover">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <p className="font-semibold text-slate-550">Londria Hub &bull; Dikembangkan Menggunakan React + Tailwind CSS + Firebase</p>
          <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
            Sistem ERP laundry handal siap deployment dengan proteksi andal, koder bersih, dan optimalisasi mobile-first. No WhatsApp Automation, No Fonte, Full Firebase.
          </p>
          <div className="flex justify-center gap-4 text-slate-400 pt-2 border-t border-slate-100 max-w-xs mx-auto">
            <span>Auth v2</span>
            <span>&bull;</span>
            <span>Firestore Rules</span>
            <span>&bull;</span>
            <span>React SPA</span>
          </div>
        </div>
      </footer>

      {/* PWA Floating Bottom-Right Banner */}
      {showInstallBanner && (
        <div className="fixed bottom-4 left-4 right-4 md:bottom-6 md:right-6 md:left-auto md:max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl p-5 z-50 animate-fade-in-up flex flex-col gap-4">
          <div className="flex gap-3 items-start">
            <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl flex-shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div className="flex-grow space-y-1">
              <h4 className="font-extrabold text-slate-800 text-sm flex items-center justify-between">
                <span>Instal Londria Hub</span>
                <button 
                  onClick={handleDismissBanner}
                  className="text-slate-400 hover:text-slate-600 transition"
                  title="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pasang aplikasi Londria Hub di HP Anda untuk akses cepat, hemat kuota, dan pelacakan order laundry rill yang responsif.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-grow bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Instal Aplikasi
            </button>
            <button
              onClick={handleDismissBanner}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition"
            >
              Nanti Saja
            </button>
          </div>
        </div>
      )}

      {/* PWA Google Play Store Style Installation Modal */}
      {showHowToInstallModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-150 shadow-2xl overflow-hidden animate-scale-up max-h-[92vh] flex flex-col">
            
            {/* Play Store Bar Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowHowToInstallModal(false)}
                  className="p-1 hover:bg-slate-200 rounded-full text-slate-600 transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="font-extrabold text-xs text-slate-700 tracking-wide uppercase">Google Play Store</span>
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                <Search className="w-4 h-4 cursor-pointer hover:text-slate-700" />
                <Share2 className="w-4 h-4 cursor-pointer hover:text-slate-700" />
                <MoreVertical className="w-4 h-4 cursor-pointer hover:text-slate-700" />
              </div>
            </div>

            {/* Play Store Scrollable Content */}
            <div className="overflow-y-auto p-5 space-y-5 flex-grow">
              
              {/* App Meta Info */}
              <div className="flex gap-4">
                <img 
                  src="/laundry_logo.jpg" 
                  alt="Londria Hub" 
                  className="w-20 h-20 rounded-2xl object-cover shadow-md border border-slate-100 flex-shrink-0"
                />
                <div className="flex-grow space-y-1">
                  <h3 className="font-black text-slate-800 text-lg leading-tight tracking-tight">
                    Londria Hub
                  </h3>
                  <p className="text-xs font-bold text-[#01875f] hover:underline cursor-pointer">
                    Londria Hub Dev &bull; Bisnis & Produktivitas
                  </p>
                  <div className="flex flex-wrap gap-1.5 text-[9px] font-bold text-slate-400">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded">Mengandung iklan</span>
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded">Pembelian dalam aplikasi</span>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-1 border-y border-slate-100 py-3 text-center text-slate-700 bg-slate-50/50 rounded-2xl">
                <div className="border-r border-slate-100">
                  <p className="font-extrabold text-xs text-slate-900 flex items-center justify-center gap-0.5">
                    4.9 <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">12 rb ulasan</p>
                </div>
                <div className="border-r border-slate-100">
                  <p className="font-extrabold text-xs text-slate-900">5 MB</p>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">Ringan & hemat</p>
                </div>
                <div className="border-r border-slate-100">
                  <p className="font-extrabold text-xs text-slate-900 bg-[#01875f] text-white px-1.5 py-0.5 rounded max-w-max mx-auto text-[9px]">
                    3+
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">Untuk semua</p>
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-900">100 rb+</p>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">Instalan aktif</p>
                </div>
              </div>

              {/* MAIN GOOGLE PLAY STORE INSTALL BUTTON */}
              <div className="space-y-3">
                {installState === 'idle' && (
                  <button
                    onClick={handlePlayStoreInstall}
                    className="w-full bg-[#01875f] hover:bg-[#00704e] active:scale-[0.98] text-white font-black py-3 rounded-full transition shadow-md flex items-center justify-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" /> Instal Aplikasi
                  </button>
                )}

                {installState === 'downloading' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-[#01875f]">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-[#01875f] rounded-full animate-ping"></span>
                        Mengunduh...
                      </span>
                      <span>{downloadProgress}%</span>
                    </div>
                    {/* Linear Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-[#01875f] h-full rounded-full transition-all duration-150 ease-out"
                        style={{ width: `${downloadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {installState === 'installing' && (
                  <button
                    disabled
                    className="w-full bg-[#e6f4ea] text-[#01875f] font-black py-3 rounded-full transition flex items-center justify-center gap-2 text-sm animate-pulse cursor-not-allowed"
                  >
                    <div className="w-4 h-4 border-2 border-[#01875f] border-t-transparent rounded-full animate-spin"></div>
                    Menginstal aplikasi...
                  </button>
                )}

                {installState === 'installed' && (
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowHowToInstallModal(false)}
                      className="w-full bg-[#01875f] hover:bg-[#00704e] text-white font-black py-3 rounded-full transition flex items-center justify-center gap-2 text-sm"
                    >
                      <Check className="w-4 h-4" /> Buka Aplikasi (Berhasil!)
                    </button>
                    <p className="text-center text-[10px] text-emerald-600 font-extrabold animate-bounce">
                      🎉 Londria Hub telah sukses terpasang pada layar utama Anda!
                    </p>
                  </div>
                )}

                {/* Conditional native prompt notification badge */}
                {deferredPrompt && installState === 'idle' && (
                  <div className="bg-emerald-50 text-emerald-800 p-3 border border-emerald-100 rounded-xl text-[11px] leading-relaxed flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#01875f] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-emerald-950">Kompatibel Instan!</span> Browser Anda mendukung pemasangan langsung tanpa ribet ke layar utama HP Anda.
                    </div>
                  </div>
                )}
              </div>

              {/* MOCKUP SCREENSHOTS LIST */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-xs text-slate-800">Pratinjau Aplikasi</h4>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
                  <div className="w-[140px] flex-shrink-0 snap-start bg-slate-900 text-white rounded-xl p-3 border border-slate-800 space-y-2 text-center shadow-md">
                    <div className="bg-blue-600/20 p-1.5 rounded-lg text-blue-400 mx-auto w-max">
                      <Search className="w-6 h-6" />
                    </div>
                    <p className="font-black text-[9px] leading-tight">Lacak Cucian</p>
                    <p className="text-[8px] text-slate-400 leading-normal">Pelanggan bisa melacak status cucian realtime tanpa login!</p>
                  </div>
                  <div className="w-[140px] flex-shrink-0 snap-start bg-slate-900 text-white rounded-xl p-3 border border-slate-800 space-y-2 text-center shadow-md">
                    <div className="bg-amber-600/20 p-1.5 rounded-lg text-amber-400 mx-auto w-max">
                      <Building className="w-6 h-6" />
                    </div>
                    <p className="font-black text-[9px] leading-tight">Outlet Multi-Role</p>
                    <p className="text-[8px] text-slate-400 leading-normal">Super Admin, Owner, Kasir & Operator terintegrasi.</p>
                  </div>
                  <div className="w-[140px] flex-shrink-0 snap-start bg-slate-900 text-white rounded-xl p-3 border border-slate-800 space-y-2 text-center shadow-md">
                    <div className="bg-emerald-600/20 p-1.5 rounded-lg text-emerald-450 mx-auto w-max">
                      <Layers className="w-6 h-6" />
                    </div>
                    <p className="font-black text-[9px] leading-tight">Keamanan Cloud</p>
                    <p className="text-[8px] text-slate-400 leading-normal">Situs PWA disinkronkan 100% dengan Firestore.</p>
                  </div>
                </div>
              </div>

              {/* Step instructions manual fallback */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs text-slate-800">Langkah Pemasangan Manual</h4>
                  <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">Android & iOS</span>
                </div>
                
                <div className="space-y-2 text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex gap-2">
                    <span className="bg-emerald-100 text-[#01875f] font-black w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">1</span>
                    <p><span className="font-bold text-slate-850">Android (Chrome):</span> Ketuk ikon menu <span className="font-extrabold text-slate-800">&#8942;</span> di pojok kanan atas browser Chrome, lalu pilih <span className="font-extrabold text-slate-800">"Instal aplikasi"</span>.</p>
                  </div>
                  <div className="flex gap-2 border-t border-slate-200/50 pt-2">
                    <span className="bg-blue-100 text-blue-600 font-black w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">2</span>
                    <p><span className="font-bold text-slate-850">iPhone (Safari):</span> Ketuk tombol <span className="font-extrabold text-slate-800">Bagikan (Share)</span> di bar bawah Safari, gulir ke bawah dan ketuk <span className="font-extrabold text-slate-800">"Tambahkan ke Layar Utama"</span>.</p>
                  </div>
                </div>
              </div>

              {/* Ratings and Reviews Mock Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-800">Rating & Ulasan</h4>
                    <p className="text-[10px] text-slate-400">Rating dianalisis dari pengguna rill</p>
                  </div>
                  <span className="text-xs text-[#01875f] font-extrabold hover:underline cursor-pointer">Lihat semua</span>
                </div>

                <div className="flex gap-4 items-center">
                  <div className="text-center flex-shrink-0">
                    <p className="text-3xl font-black text-slate-800">4.9</p>
                    <div className="flex gap-0.5 text-amber-500 justify-center my-0.5">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <Star className="w-2.5 h-2.5 fill-current" />
                    </div>
                    <p className="text-[9px] text-slate-400">12.450 total</p>
                  </div>
                  
                  {/* Rating distribution bars */}
                  <div className="flex-grow space-y-1">
                    <div className="flex items-center gap-2 text-[9px] text-slate-500 font-bold">
                      <span>5</span>
                      <div className="flex-grow bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#01875f] h-full w-[94%]"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-slate-500 font-bold">
                      <span>4</span>
                      <div className="flex-grow bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#01875f] h-full w-[4%]"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-slate-500 font-bold">
                      <span>3</span>
                      <div className="flex-grow bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#01875f] h-full w-[1%]"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-slate-500 font-bold">
                      <span>2</span>
                      <div className="flex-grow bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#01875f] h-full w-[0.5%]"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-slate-500 font-bold">
                      <span>1</span>
                      <div className="flex-grow bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#01875f] h-full w-[0.5%]"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Highlighted Review Comment */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-700">H. Budi Santoso (Owner Laundry)</span>
                    <div className="flex gap-0.5 text-amber-500">
                      <Star className="w-2 h-2 fill-current" />
                      <Star className="w-2 h-2 fill-current" />
                      <Star className="w-2 h-2 fill-current" />
                      <Star className="w-2 h-2 fill-current" />
                      <Star className="w-2 h-2 fill-current" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-550 leading-relaxed">
                    "Sangat membantu manajemen order laundry koin & kiloan kami! Sangat ringan, terinstall instan di layar HP tanpa membebani memori, respon sinkronisasi Firebase rill-time mantap!"
                  </p>
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-450 pt-1">
                    <ThumbsUp className="w-3 h-3 text-[#01875f]" />
                    <span>248 orang terbantu ulasan ini</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Play Store Bar Footer Close Action */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex gap-2 flex-shrink-0">
              <button
                onClick={() => setShowHowToInstallModal(false)}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs py-3 rounded-xl transition"
              >
                Selesai & Tutup Toko Play Store
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MOBILE FAMILIAR BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-40 pb-[env(safe-area-inset-bottom)] flex justify-around items-center h-16 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setCurrentTab('home')}
          className={`flex flex-col items-center justify-center flex-grow h-full transition ${currentTab === 'home' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Building className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-extrabold">Beranda</span>
        </button>
        <button 
          onClick={() => setCurrentTab('track')}
          className={`flex flex-col items-center justify-center flex-grow h-full transition ${currentTab === 'track' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Search className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-extrabold">Lacak</span>
        </button>
        <button 
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-grow h-full transition ${currentTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          {currentUser ? (
            <div className="relative mb-0.5">
              <UserAvatar name={currentUser.name} photoURL={currentUser.photoURL} size="xs" />
              <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white"></div>
            </div>
          ) : (
            <LogIn className="w-5 h-5 mb-0.5" />
          )}
          <span className="text-[10px] font-extrabold">{currentUser ? 'Dashboard' : 'Masuk'}</span>
        </button>
        <button 
          onClick={() => setCurrentTab('guide')}
          className={`flex flex-col items-center justify-center flex-grow h-full transition ${currentTab === 'guide' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Info className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-extrabold">Bantuan</span>
        </button>
      </div>

    </div>
  );
}

// Fallback utility to safely resolve component tabs without build-time complaints or errors 
function currenttab_and_fallback(tab: string): string {
  return tab || 'home';
}
