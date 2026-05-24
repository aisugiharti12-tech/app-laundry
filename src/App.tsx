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
  ChevronRight
} from 'lucide-react';
import { laundryService, useRealFirebase } from './firebase';
import { UserProfile, UserRole } from './types';

// Importing Dashboard sub-components
import TrackingView from './components/TrackingView';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import OwnerDashboard from './components/OwnerDashboard';
import CashierDashboard from './components/CashierDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import SetupGuide from './components/SetupGuide';

export default function App() {
  const [currentTab, setCurrentTab] = React.useState<'home' | 'track' | 'dashboard' | 'guide'>('home');
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);

  // Authentication Forms State
  const [loginMethod, setLoginMethod] = React.useState<'google' | 'internal'>('google');
  const [emailInput, setEmailInput] = React.useState('');
  const [usernameInput, setUsernameInput] = React.useState('');
  const [loginError, setLoginError] = React.useState('');

  // Loaded at boot
  React.useEffect(() => {
    const active = laundryService.getCurrentSimulatedUser();
    if (active) setCurrentUser(active);
  }, []);

  const handleGoogleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!emailInput.trim()) {
      setLoginError('Masukkan email Gmail aktif.');
      return;
    }

    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern.test(emailInput.trim())) {
      setLoginError('Format email tidak valid.');
      return;
    }

    const profile = laundryService.loginGoogleSimulated(emailInput.trim().toLowerCase());
    setCurrentUser(profile);
    setCurrentTab('dashboard');
    setEmailInput('');
  };

  const handleInternalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!usernameInput.trim()) {
      setLoginError('Masukkan username karyawan.');
      return;
    }

    const profile = laundryService.loginInternalSimulated(usernameInput.trim().toLowerCase());
    if (profile) {
      setCurrentUser(profile);
      setCurrentTab('dashboard');
      setUsernameInput('');
    } else {
      setLoginError('User internal tidak ditemukan. Mintalah Owner laundry mendaftarkan Anda.');
    }
  };

  const handleLogout = () => {
    laundryService.logout();
    setCurrentUser(null);
    setCurrentTab('home');
  };

  const handleResetDemoDb = () => {
    if (window.confirm('Reset database lokal? Seluruh order transaksi buatan Anda akan terhapus dan kembali ke setingan awal.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-blue-105">
      
      {/* FLOATING TOP DEVELOPMENT NOTIFICATION BAR */}
      <div className="bg-slate-900 text-white py-2.5 px-4 text-center text-xs flex flex-wrap items-center justify-center gap-3 border-b border-slate-800">
        <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-bold uppercase text-[9px] tracking-wider">
          <Activity className="w-3.5 h-3.5" /> Demo Sandbox Mode
        </span>
        <p className="text-slate-350 font-medium">
          Aplikasi berjalan di mode Sandbox Lokal. Kode siap dihubungkan 100% dengan database Firebase Anda.
        </p>
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentTab('guide')}
            className="text-[10px] font-bold bg-amber-500 text-slate-950 px-2.5 py-1 rounded-md hover:bg-amber-400 transition"
          >
            Lihat Panduan Firebase
          </button>
          <button 
            onClick={handleResetDemoDb}
            className="text-[10px] font-bold bg-slate-800 hover:bg-slate-705 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-md transition flex items-center gap-1"
          >
            <RefreshCcw className="w-3 h-3" /> Reset Demo
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
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-xl transition"
                  title="Ke Dashboard"
                >
                  <User className="w-4 h-4" />
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
                    Masuk Ke Simulator
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
                <h3 className="font-extrabold text-white text-lg mb-4">Uji Coba Empat Peran Pengguna (Multi-Role)</h3>
                <p className="text-slate-400 text-xs mb-6">Nikmati kemudahan simulasi dengan akun instan di bawah ini pada halaman login:</p>
                
                <div className="space-y-4">
                  {[
                    { role: 'Super Admin', task: 'Melihat statistik global & buat laundry pemilik baru.', user: 'aisugiharti12@admin.smp.belajar.id' },
                    { role: 'Owner Laundry / Admin', task: 'Mengatur harga jasa & daftarkan akun karyawan.', user: 'owner@laundry.com' },
                    { role: 'Kasir Laundry', task: 'Input laundry ditimbang, proses kasir & cetak struk thermal.', user: 'kasir001' },
                    { role: 'Pegawai Cuci / Lapangan', task: 'Operator cuci-timbang yang update progres basah-kering.', user: 'pegawai001' }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 items-start bg-slate-900/60 p-4 border border-slate-800 rounded-2xl">
                      <div className="bg-blue-500/10 text-blue-400 p-2 rounded-xl text-xs font-bold w-10 text-center flex-shrink-0">
                        0{i+1}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-200 text-sm">{item.role}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.task}</p>
                        <p className="text-[10px] font-mono text-blue-400 font-bold mt-1 bg-blue-950/40 w-fit px-2 py-0.5 rounded border border-blue-500/20">Login: {item.user}</p>
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
                    <form onSubmit={handleGoogleLogin} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Alamat Email Owner / Admin</label>
                        <input 
                          type="email"
                          placeholder="Ketik email, contoh: owner@laundry.com"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="mt-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-1.5">
                          <p className="text-[10px] text-blue-755 font-bold uppercase tracking-wider">Metode Demo Email Shortcut:</p>
                          <button 
                            type="button"
                            onClick={() => setEmailInput('aisugiharti12@admin.smp.belajar.id')}
                            className="text-[10px] text-blue-600 block hover:underline font-bold text-left"
                          >
                            &bull; aisugiharti12@admin.smp.belajar.id (Super Admin)
                          </button>
                          <button 
                            type="button"
                            onClick={() => setEmailInput('owner@laundry.com')}
                            className="text-[10px] text-blue-600 block hover:underline font-bold text-left"
                          >
                            &bull; owner@laundry.com (Hj. Sugiharti - Owner Clean & Fresh)
                          </button>
                        </div>
                      </div>

                      <button 
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-sm"
                      >
                        Simulasi Google Login Pop-up
                      </button>
                    </form>
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
                    <div className="bg-blue-500 text-white p-2 rounded-xl">
                      <User className="w-5 h-5" />
                    </div>
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

                {/* Dashboard Router switch */}
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

    </div>
  );
}

// Fallback utility to safely resolve component tabs without build-time complaints or errors 
function currenttab_and_fallback(tab: string): string {
  return tab || 'home';
}
