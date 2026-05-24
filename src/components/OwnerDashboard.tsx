/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  BarChart3, 
  Settings, 
  Users, 
  Trash2, 
  Plus, 
  CheckCircle, 
  DollarSign, 
  ShoppingBag, 
  Tag, 
  AlertCircle,
  Hash,
  Activity,
  FileSpreadsheet,
  Calendar,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { laundryService } from '../firebase';
import { Laundry, LaundryService as ServiceModel, UserProfile, LaundryOrder } from '../types';
import UserAvatar from './UserAvatar';

interface OwnerDashboardProps {
  currentLaundryId: string;
}

export default function OwnerDashboard({ currentLaundryId }: OwnerDashboardProps) {
  const [activeTab, setActiveTab] = React.useState<'summary' | 'services' | 'staff' | 'orders' | 'settings'>('summary');
  
  // Data States
  const [laundry, setLaundry] = React.useState<Laundry | null>(null);
  const [services, setServices] = React.useState<ServiceModel[]>([]);
  const [staff, setStaff] = React.useState<UserProfile[]>([]);
  const [orders, setOrders] = React.useState<LaundryOrder[]>([]);

  // Report Period & Filter States
  const [filterPeriod, setFilterPeriod] = React.useState<'all' | 'weekly' | 'monthly' | 'custom'>('all');
  const [startDate, setStartDate] = React.useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = React.useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Action Form States
  const [newServiceName, setNewServiceName] = React.useState('');
  const [newServicePrice, setNewServicePrice] = React.useState<number>(0);
  const [newServiceUnit, setNewServiceUnit] = React.useState<'kg' | 'pcs'>('kg');
  const [newServiceDays, setNewServiceDays] = React.useState<number>(3);

  // Staff Form States
  const [staffName, setStaffName] = React.useState('');
  const [staffUsername, setStaffUsername] = React.useState('');
  const [staffRole, setStaffRole] = React.useState<'cashier' | 'employee'>('employee');
  const [staffError, setStaffError] = React.useState('');

  // Outlet Information Edit States
  const [outletName, setOutletName] = React.useState('');
  const [outletAddress, setOutletAddress] = React.useState('');
  const [outletPhone, setOutletPhone] = React.useState('');
  const [outletSuccess, setOutletSuccess] = React.useState('');
  const [outletError, setOutletError] = React.useState('');

  // Owner Personal Profile Edit States
  const [profileName, setProfileName] = React.useState('');
  const [profilePhoto, setProfilePhoto] = React.useState('');
  const [profileSuccess, setProfileSuccess] = React.useState('');
  const [profileError, setProfileError] = React.useState('');

  const currentUser = laundryService.getCurrentSimulatedUser();

  // Guard changes on laundry fields securely using reactive effect
  React.useEffect(() => {
    if (laundry) {
      setOutletName(laundry.name);
      setOutletAddress(laundry.address);
      setOutletPhone(laundry.phone);
    }
  }, [laundry?.laundryId, laundry?.name, laundry?.address, laundry?.phone]);

  // Guard changes on user fields securely using reactive effect
  React.useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name);
      setProfilePhoto(currentUser.photoURL || '');
    }
  }, [currentUser?.userId]);

  const loadAllData = () => {
    // 1. Load laundry information
    const laundries = laundryService.getLaundries();
    const lnd = laundries.find(item => item.laundryId === currentLaundryId);
    if (lnd) setLaundry(lnd);

    // 2. Load services
    setServices(laundryService.getServices(currentLaundryId));

    // 3. Load staff
    setStaff(laundryService.getLaundryStaff(currentLaundryId));

    // 4. Load orders
    setOrders(laundryService.getOrders(currentLaundryId));
  };

  React.useEffect(() => {
    loadAllData();
    const unsubscribe = laundryService.subscribeToChanges(() => {
      loadAllData();
    });
    return () => unsubscribe();
  }, [currentLaundryId]);

  // Handle adding a laundry service
  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim() || newServicePrice <= 0) return;

    laundryService.addService({
      laundryId: currentLaundryId,
      name: newServiceName,
      price: Number(newServicePrice),
      unit: newServiceUnit,
      estimateDays: Number(newServiceDays)
    });

    // Reset Form
    setNewServiceName('');
    setNewServicePrice(0);
    setNewServiceUnit('kg');
    setNewServiceDays(3);

    // Reload layanans
    loadAllData();
  };

  const handleDeleteService = (serviceId: string) => {
    laundryService.deleteService(serviceId);
    loadAllData();
  };

  // Handle adding staff accounts (strictly enforce exactly 1 cashier maximum)
  const handleAddStaffAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');

    if (!staffName.trim() || !staffUsername.trim()) {
      setStaffError('Lengkapi nama dan username karyawan.');
      return;
    }

    // Validation rule: Owner ONLY allowed of strictly 1 Cashier account maximum!
    if (staffRole === 'cashier') {
      const existingCashiers = staff.filter(s => s.role === 'cashier');
      if (existingCashiers.length >= 1) {
        setStaffError('Sesuai aturan keamanan, Outlet Anda dibatasi maksimal hanya boleh memiliki 1 akun KASIR.');
        return;
      }
    }

    // Check duplicate username
    const allUsers = laundryService.getLaundryStaff(currentLaundryId);
    if (allUsers.some(u => u.username?.toLowerCase() === staffUsername.trim().toLowerCase())) {
      setStaffError(`Username "${staffUsername}" telah digunakan karyawan lain.`);
      return;
    }

    laundryService.createStaffAccount(currentLaundryId, staffName, staffUsername.toLowerCase(), staffRole);
    
    // Clear Form
    setStaffName('');
    setStaffUsername('');
    setStaffRole('employee');

    loadAllData();
  };

  const handleDeleteStaff = (userId: string) => {
    laundryService.deleteStaffAccount(userId);
    loadAllData();
  };

  const handleUpdateOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    setOutletSuccess('');
    setOutletError('');
    if (!outletName.trim() || !outletAddress.trim() || !outletPhone.trim()) {
      setOutletError('Mohon isi semua data outlet laundry.');
      return;
    }
    try {
      await laundryService.updateLaundryDetails(currentLaundryId, outletName.trim(), outletAddress.trim(), outletPhone.trim());
      setOutletSuccess('Sukses! Informasi outlet laundry berhasil diperbarui.');
      setTimeout(() => setOutletSuccess(''), 4000);
    } catch (err: any) {
      setOutletError(err.message || 'Gagal menyimpan perubahan.');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    if (!profileName.trim()) {
      setProfileError('Nama lengkap tidak boleh kosong.');
      return;
    }
    if (!currentUser) return;
    try {
      await laundryService.updateUserProfile(currentUser.userId, profileName.trim(), profilePhoto.trim());
      setProfileSuccess('Sukses! Profil pribadi berhasil diperbarui.');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err: any) {
      setProfileError(err.message || 'Gagal menyimpan profil.');
    }
  };

  // Calculation of Stats
  const revenueTotal = orders
    .filter(o => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const activeOrdersCount = orders.filter(o => o.laundryStatus !== 'diambil' && o.laundryStatus !== 'selesai').length;
  const completedOrdersCount = orders.filter(o => o.laundryStatus === 'selesai' || o.laundryStatus === 'diambil').length;

  // Filtered orders based on selected report period (weekly, monthly, custom start-end / "dari tanggal berapa sampai tanggal berapa")
  const filteredReportOrders = React.useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return orders.filter(o => {
      if (!o.createdAt) return false;
      const orderDate = new Date(o.createdAt);

      if (filterPeriod === 'weekly') {
        const lastWeek = new Date();
        lastWeek.setDate(today.getDate() - 7);
        lastWeek.setHours(0, 0, 0, 0);
        return orderDate >= lastWeek && orderDate <= today;
      }

      if (filterPeriod === 'monthly') {
        const lastMonth = new Date();
        lastMonth.setDate(today.getDate() - 30);
        lastMonth.setHours(0, 0, 0, 0);
        return orderDate >= lastMonth && orderDate <= today;
      }

      if (filterPeriod === 'custom') {
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (orderDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (orderDate > end) return false;
        }
        return true;
      }

      return true; // 'all'
    });
  }, [orders, filterPeriod, startDate, endDate]);

  // Calculations for dynamic selected period preview cards
  const periodPaidRevenue = React.useMemo(() => {
    return filteredReportOrders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.totalPrice, 0);
  }, [filteredReportOrders]);

  const periodUnpaidRevenue = React.useMemo(() => {
    return filteredReportOrders
      .filter(o => o.paymentStatus === 'unpaid')
      .reduce((sum, o) => sum + o.totalPrice, 0);
  }, [filteredReportOrders]);

  const periodVolumeKg = React.useMemo(() => {
    return filteredReportOrders
      .filter(o => o.unit === 'kg')
      .reduce((sum, o) => sum + o.weight, 0);
  }, [filteredReportOrders]);

  const periodVolumePcs = React.useMemo(() => {
    return filteredReportOrders
      .filter(o => o.unit === 'pcs')
      .reduce((sum, o) => sum + o.weight, 0);
  }, [filteredReportOrders]);

  // Excel (.xlsx) file generator trigger
  const handleExportToExcel = () => {
    if (filteredReportOrders.length === 0) {
      alert("Tidak ada data transaksi yang dapat diekspor untuk periode terpilih.");
      return;
    }

    // Build human-friendly columns for sheet
    const listForExcel = filteredReportOrders.map((o, idx) => ({
      "No.": idx + 1,
      "Nomor Invoice": o.invoiceNo,
      "Nama Pelanggan": o.customerName,
      "Nomor HP": o.customerPhone,
      "Nama Layanan": o.serviceName,
      "Bobot Cucian": o.weight,
      "Satuan": o.unit.toUpperCase(),
      "Harga Satuan (Rp)": o.servicePrice,
      "Total Biaya (Rp)": o.totalPrice,
      "Status Pembayaran": o.paymentStatus === 'paid' ? 'LUNAS (PAID)' : 'BELUM BAYAR (UNPAID)',
      "Status Proses Laundry": o.laundryStatus.toUpperCase(),
      "Kasir Pembuat": o.cashierId || '-',
      "Tanggal Masuk": new Date(o.createdAt).toLocaleString('id-ID'),
      "Estimasi Selesai": o.estimatedCompletion ? new Date(o.estimatedCompletion).toLocaleString('id-ID') : '-',
      "Catatan Nota": o.notes || '-'
    }));

    // Generate SheetJS workbook & worksheet objects
    const worksheet = XLSX.utils.json_to_sheet(listForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Transaksi");

    // Add visual column cell limits to fit typography sizes beautifully
    worksheet['!cols'] = [
      { wch: 6 },   // No.
      { wch: 16 },  // Nomor Invoice
      { wch: 22 },  // Nama Pelanggan
      { wch: 16 },  // Nomor HP
      { wch: 26 },  // Nama Layanan
      { wch: 13 },  // Bobot Cucian
      { wch: 10 },  // Satuan
      { wch: 17 },  // Harga Satuan
      { wch: 17 },  // Total Biaya
      { wch: 24 },  // Status Pembayaran
      { wch: 22 },  // Status Proses Laundry
      { wch: 16 },  // Kasir Pembuat
      { wch: 22 },  // Tanggal Masuk
      { wch: 22 },  // Estimasi Selesai
      { wch: 28 },  // Catatan Nota
    ];

    // Determine filename period descriptor
    let dateStr = 'Masing_Semua';
    if (filterPeriod === 'weekly') {
      dateStr = '7_Hari_Terakhir';
    } else if (filterPeriod === 'monthly') {
      dateStr = '30_Hari_Terakhir';
    } else if (filterPeriod === 'custom') {
      dateStr = `Rentang_${startDate}_s_d_${endDate}`;
    }

    const cleanLaundryName = (laundry?.name || 'Laundry').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Laporan_Laundry_${cleanLaundryName}_${dateStr}.xlsx`;

    // Download file locally to browser
    XLSX.writeFile(workbook, filename);
  };

  const formatRupiah = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-5 gap-4">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{laundry?.name || 'Laundry Milik Saya'}</span>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Owner Laundry Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 border bg-slate-50 border-slate-200 px-3 py-1.5 rounded-xl text-slate-500 text-xs">
          <Activity className="w-4 h-4 text-emerald-500" />
          {laundry?.address}
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-1">
        <button 
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm transition-all flex-shrink-0 ${
            activeTab === 'summary' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Ringkasan Laporan
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm transition-all flex-shrink-0 ${
            activeTab === 'orders' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Semua Cucian ({orders.length})
        </button>
        <button 
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm transition-all flex-shrink-0 ${
            activeTab === 'services' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tag className="w-4 h-4" />
          Atur Harga Layanan
        </button>
        <button 
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm transition-all flex-shrink-0 ${
            activeTab === 'staff' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Kelola Akses Karyawan
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm transition-all flex-shrink-0 ${
            activeTab === 'settings' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          Pengaturan Outlet & Profil
        </button>
      </div>

      {/* SUMMARY PANEL */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Pendapatan Bersih (Lunas)</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-emerald-600">{formatRupiah(revenueTotal)}</span>
                <span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign className="w-5 h-5" /></span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Pesanan Sedang Diproses</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-blue-600">{activeOrdersCount} Order</span>
                <span className="p-3 bg-blue-50 text-blue-600 rounded-xl"><ShoppingBag className="w-5 h-5" /></span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Selesai / Diambil</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-slate-600">{completedOrdersCount} Order</span>
                <span className="p-3 bg-slate-50 text-slate-600 rounded-xl"><CheckCircle className="w-5 h-5" /></span>
              </div>
            </div>
          </div>

          {/* EXCEL REPORT PERIOD FILTER & EXPORT WIDGET */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-50/50 pb-5">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  Pusat Laporan & Ekspor Excel (.xlsx)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Tentukan rentang tanggal laporan transaksi, pantapan ringkasan statistiknya langsung, dan unduh sebagai file Microsoft Excel.
                </p>
              </div>

              {/* ACTION: DOWNLOAD Excel FILE BUTTON */}
              <button
                type="button"
                onClick={handleExportToExcel}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-3 rounded-xl transition text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/10 self-start md:self-auto w-full md:w-auto"
              >
                <Download className="w-4 h-4" />
                Ekspor Laporan Excel ({filteredReportOrders.length} Order)
              </button>
            </div>

            {/* CONTROLS CONTROLLER FOR REPORT STATS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* PERIOD BUTTONS ACTIONS */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Pilih Periode Laporan:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFilterPeriod('all')}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition text-center cursor-pointer ${
                      filterPeriod === 'all'
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-slate-250 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Semua Transaksi
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterPeriod('weekly')}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition text-center cursor-pointer ${
                      filterPeriod === 'weekly'
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-slate-250 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Mingguan (7 Hari)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterPeriod('monthly')}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition text-center cursor-pointer ${
                      filterPeriod === 'monthly'
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-slate-250 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Bulanan (30 Hari)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterPeriod('custom')}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition text-center cursor-pointer ${
                      filterPeriod === 'custom'
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-slate-250 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Rentang Kustom
                  </button>
                </div>
              </div>

              {/* DATE PICKERS SECTOR */}
              <div className="lg:col-span-2 space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  {filterPeriod === 'custom' ? 'Tentukan Tanggal Rentang Kustom (Mulai - Akhir):' : 'Status Rentang Tanggal:'}
                </span>
                
                {filterPeriod === 'custom' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <span className="absolute left-3.5 top-3.5 text-slate-400"><Calendar className="w-4 h-4" /></span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="absolute -top-2 left-3 px-1.5 text-[9px] bg-white font-bold text-slate-400 uppercase tracking-widest">Tanggal Mulai</span>
                    </div>

                    <div className="relative">
                      <span className="absolute left-3.5 top-3.5 text-slate-400"><Calendar className="w-4 h-4" /></span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="absolute -top-2 left-3 px-1.5 text-[9px] bg-white font-bold text-slate-400 uppercase tracking-widest">Tanggal Akhir</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between text-xs text-slate-500 h-[52px]">
                    <span className="flex items-center gap-2 font-semibold">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      Rentang Terkunci: 
                      <span className="font-extrabold text-blue-600">
                        {filterPeriod === 'all' && 'Semua Sejarah Transaksi'}
                        {filterPeriod === 'weekly' && 'Otomatis 7 Hari Terakhir'}
                        {filterPeriod === 'monthly' && 'Otomatis 30 Hari Terakhir'}
                      </span>
                    </span>
                    <span className="text-[9px] bg-slate-200 font-bold px-2 py-1 rounded uppercase tracking-wider text-slate-600">Aktif</span>
                  </div>
                )}
              </div>

            </div>

            {/* SELECTED REPORTING STATS PREVIEW CARDS */}
            <div className="bg-slate-50/75 border border-slate-200/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/50 pb-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Pratinjau Ringkasan Periode Terpilih
                </span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-150 px-2.5 py-0.5 rounded font-bold uppercase tracking-wide">
                  {filteredReportOrders.length} Cucian Ditemukan
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Omset Lunas</span>
                  <span className="text-sm font-black text-emerald-600 block">{formatRupiah(periodPaidRevenue)}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Piutang Kasir</span>
                  <span className="text-sm font-black text-rose-600 block">{formatRupiah(periodUnpaidRevenue)}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Bobot Kiloan (Kg)</span>
                  <span className="text-sm font-black text-slate-700 block">{periodVolumeKg} Kg</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Kuantitas Pcs</span>
                  <span className="text-sm font-black text-slate-700 block">{periodVolumePcs} Pcs</span>
                </div>
              </div>
            </div>

          </div>

          {/* INCOME GRAPH SIMULATOR USING HIGHLY POLISHED SVGs */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-1.5 uppercase tracking-wide">
              <Settings className="w-4 h-4 text-blue-500" />
              Statistik Berat Cucian Masuk (Kg) 7 Hari Terakhir
            </h3>
            
            <div className="h-56 w-full flex items-end justify-between gap-2 pt-6 pb-2 border-b border-indigo-50/50">
              {[
                { d: 'Senin', kg: 14 },
                { d: 'Selasa', kg: 24 },
                { d: 'Rabu', kg: 19 },
                { d: 'Kamis', kg: 35 },
                { d: 'Jumat', kg: 42 },
                { d: 'Sabtu', kg: 55 },
                { d: 'Minggu', kg: 48 }
              ].map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
                  <span className="text-[10px] font-mono text-blue-600 font-bold mb-1">{item.kg}kg</span>
                  <div 
                    className="w-full max-w-[40px] bg-gradient-to-t from-blue-500/80 to-blue-500 rounded-t-lg transition-all duration-1000 ease-out"
                    style={{ height: `${(item.kg / 60) * 100}%` }}
                  />
                  <span className="text-xs text-slate-400 font-medium mt-2">{item.d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MANAGE SERVICES PANEL */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          <div className="lg:col-span-3 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Daftar Jasa Laundry</h3>
              <p className="text-xs text-slate-400 mt-1">Daftar harga yang dipasang dan tampil pada form kasir.</p>
            </div>
            
            <div className="divide-y divide-slate-100">
              {services.map(srv => (
                <div key={srv.serviceId} className="p-5 flex items-center justify-between hover:bg-slate-50 transition">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{srv.name}</h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {formatRupiah(srv.price)} / {srv.unit} • Estimasi {srv.estimateDays} Hari Selesai
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDeleteService(srv.serviceId)}
                    className="p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition"
                    title="Hapus Layanan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {services.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Belum ada jenis layanan. Tambahkan baru di form samping Anda.
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm p-6 h-fit">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Buat Layanan Baru</h3>
            <form onSubmit={handleAddService} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nama Layanan</label>
                <input 
                  type="text"
                  placeholder="Contoh: Cuci Karpet Tebal"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Harga (Rupiah)</label>
                  <input 
                    type="number"
                    placeholder="Harga"
                    value={newServicePrice || ''}
                    onChange={(e) => setNewServicePrice(Number(e.target.value))}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Satuan Tarif</label>
                  <select 
                    value={newServiceUnit}
                    onChange={(e) => setNewServiceUnit(e.target.value as 'kg' | 'pcs')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  >
                    <option value="kg">Per Kilo (Kg)</option>
                    <option value="pcs">Per Buah (Pcs)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Hari Kerja Estimasi</label>
                <input 
                  type="number"
                  placeholder="Contoh: 3"
                  value={newServiceDays || ''}
                  onChange={(e) => setNewServiceDays(Number(e.target.value))}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-1 mt-2"
              >
                <Plus className="w-4 h-4" />
                Tambah Layanan
              </button>
            </form>
          </div>

        </div>
      )}

      {/* MANAGE STAFF PANEL */}
      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          <div className="lg:col-span-3 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Dua-Role Staff Kerja</h3>
              <p className="text-xs text-slate-400 mt-1">Daftar akun internal yang dapat login langsung sebagai Kasir atau Pegawai.</p>
            </div>

            <div className="divide-y divide-slate-100">
              {staff.map(member => (
                <div key={member.userId} className="p-5 flex items-center justify-between hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={member.name} photoURL={member.photoURL} size="md" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{member.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Username: <span className="font-mono bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-[10px] font-bold">{member.username}</span></p>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] border mt-2 font-bold uppercase tracking-wider ${
                        member.role === 'cashier' 
                          ? 'bg-blue-50 text-blue-800 border-blue-150' 
                          : 'bg-indigo-50 text-indigo-850 border-indigo-150'
                      }`}>
                        {member.role === 'cashier' ? 'Kasir (Utama)' : 'Pegawai Cuci/Setrika'}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleDeleteStaff(member.userId)}
                    className="p-2 text-rose-500 hover:bg-rose-50 text-rose-700 rounded-lg transition"
                    title="Batalkan Akses"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {staff.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Belum ada karyawan terdaftar. Silakan buat akun Kasir dan Pegawai untuk mengelola cucian.
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm h-fit">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Buat Akun Karyawan Baru</h3>
            
            {staffError && (
              <div className="p-3.5 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl text-xs font-semibold mb-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>{staffError}</span>
              </div>
            )}

            <form onSubmit={handleAddStaffAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nama Lengkap</label>
                <input 
                  type="text"
                  placeholder="Contoh: Siti Rahma"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Username Login Internal</label>
                <input 
                  type="text"
                  placeholder="Contoh: kasir01"
                  value={staffUsername}
                  onChange={(e) => setStaffUsername(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Gunakan huruf kecil & angka saja, tanpa spasi. Karyawan akan login memakai nama ini.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Pilih Jabatan (Role)</label>
                <select 
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as 'cashier' | 'employee')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                >
                  <option value="employee">Pegawai Laundry (Update Progres)</option>
                  <option value="cashier">Kasir Laundry (Input Order & Bayar)</option>
                </select>
                {staffRole === 'cashier' && (
                  <p className="text-[10px] text-amber-600 font-semibold mt-1">Peringatan: Maksimal 1 akun Kasir diperbolehkan untuk kelola transaksi.</p>
                )}
              </div>

              <button 
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-1 mt-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Daftarkan Akses Karyawan
              </button>
            </form>
          </div>

        </div>
      )}

      {/* MANAGE ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800">Semua Histori Cucian Pelanggan</h3>
              <p className="text-xs text-slate-400 mt-0.5">Daftar transaksi laundry beserta detail progress terkini.</p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded-md">Total: {orders.length} Log</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-slate-700 text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-5">Nota / Invoice</th>
                  <th className="py-3 px-5">Pelanggan</th>
                  <th className="py-3 px-5">Layanan</th>
                  <th className="py-3 px-5">Bobot</th>
                  <th className="py-3 px-5">Total Harga</th>
                  <th className="py-3 px-5">Status Layanan</th>
                  <th className="py-3 px-5">Status Bayar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {orders.map(order => (
                  <tr key={order.orderId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-800">{order.invoiceNo}</td>
                    <td className="py-3.5 px-5">
                      <p className="font-semibold text-slate-800">{order.customerName}</p>
                      <p className="text-xs text-slate-400">{order.customerPhone}</p>
                    </td>
                    <td className="py-3.5 px-5 font-medium">{order.serviceName}</td>
                    <td className="py-3.5 px-5 font-semibold text-slate-600">{order.weight} {order.unit}</td>
                    <td className="py-3.5 px-5 font-bold text-slate-800">{formatRupiah(order.totalPrice)}</td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        order.laundryStatus === 'selesai' || order.laundryStatus === 'diambil' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-amber-50 text-amber-800 border border-amber-100'
                      }`}>
                        {order.laundryStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        order.paymentStatus === 'paid' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {order.paymentStatus === 'paid' ? 'LUNAS' : 'BELUM'}
                      </span>
                    </td>
                  </tr>
                ))}

                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 px-5 text-center text-slate-400 text-sm">Belum ada transaksi di laundry ini.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SETTINGS OUTLET & PROFIL TAB */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* COLUMN 1: OUTLET CONTROL */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-slate-800 text-base">Informasi Laundry Outlet</h3>
              <p className="text-xs text-slate-400 mt-1">Sesuaikan nama brand, alamat outlet, dan telepon kontak resmi untuk kasir.</p>
            </div>

            {outletSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs font-semibold">
                {outletSuccess}
              </div>
            )}
            {outletError && (
              <div className="p-3 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl text-xs font-semibold">
                {outletError}
              </div>
            )}

            <form onSubmit={handleUpdateOutlet} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Nama Laundry Outlet</label>
                <input 
                  type="text"
                  placeholder="Contoh: Fresh & Clean Kiloan"
                  value={outletName}
                  onChange={(e) => setOutletName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Alamat Lengkap Outlet</label>
                <textarea 
                  rows={3}
                  placeholder="Ketik alamat lengkap untuk dicetak di nota struk thermal..."
                  value={outletAddress}
                  onChange={(e) => setOutletAddress(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Nomor Telepon Outlet</label>
                <input 
                  type="text"
                  placeholder="Contoh: 08123456789"
                  value={outletPhone}
                  onChange={(e) => setOutletPhone(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl transition text-sm shadow-sm cursor-pointer"
              >
                Simpan Informasi Outlet
              </button>
            </form>
          </div>

          {/* COLUMN 2: OWNER PERSONAL PROFILE */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-slate-800 text-base">Profil Pribadi Owner</h3>
              <p className="text-xs text-slate-400 mt-1">Ubah nama lengkap Anda dan atur foto profil / avatar visual.</p>
            </div>

            {profileSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs font-semibold">
                {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className="p-3 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl text-xs font-semibold">
                {profileError}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="flex items-center gap-4 bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                <UserAvatar name={profileName || 'Owner'} photoURL={profilePhoto} size="lg" />
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-slate-800">Pratinjau Foto Profil</h4>
                  <p className="text-[11px] text-slate-400 leading-normal">Secara otomatis digenerasi berdasarkan inisial nama jika URL profil kosong.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Nama Lengkap Owner</label>
                <input 
                  type="text"
                  placeholder="Contoh: Hj. Sugiharti"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">URL Foto Profil Kustom (Opsional)</label>
                <input 
                  type="url"
                  placeholder="https://contoh.com/foto-anda.jpg"
                  value={profilePhoto}
                  onChange={(e) => setProfilePhoto(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              {/* CHOOSE PRESET */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide text-left">Presetan Karakter Cepat</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: 'Siti (Kasir)', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80' },
                    { name: 'Aris (Owner)', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80' },
                    { name: 'Dewi (Admin)', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80' },
                    { name: 'Buster (Kartun)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Buster' },
                    { name: 'Anita (Kartun)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Anita' },
                    { name: 'Dinosaurus', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Bot' }
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setProfilePhoto(item.url)}
                      className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-200 transition cursor-pointer"
                    >
                      {item.name}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setProfilePhoto('')}
                    className="text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1.5 rounded-lg border border-rose-150 transition cursor-pointer"
                  >
                    Kosongkan (Gunakan Inisial)
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-900 text-slate-100 font-extrabold py-3 rounded-xl transition text-sm shadow-sm cursor-pointer"
              >
                Simpan Profil Saya
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}
