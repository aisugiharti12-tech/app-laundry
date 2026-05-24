/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  collectionGroup 
} from 'firebase/firestore';
import { db as libDb, auth as libAuth, googleProvider, useRealFirebase } from './lib/firebase';
import { 
  UserProfile, 
  Laundry, 
  LaundryService, 
  LaundryOrder, 
  OrderProgress, 
  LaundryPayment,
  LaundryStatus
} from './types';

export { libDb as db, libAuth as auth, useRealFirebase };

// ==========================================
// ERROR HANDLER COMPLIANCE FOR FIRESTORE RULES SPECIALIZATION
// ==========================================

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: libAuth.currentUser?.uid,
      email: libAuth.currentUser?.email,
      emailVerified: libAuth.currentUser?.emailVerified,
      isAnonymous: libAuth.currentUser?.isAnonymous,
      tenantId: libAuth.currentUser?.tenantId,
      providerInfo: libAuth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ==========================================
// LANDING INITIAL STATE & SEED DATA DEFINITIONS
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
    email: 'aisugiharti12@admin.smp.belajar.id',
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

// ==========================================
// ACTIVE FIRESTORE REAL-TIME SYNCHRONIZED STORAGE CACHE
// ==========================================

let cache_users: UserProfile[] = [];
let cache_laundries: Laundry[] = [];
let cache_services: LaundryService[] = [];
let cache_orders: LaundryOrder[] = [];
let cache_progress: OrderProgress[] = [];
let cache_payments: LaundryPayment[] = [];

// Speculative seed function to ensure database has records if loaded for first time
const checkAndSeedDatabase = async () => {
  try {
    const userSnap = await getDocs(collection(libDb, 'users'));
    if (userSnap.empty) {
      console.log("Firestore is empty! Seeding initial production metadata & profiles...");
      for (const u of INITIAL_USERS) {
        await setDoc(doc(libDb, 'users', u.userId), u);
      }
      for (const l of INITIAL_LAUNDRIES) {
        await setDoc(doc(libDb, 'laundries', l.laundryId), l);
      }
      for (const s of INITIAL_SERVICES) {
        await setDoc(doc(libDb, 'laundries', s.laundryId, 'services', s.serviceId), s);
      }
      for (const o of INITIAL_ORDERS) {
        await setDoc(doc(libDb, 'laundries', o.laundryId, 'orders', o.orderId), o);
      }
      for (const p of INITIAL_PROGRESS) {
        const ord = INITIAL_ORDERS.find(x => x.orderId === p.orderId);
        if (ord) {
          await setDoc(doc(libDb, 'laundries', ord.laundryId, 'orders', p.orderId, 'progress', p.progressId), p);
        }
      }
      for (const pm of INITIAL_PAYMENTS) {
        await setDoc(doc(libDb, 'laundries', pm.laundryId, 'payments', pm.paymentId), pm);
      }
      console.log("Firebase Database populated successfully.");
    }
  } catch (error) {
    console.warn("Seeding omitted or blocked (database likely has rules/pre-populated):", error);
  }
};

// Initialize listeners
if (useRealFirebase) {
  // Check and seed if necessary on startup
  setTimeout(() => {
    checkAndSeedDatabase();
  }, 1000);

  onSnapshot(collection(libDb, 'users'), (snapshot) => {
    cache_users = snapshot.docs.map(d => d.data() as UserProfile);
    localStorage.setItem('lnd_users', JSON.stringify(cache_users));
  }, (error) => {
    console.warn("Active users listener message:", error.message);
  });

  onSnapshot(collection(libDb, 'laundries'), (snapshot) => {
    cache_laundries = snapshot.docs.map(d => d.data() as Laundry);
    localStorage.setItem('lnd_laundries', JSON.stringify(cache_laundries));
  }, (error) => {
    console.warn("Active laundries listener message:", error.message);
  });

  onSnapshot(collectionGroup(libDb, 'services'), (snapshot) => {
    cache_services = snapshot.docs.map(d => d.data() as LaundryService);
    localStorage.setItem('lnd_services', JSON.stringify(cache_services));
  }, (error) => {
    console.warn("Active services listener message:", error.message);
  });

  onSnapshot(collectionGroup(libDb, 'orders'), (snapshot) => {
    cache_orders = snapshot.docs.map(d => d.data() as LaundryOrder);
    localStorage.setItem('lnd_orders', JSON.stringify(cache_orders));
  }, (error) => {
    console.warn("Active orders listener message:", error.message);
  });

  onSnapshot(collectionGroup(libDb, 'progress'), (snapshot) => {
    cache_progress = snapshot.docs.map(d => d.data() as OrderProgress);
    localStorage.setItem('lnd_progress', JSON.stringify(cache_progress));
  }, (error) => {
    console.warn("Active progress listener message:", error.message);
  });

  onSnapshot(collectionGroup(libDb, 'payments'), (snapshot) => {
    cache_payments = snapshot.docs.map(d => d.data() as LaundryPayment);
    localStorage.setItem('lnd_payments', JSON.stringify(cache_payments));
  }, (error) => {
    console.warn("Active payments listener message:", error.message);
  });
}

