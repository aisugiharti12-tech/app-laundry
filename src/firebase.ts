/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { 
  UserProfile, 
  Laundry, 
  LaundryService, 
  LaundryOrder, 
  OrderProgress, 
  LaundryPayment,
  LaundryStatus
} from './types';

// Detect if we are using the placeholder credentials
const isPlaceholder = 
  !firebaseConfig || 
  firebaseConfig.apiKey === 'PLACEHOLDER_API_KEY' || 
  firebaseConfig.projectId === 'placeholder-laundry-app' ||
  !firebaseConfig.apiKey;

let db: any = null;
let auth: any = null;
let useRealFirebase = false;

if (!isPlaceholder) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    useRealFirebase = true;
    console.log('Firebase initialized successfully.');
  } catch (error) {
    console.error('Firebase initialization failed, falling back to Simulator:', error);
    useRealFirebase = false;
  }
} else {
  console.log('Using local sandbox database simulator (Firebase not yet linked).');
}

export { db, auth, useRealFirebase };

// ==========================================
// LANDING INITIAL STATE & SIMULATOR DATABASE
// ==========================================

const INITIAL_LAUNDRIES: Laundry[] = [
  {
    laundryId: 'laundry_clean_fresh',
    name: 'Clean & Fresh Laundry Utama',
    address: 'Jl. Merdeka No. 45, Bandung',
    phone: '081234567800',
    ownerId: 'owner_sugiharti',
    isActive: true,
    createdAt: new Date('2026-05-01').toISOString()
  },
  {
    laundryId: 'laundry_express_pro',
    name: 'Express Laundry Pro',
    address: 'Jl. Asia Afrika No. 12, Jakarta',
    phone: '089876543200',
    ownerId: 'owner_budi',
    isActive: true,
    createdAt: new Date('2026-05-15').toISOString()
  }
];

const INITIAL_SERVICES: LaundryService[] = [
  {
    serviceId: 'srv_clean_fresh_kiloan_3d',
    laundryId: 'laundry_clean_fresh',
    name: 'Cuci Setrika Kiloan (Reguler 3 Hari)',
    price: 7000,
    unit: 'kg',
    estimateDays: 3,
    createdAt: new Date('2026-05-01').toISOString()
  },
  {
    serviceId: 'srv_clean_fresh_kiloan_1d',
    laundryId: 'laundry_clean_fresh',
    name: 'Cuci Setrika Kiloan (Express 1 Hari)',
    price: 12000,
    unit: 'kg',
    estimateDays: 1,
    createdAt: new Date('2026-05-01').toISOString()
  },
  {
    serviceId: 'srv_clean_fresh_blanket',
    laundryId: 'laundry_clean_fresh',
    name: 'Cuci Bedcover / Selimut',
    price: 25000,
    unit: 'pcs',
    estimateDays: 2,
    createdAt: new Date('2026-05-01').toISOString()
  },
  {
    serviceId: 'srv_clean_fresh_iron_only',
    laundryId: 'laundry_clean_fresh',
    name: 'Setrika Saja (Reguler 2 Hari)',
    price: 4500,
    unit: 'kg',
    estimateDays: 2,
    createdAt: new Date('2026-05-01').toISOString()
  }
];

const INITIAL_USERS: UserProfile[] = [
  {
    userId: 'admin_platform_uid00',
    email: 'aisugiharti12@admin.smp.belajar.id', // Matches the current environment's user email!
    name: 'Ai Sugiharti (Super Admin)',
    role: 'super_admin',
    isActive: true,
    createdAt: new Date('2026-05-01').toISOString()
  },
  {
    userId: 'owner_sugiharti_uid01',
    email: 'owner@laundry.com',
    name: 'Hj. Sugiharti (Owner Laundry)',
    role: 'owner',
    laundryId: 'laundry_clean_fresh',
    isActive: true,
    createdAt: new Date('2026-05-01').toISOString()
  },
  {
    userId: 'kasir_laundry_uid02',
    username: 'kasir001',
    name: 'Siti Rahma (Kasir)',
    role: 'cashier',
    laundryId: 'laundry_clean_fresh',
    isActive: true,
    createdAt: new Date('2026-05-02').toISOString()
  },
  {
    userId: 'pegawai_laundry_uid03',
    username: 'pegawai001',
    name: 'Dedi Kurnia (Pegawai Cuci)',
    role: 'employee',
    laundryId: 'laundry_clean_fresh',
    isActive: true,
    createdAt: new Date('2026-05-02').toISOString()
  },
  {
    userId: 'owner_budi_uid04',
    email: 'budi@expresslaundry.com',
    name: 'Budi Hartono (Owner Express)',
    role: 'owner',
    laundryId: 'laundry_express_pro',
    isActive: true,
    createdAt: new Date('2026-05-15').toISOString()
  }
];

const INITIAL_ORDERS: LaundryOrder[] = [
  {
    orderId: 'ord_101',
    laundryId: 'laundry_clean_fresh',
    invoiceNo: 'INV-2026-0001',
    customerName: 'Budi Santoso',
    customerPhone: '081234567890',
    weight: 4.5,
    unit: 'kg',
    serviceId: 'srv_clean_fresh_kiloan_3d',
    serviceName: 'Cuci Setrika Kiloan (Reguler 3 Hari)',
    servicePrice: 7000,
    totalPrice: 31500,
    paymentStatus: 'paid',
    laundryStatus: 'disetrika',
    notes: 'Pakaian wangi lavender',
    estimatedCompletion: new Date('2026-05-26T12:00:00Z').toISOString(),
    createdAt: new Date('2026-05-23T08:00:00Z').toISOString(),
    cashierId: 'kasir_laundry_uid02'
  },
  {
    orderId: 'ord_102',
    laundryId: 'laundry_clean_fresh',
    invoiceNo: 'INV-2026-0002',
    customerName: 'Dewi Lestari',
    customerPhone: '085712345678',
    weight: 1,
    unit: 'pcs',
    serviceId: 'srv_clean_fresh_blanket',
    serviceName: 'Cuci Bedcover / Selimut',
    servicePrice: 25000,
    totalPrice: 25000,
    paymentStatus: 'unpaid',
    laundryStatus: 'dicuci',
    notes: 'No bleach',
    estimatedCompletion: new Date('2026-05-26T17:00:00Z').toISOString(),
    createdAt: new Date('2026-05-24T02:30:00Z').toISOString(),
    cashierId: 'kasir_laundry_uid02'
  },
  {
    orderId: 'ord_103',
    laundryId: 'laundry_clean_fresh',
    invoiceNo: 'INV-2026-0003',
    customerName: 'Rian Hidayat',
    customerPhone: '081988776655',
    weight: 3.0,
    unit: 'kg',
    serviceId: 'srv_clean_fresh_kiloan_1d',
    serviceName: 'Cuci Setrika Kiloan (Express 1 Hari)',
    servicePrice: 12000,
    totalPrice: 36000,
    paymentStatus: 'paid',
    laundryStatus: 'selesai',
    notes: 'Minta dipisahkan selimut bayi',
    estimatedCompletion: new Date('2026-05-25T10:00:00Z').toISOString(),
    createdAt: new Date('2026-05-24T10:00:00Z').toISOString(),
    cashierId: 'kasir_laundry_uid02'
  }
];