// Fallback logic to local caches if listeners are still syncing
const getLocalStorageBackup = <T>(key: string, defaultArray: T[]): T[] => {
  try {
    const data = localStorage.getItem(`lnd_${key}`);
    return data ? JSON.parse(data) : defaultArray;
  } catch {
    return defaultArray;
  }
};

const getUsersLocal = () => cache_users.length > 0 ? cache_users : getLocalStorageBackup('users', INITIAL_USERS);
const getLaundriesLocal = () => cache_laundries.length > 0 ? cache_laundries : getLocalStorageBackup('laundries', INITIAL_LAUNDRIES);
const getServicesLocal = () => cache_services.length > 0 ? cache_services : getLocalStorageBackup('services', INITIAL_SERVICES);
const getOrdersLocal = () => cache_orders.length > 0 ? cache_orders : getLocalStorageBackup('orders', INITIAL_ORDERS);
const getProgressLocal = () => cache_progress.length > 0 ? cache_progress : getLocalStorageBackup('progress', INITIAL_PROGRESS);
const getPaymentsLocal = () => cache_payments.length > 0 ? cache_payments : getLocalStorageBackup('payments', INITIAL_PAYMENTS);

// ==========================================
// UNIFIED DATA SERVICE (DELEGATING TO PERSISTENT FIREBASE FIRESTORE)
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
    // Try to find if user profile exists in custom users list first
    const users = getUsersLocal();
    let user = users.find(u => u.email === email);
    
    if (!user) {
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

      const defaultService: LaundryService = {
        serviceId: `srv_${Date.now()}_1`,
        laundryId: newLaundryId,
        name: 'Cuci Setrika Kiloan (Reguler 3 Hari)',
        price: 6000,
        unit: 'kg',
        estimateDays: 3,
        createdAt: new Date().toISOString()
      };

      user = {
        userId: newOwnerId,
        email: email,
        name: email.split('@')[0],
        role: email === 'aisugiharti12@admin.smp.belajar.id' ? 'super_admin' : 'owner',
        laundryId: newLaundryId,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      // Speculatively write back to Firestore synchronously & asynchronously
      const userDoc = doc(libDb, 'users', newOwnerId);
      const laundryDoc = doc(libDb, 'laundries', newLaundryId);
      const srvDoc = doc(libDb, 'laundries', newLaundryId, 'services', defaultService.serviceId);

      setDoc(userDoc, user).catch(e => handleFirestoreError(e, OperationType.WRITE, userDoc.path));
      setDoc(laundryDoc, newLaundry).catch(e => handleFirestoreError(e, OperationType.WRITE, laundryDoc.path));
      setDoc(srvDoc, defaultService).catch(e => handleFirestoreError(e, OperationType.WRITE, srvDoc.path));
    }

    laundryService.setSimulatedUser(user);
    return user;
  },

  loginInternalSimulated: (username: string): UserProfile | null => {
    const users = getUsersLocal();
    const user = users.find(u => u.username === username);
    if (user) {
      laundryService.setSimulatedUser(user);
      return user;
    }
    return null;
  },

  logout: () => {
    laundryService.setSimulatedUser(null);
    signOut(libAuth).catch(e => console.warn("SignOut action log:", e));
  },

  // --- LAUNDRY BUSINESS OPERATIONS ---
  getLaundries: (): Laundry[] => {
    return getLaundriesLocal();
  },

  updateLaundryStatus: (laundryId: string, isActive: boolean) => {
    const laundryDoc = doc(libDb, 'laundries', laundryId);
    updateDoc(laundryDoc, { isActive }).catch(e => handleFirestoreError(e, OperationType.UPDATE, laundryDoc.path));
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

    const newLaundry: Laundry = {
      laundryId: laundryId,
      name: laundryName,
      address: 'Alamat Laundry Baru',
      phone: '081234567890',
      ownerId: ownerId,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const defaultService: LaundryService = {
      serviceId: `srv_${Date.now()}`,
      laundryId: laundryId,
      name: 'Cuci Setrika Standard',
      price: 6000,
      unit: 'kg',
      estimateDays: 3,
      createdAt: new Date().toISOString()
    };

    const userDoc = doc(libDb, 'users', ownerId);
    const laundryDoc = doc(libDb, 'laundries', laundryId);
    const srvDoc = doc(libDb, 'laundries', laundryId, 'services', defaultService.serviceId);

    setDoc(userDoc, newOwner).catch(e => handleFirestoreError(e, OperationType.CREATE, userDoc.path));
    setDoc(laundryDoc, newLaundry).catch(e => handleFirestoreError(e, OperationType.CREATE, laundryDoc.path));
    setDoc(srvDoc, defaultService).catch(e => handleFirestoreError(e, OperationType.CREATE, srvDoc.path));

    return { owner: newOwner, laundry: newLaundry };
  },

  // --- SERVICES OPERATIONS ---
  getServices: (laundryId: string): LaundryService[] => {
    const services = getServicesLocal();
    return services.filter(s => s.laundryId === laundryId);
  },

  addService: (service: Omit<LaundryService, 'serviceId' | 'createdAt'>): LaundryService => {
    const serviceId = `srv_${Date.now()}`;
    const newService: LaundryService = {
      ...service,
      serviceId,
      createdAt: new Date().toISOString()
    };

    const srvDoc = doc(libDb, 'laundries', service.laundryId, 'services', serviceId);
    setDoc(srvDoc, newService).catch(e => handleFirestoreError(e, OperationType.CREATE, srvDoc.path));

    return newService;
  },

  updateService: (serviceId: string, updates: Partial<LaundryService>) => {
    const services = getServicesLocal();
    const service = services.find(s => s.serviceId === serviceId);
    if (service) {
      const srvDoc = doc(libDb, 'laundries', service.laundryId, 'services', serviceId);
      updateDoc(srvDoc, updates).catch(e => handleFirestoreError(e, OperationType.UPDATE, srvDoc.path));
    }
  },

  deleteService: (serviceId: string) => {
    const services = getServicesLocal();
    const service = services.find(s => s.serviceId === serviceId);
    if (service) {
      const srvDoc = doc(libDb, 'laundries', service.laundryId, 'services', serviceId);
      deleteDoc(srvDoc).catch(e => handleFirestoreError(e, OperationType.DELETE, srvDoc.path));
    }
  },

  // --- STAFF ACCOUNTS OPERATIONS ---
  getLaundryStaff: (laundryId: string): UserProfile[] => {
    const all = getUsersLocal();
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

    const userDoc = doc(libDb, 'users', staffId);
    setDoc(userDoc, newStaff).catch(e => handleFirestoreError(e, OperationType.CREATE, userDoc.path));

    return newStaff;
  },

  deleteStaffAccount: (userId: string) => {
    const userDoc = doc(libDb, 'users', userId);
    deleteDoc(userDoc).catch(e => handleFirestoreError(e, OperationType.DELETE, userDoc.path));
  },

  // --- ORDERS OPERATIONS ---
  getOrders: (laundryId: string): LaundryOrder[] => {
    const all = getOrdersLocal();
    return all.filter(o => o.laundryId === laundryId);
  },

  getOrderById: (orderId: string): LaundryOrder | null => {
    const all = getOrdersLocal();
    return all.find(o => o.orderId === orderId) || null;
  },

  getOrderByInvoice: (invoiceNo: string): LaundryOrder | null => {
    const all = getOrdersLocal();
    return all.find(o => o.invoiceNo.toLowerCase() === invoiceNo.trim().toLowerCase()) || null;
  },

  createOrder: (order: Omit<LaundryOrder, 'orderId' | 'invoiceNo' | 'createdAt'>): LaundryOrder => {
    const orders = getOrdersLocal();
    const year = new Date().getFullYear();
    const count = orders.filter(o => o.createdAt.startsWith(year.toString())).length + 1;
    const paddedCount = String(count).padStart(4, '0');
    const invoiceNo = `INV-${year}-${paddedCount}`;
    const orderId = `ord_${Date.now()}`;

    const newOrder: LaundryOrder = {
      ...order,
      orderId,
      invoiceNo,
      createdAt: new Date().toISOString()
    };
    
    // Save Order In Firestore
    const orderDoc = doc(libDb, 'laundries', order.laundryId, 'orders', orderId);
    setDoc(orderDoc, newOrder).catch(e => handleFirestoreError(e, OperationType.CREATE, orderDoc.path));

    // Save initial progress timeline entry
    const progressId = `prg_${Date.now()}_init`;
    const initialProgress: OrderProgress = {
      progressId,
      orderId,
      status: 'diterima',
      description: `Selesai masuk order. Laundry ditimbang ${order.weight} ${order.unit} oleh kasir.`,
      updatedBy: order.cashierId,
      updatedByName: 'Staff Laundry',
      updatedAt: new Date().toISOString()
    };
    const progressDoc = doc(libDb, 'laundries', order.laundryId, 'orders', orderId, 'progress', progressId);
    setDoc(progressDoc, initialProgress).catch(e => handleFirestoreError(e, OperationType.CREATE, progressDoc.path));

    // Save payment transactions if already paid at registration
    if (order.paymentStatus === 'paid') {
      const paymentId = `pay_${Date.now()}`;
      const payment: LaundryPayment = {
        paymentId,
        orderId,
        laundryId: order.laundryId,
        amount: order.totalPrice,
        paymentMethod: 'cash',
        paymentDate: new Date().toISOString(),
        cashierId: order.cashierId
      };
      const paymentDoc = doc(libDb, 'laundries', order.laundryId, 'payments', paymentId);
      setDoc(paymentDoc, payment).catch(e => handleFirestoreError(e, OperationType.CREATE, paymentDoc.path));
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
    const orders = getOrdersLocal();
    const order = orders.find(o => o.orderId === orderId);
    if (!order) return null;

    // Save Order Status Updates In Firestore
    const orderDoc = doc(libDb, 'laundries', order.laundryId, 'orders', orderId);
    updateDoc(orderDoc, { 
      laundryStatus: status,
      notes: notes || order.notes || ''
    }).catch(e => handleFirestoreError(e, OperationType.UPDATE, orderDoc.path));

    const statusDescMap: Record<LaundryStatus, string> = {
      diterima: 'Laundry telah diterima di outlet.',
      dicuci: 'Laundry masuk ke proses pencucian dan pembersihan.',
      dikeringkan: 'Proses pencucian selesai, laundry sedang dikeringkan menggunakan mesin spinner panas.',
      disetrika: 'Laundry dalam tahap penyetrikaan presisi, pelipatan, dan packing wangi.',
      selesai: 'Proses laundry SELESAI, siap diambil oleh pelanggan!',
      diambil: 'Laundry sudah diambil oleh pelanggan. Transaksi selesai sepenuhnya.'
    };

    const progressId = `prg_${Date.now()}_upd`;
    const progress: OrderProgress = {
      progressId,
      orderId,
      status,
      description: `${statusDescMap[status]} (Catatan: ${notes || 'Tidak ada catatan tambahan'})`,
      updatedBy,
      updatedByName,
      updatedAt: new Date().toISOString()
    };
    const progressDoc = doc(libDb, 'laundries', order.laundryId, 'orders', orderId, 'progress', progressId);
    setDoc(progressDoc, progress).catch(e => handleFirestoreError(e, OperationType.CREATE, progressDoc.path));

    return { ...order, laundryStatus: status, notes: notes || order.notes || '' };
  },

  receivePayment: (orderId: string, amount: number, method: 'cash' | 'transfer', cashierId: string) => {
    const orders = getOrdersLocal();
    const order = orders.find(o => o.orderId === orderId);
    if (!order) return null;

    const orderDoc = doc(libDb, 'laundries', order.laundryId, 'orders', orderId);
    updateDoc(orderDoc, { paymentStatus: 'paid' }).catch(e => handleFirestoreError(e, OperationType.UPDATE, orderDoc.path));

    const paymentId = `pay_${Date.now()}`;
    const payment: LaundryPayment = {
      paymentId,
      orderId,
      laundryId: order.laundryId,
      amount,
      paymentMethod: method,
      paymentDate: new Date().toISOString(),
      cashierId
    };
    const paymentDoc = doc(libDb, 'laundries', order.laundryId, 'payments', paymentId);
    setDoc(paymentDoc, payment).catch(e => handleFirestoreError(e, OperationType.CREATE, paymentDoc.path));

    return { ...order, paymentStatus: 'paid' as const };
  },

  getOrderProgress: (orderId: string): OrderProgress[] => {
    const all = getProgressLocal();
    return all
      .filter(p => p.orderId === orderId)
      .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
  },

  getPayments: (laundryId: string): LaundryPayment[] => {
    const all = getPaymentsLocal();
    return all.filter(p => p.laundryId === laundryId);
  }
};