const INITIAL_PROGRESS: OrderProgress[] = [
  {
    progressId: 'prg_101_1',
    orderId: 'ord_101',
    status: 'diterima',
    description: 'Laundry diterima oleh Kasir Siti Rahma.',
    updatedBy: 'kasir_laundry_uid02',
    updatedByName: 'Siti Rahma',
    updatedAt: new Date('2026-05-23T08:05:00Z').toISOString()
  },
  {
    progressId: 'prg_101_2',
    orderId: 'ord_101',
    status: 'dicuci',
    description: 'Pakaian sedang direndam dan dicuci di mesin cuci.',
    updatedBy: 'pegawai_laundry_uid03',
    updatedByName: 'Dedi Kurnia',
    updatedAt: new Date('2026-05-23T11:00:00Z').toISOString()
  },
  {
    progressId: 'prg_101_3',
    orderId: 'ord_101',
    status: 'dikeringkan',
    description: 'Selesai dicuci, sekarang dimasukkan dalam mesin pengering.',
    updatedBy: 'pegawai_laundry_uid03',
    updatedByName: 'Dedi Kurnia',
    updatedAt: new Date('2026-05-23T14:30:00Z').toISOString()
  },
  {
    progressId: 'prg_101_4',
    orderId: 'ord_101',
    status: 'disetrika',
    description: 'Pakaian sedang disetrika rapih & disemprot pewangi.',
    updatedBy: 'pegawai_laundry_uid03',
    updatedByName: 'Dedi Kurnia',
    updatedAt: new Date('2026-05-24T01:15:00Z').toISOString()
  },
  {
    progressId: 'prg_102_1',
    orderId: 'ord_102',
    status: 'diterima',
    description: 'Bedcover diterima oleh Kasir Siti Rahma.',
    updatedBy: 'kasir_laundry_uid02',
    updatedByName: 'Siti Rahma',
    updatedAt: new Date('2026-05-24T02:35:00Z').toISOString()
  },
  {
    progressId: 'prg_102_2',
    orderId: 'ord_102',
    status: 'dicuci',
    description: 'Bedcover dimasukkan ke mesin cuci heavy duty.',
    updatedBy: 'pegawai_laundry_uid03',
    updatedByName: 'Dedi Kurnia',
    updatedAt: new Date('2026-05-24T03:00:00Z').toISOString()
  }
];

const INITIAL_PAYMENTS: LaundryPayment[] = [
  {
    paymentId: 'pay_101',
    orderId: 'ord_101',
    laundryId: 'laundry_clean_fresh',
    amount: 31500,
    paymentMethod: 'cash',
    paymentDate: new Date('2026-05-23T08:01:00Z').toISOString(),
    cashierId: 'kasir_laundry_uid02'
  },
  {
    paymentId: 'pay_103',
    orderId: 'ord_103',
    laundryId: 'laundry_clean_fresh',
    amount: 36000,
    paymentMethod: 'transfer',
    paymentDate: new Date('2026-05-24T10:05:00Z').toISOString(),
    cashierId: 'kasir_laundry_uid02'
  }
];

// Helper to initialize local storage database
const initSandboxDb = () => {
  if (!localStorage.getItem('lnd_users')) {
    localStorage.setItem('lnd_users', JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem('lnd_laundries')) {
    localStorage.setItem('lnd_laundries', JSON.stringify(INITIAL_LAUNDRIES));
  }
  if (!localStorage.getItem('lnd_services')) {
    localStorage.setItem('lnd_services', JSON.stringify(INITIAL_SERVICES));
  }
  if (!localStorage.getItem('lnd_orders')) {
    localStorage.setItem('lnd_orders', JSON.stringify(INITIAL_ORDERS));
  }
  if (!localStorage.getItem('lnd_progress')) {
    localStorage.setItem('lnd_progress', JSON.stringify(INITIAL_PROGRESS));
  }
  if (!localStorage.getItem('lnd_payments')) {
    localStorage.setItem('lnd_payments', JSON.stringify(INITIAL_PAYMENTS));
  }
};

// Initial run
initSandboxDb();

// Local Storage operations
export const sandboxDb = {
  getCollection: <T>(key: 'users' | 'laundries' | 'services' | 'orders' | 'progress' | 'payments'): T[] => {
    initSandboxDb();
    const data = localStorage.getItem(`lnd_${key}`);
    return data ? JSON.parse(data) : [];
  },
  saveCollection: (key: 'users' | 'laundries' | 'services' | 'orders' | 'progress' | 'payments', data: any[]) => {
    localStorage.setItem(`lnd_${key}`, JSON.stringify(data));
  },
  getDoc: <T>(key: 'users' | 'laundries' | 'services' | 'orders' | 'progress' | 'payments', idKey: string, idVal: string): T | null => {
    const list = sandboxDb.getCollection<any>(key);
    return list.find(item => item[idKey] === idVal) || null;
  },
  addDoc: (key: 'users' | 'laundries' | 'services' | 'orders' | 'progress' | 'payments', doc: any) => {
    const list = sandboxDb.getCollection<any>(key);
    list.push(doc);
    sandboxDb.saveCollection(key, list);
    return doc;
  },
  updateDoc: (key: 'users' | 'laundries' | 'services' | 'orders' | 'progress' | 'payments', idKey: string, idVal: string, updates: any) => {
    const list = sandboxDb.getCollection<any>(key);
    const index = list.findIndex(item => item[idKey] === idVal);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      sandboxDb.saveCollection(key, list);
      return list[index];
    }
    return null;
  },
  deleteDoc: (key: 'users' | 'laundries' | 'services' | 'orders' | 'progress' | 'payments', idKey: string, idVal: string) => {
    const list = sandboxDb.getCollection<any>(key);
    const filtered = list.filter(item => item[idKey] !== idVal);
    sandboxDb.saveCollection(key, filtered);
  }
};

// ==========================================
// UNIFIED DATA SERVICE (FIREBASE OR SIMULATION)
// ==========================================

export const laundryService = {
  // --- AUTH SERVICES ---
  getCurrentSimulatedUser: (): UserProfile | null => {
    const logged = localStorage.getItem('lnd_current_user');
    return logged ? JSON.parse(logged) : null;
  },

  setSimulatedUser: (user: UserProfile | null) => {
    if (user) {
      localStorage.setItem('lnd_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('lnd_current_user');
    }
  },

  loginGoogleSimulated: (email: string): UserProfile => {
    const users = sandboxDb.getCollection<UserProfile>('users');
    let user = users.find(u => u.email === email);
    
    if (!user) {
      // Create owner automatically on successful Google sign-in demo if not found
      const newOwnerId = `owner_${Date.now()}`;
      const newLaundryId = `laundry_${Date.now()}`;
      
      const newLaundry: Laundry = {
        laundryId: newLaundryId,
        name: 'Laundry Saya',
        address: 'Alamat Laundry Belum Diisi',
        phone: '08123456789',
        ownerId: newOwnerId,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      sandboxDb.addDoc('laundries', newLaundry);

      // Pre-add core services for the new owner
      const defaultServices: LaundryService[] = [
        {
          serviceId: `srv_${Date.now()}_1`,
          laundryId: newLaundryId,
          name: 'Cuci Setrika Kiloan (Reguler 3 Hari)',
          price: 6000,
          unit: 'kg',
          estimateDays: 3,
          createdAt: new Date().toISOString()
        }
      ];
      defaultServices.forEach(srv => sandboxDb.addDoc('services', srv));

      user = {
        userId: newOwnerId,
        email: email,
        name: email.split('@')[0],
        role: email === 'aisugiharti12@admin.smp.belajar.id' ? 'super_admin' : 'owner',
        laundryId: newLaundryId,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      sandboxDb.addDoc('users', user);
    }
    laundryService.setSimulatedUser(user);
    return user;
  },

  loginInternalSimulated: (username: string): UserProfile | null => {
    const users = sandboxDb.getCollection<UserProfile>('users');
    const user = users.find(u => u.username === username);
    if (user) {
      laundryService.setSimulatedUser(user);
      return user;
    }
    return null;
  },

  logout: () => {
    laundryService.setSimulatedUser(null);
  },

  // --- LAUNDRY BUSINESS OPERATIONS ---
  getLaundries: (): Laundry[] => {
    return sandboxDb.getCollection<Laundry>('laundries');
  },

  updateLaundryStatus: (laundryId: string, isActive: boolean) => {
    sandboxDb.updateDoc('laundries', 'laundryId', laundryId, { isActive });
  },

  createLaundryBySuperAdmin: (laundryName: string, ownerEmail: string, ownerName: string) => {
    const ownerId = `owner_${Date.now()}`;
    const laundryId = `laundry_${Date.now()}`;

    const newOwner: UserProfile = {
      userId: ownerId,
      email: ownerEmail,
      name: ownerName,
      role: 'owner',
      laundryId: laundryId,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    sandboxDb.addDoc('users', newOwner);

    const newLaundry: Laundry = {
      laundryId: laundryId,
      name: laundryName,
      address: 'Alamat Laundry Baru',
      phone: '081234567890',
      ownerId: ownerId,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    sandboxDb.addDoc('laundries', newLaundry);

    // Initial default service
    const defaultService: LaundryService = {
      serviceId: `srv_${Date.now()}`,
      laundryId: laundryId,
      name: 'Cuci Setrika Standard',
      price: 6000,
      unit: 'kg',
      estimateDays: 3,
      createdAt: new Date().toISOString()
    };
    sandboxDb.addDoc('services', defaultService);

    return { owner: newOwner, laundry: newLaundry };
  },

  // --- SERVICES OPERATIONS ---
  getServices: (laundryId: string): LaundryService[] => {
    const all = sandboxDb.getCollection<LaundryService>('services');
    return all.filter(s => s.laundryId === laundryId);
  },

  addService: (service: Omit<LaundryService, 'serviceId' | 'createdAt'>): LaundryService => {
    const newService: LaundryService = {
      ...service,
      serviceId: `srv_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    return sandboxDb.addDoc('services', newService);
  },

  updateService: (serviceId: string, updates: Partial<LaundryService>) => {
    return sandboxDb.updateDoc('services', 'serviceId', serviceId, updates);
  },

  deleteService: (serviceId: string) => {
    sandboxDb.deleteDoc('services', 'serviceId', serviceId);
  },

  // --- STAFF ACCOUNTS OPERATIONS ---
  getLaundryStaff: (laundryId: string): UserProfile[] => {
    const all = sandboxDb.getCollection<UserProfile>('users');
    return all.filter(u => u.laundryId === laundryId && (u.role === 'cashier' || u.role === 'employee'));
  },

  createStaffAccount: (laundryId: string, name: string, username: string, role: 'cashier' | 'employee'): UserProfile => {
    const staffId = `staff_${Date.now()}`;
    const newStaff: UserProfile = {
      userId: staffId,
      username: username,
      name: name,
      role: role,
      laundryId: laundryId,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    return sandboxDb.addDoc('users', newStaff);
  },

  deleteStaffAccount: (userId: string) => {
    sandboxDb.deleteDoc('users', 'userId', userId);
  },

  // --- ORDERS OPERATIONS ---
  getOrders: (laundryId: string): LaundryOrder[] => {
    const all = sandboxDb.getCollection<LaundryOrder>('orders');
    return all.filter(o => o.laundryId === laundryId);
  },

  getOrderById: (orderId: string): LaundryOrder | null => {
    return sandboxDb.getDoc<LaundryOrder>('orders', 'orderId', orderId);
  },

  getOrderByInvoice: (invoiceNo: string): LaundryOrder | null => {
    const all = sandboxDb.getCollection<LaundryOrder>('orders');
    return all.find(o => o.invoiceNo.toLowerCase() === invoiceNo.trim().toLowerCase()) || null;
  },

  createOrder: (order: Omit<LaundryOrder, 'orderId' | 'invoiceNo' | 'createdAt'>): LaundryOrder => {
    // Auto-generate Invoice No
    const orders = sandboxDb.getCollection<LaundryOrder>('orders');
    const year = new Date().getFullYear();
    const count = orders.filter(o => o.createdAt.startsWith(year.toString())).length + 1;
    const paddedCount = String(count).padStart(4, '0');
    const invoiceNo = `INV-${year}-${paddedCount}`;

    const newOrder: LaundryOrder = {
      ...order,
      orderId: `ord_${Date.now()}`,
      invoiceNo,
      createdAt: new Date().toISOString()
    };
    
    // Add to Orders
    sandboxDb.addDoc('orders', newOrder);

    // Initial Order Progress log
    const initialProgress: OrderProgress = {
      progressId: `prg_${Date.now()}_init`,
      orderId: newOrder.orderId,
      status: 'diterima',
      description: `Selesai masuk order. Laundry ditimbang ${order.weight} ${order.unit} oleh kasir.`,
      updatedBy: order.cashierId,
      updatedByName: 'Staff Laundry',
      updatedAt: new Date().toISOString()
    };
    sandboxDb.addDoc('progress', initialProgress);

    // If order was paid at creation, register payment transaction
    if (order.paymentStatus === 'paid') {
      const payment: LaundryPayment = {
        paymentId: `pay_${Date.now()}`,
        orderId: newOrder.orderId,
        laundryId: order.laundryId,
        amount: order.totalPrice,
        paymentMethod: 'cash', // Default to cash for initial paid
        paymentDate: new Date().toISOString(),
        cashierId: order.cashierId
      };
      sandboxDb.addDoc('payments', payment);
    }

    return newOrder;
  },

  updateOrderStatus: (
    orderId: string, 
    status: LaundryStatus, 
    notes: string, 
    updatedBy: string, 
    updatedByName: string
  ) => {
    const order = sandboxDb.getDoc<LaundryOrder>('orders', 'orderId', orderId);
    if (!order) return null;

    // Update main order
    const updated = sandboxDb.updateDoc('orders', 'orderId', orderId, { 
      laundryStatus: status,
      notes: notes || order.notes || ''
    });

    // Translate progress code to elegant Indonesian logs
    const statusDescMap: Record<LaundryStatus, string> = {
      diterima: 'Laundry telah diterima di outlet.',
      dicuci: 'Laundry masuk ke proses pencucian dan pembersihan.',
      dikeringkan: 'Proses pencucian selesai, laundry sedang dikeringkan menggunakan mesin spinner panas.',
      disetrika: 'Laundry dalam tahap penyetrikaan presisi, pelipatan, dan packing wangi.',
      selesai: 'Proses laundry SELESAI, siap diambil oleh pelanggan!',
      diambil: 'Laundry sudah diambil oleh pelanggan. Transaksi selesai sepenuhnya.'
    };

    // Add progress timeline entry
    const progress: OrderProgress = {
      progressId: `prg_${Date.now()}_upd`,
      orderId,
      status,
      description: `${statusDescMap[status]} (Catatan: ${notes || 'Tidak ada catatan tambahan'})`,
      updatedBy,
      updatedByName,
      updatedAt: new Date().toISOString()
    };
    sandboxDb.addDoc('progress', progress);

    return updated;
  },

  receivePayment: (orderId: string, amount: number, method: 'cash' | 'transfer', cashierId: string) => {
    const order = sandboxDb.getDoc<LaundryOrder>('orders', 'orderId', orderId);
    if (!order) return null;

    // Update order paymentStatus
    const updated = sandboxDb.updateDoc('orders', 'orderId', orderId, { paymentStatus: 'paid' });

    // Register payment record
    const payment: LaundryPayment = {
      paymentId: `pay_${Date.now()}`,
      orderId,
      laundryId: order.laundryId,
      amount,
      paymentMethod: method,
      paymentDate: new Date().toISOString(),
      cashierId
    };
    sandboxDb.addDoc('payments', payment);

    return updated;
  },

  getOrderProgress: (orderId: string): OrderProgress[] => {
    const all = sandboxDb.getCollection<OrderProgress>('progress');
    // Sort chronological (earliest first for timeline)
    return all
      .filter(p => p.orderId === orderId)
      .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
  },

  getPayments: (laundryId: string): LaundryPayment[] => {
    const all = sandboxDb.getCollection<LaundryPayment>('payments');
    return all.filter(p => p.laundryId === laundryId);
  }
};
