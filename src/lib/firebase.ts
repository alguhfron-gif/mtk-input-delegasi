import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  getDocFromServer,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Peserta, Delegasi } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

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
  timestamp: string;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    timestamp: new Date().toISOString()
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

// Test Connection
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore connection test: Client is offline or initializing.');
    }
    return false;
  }
}

// Collections References
export const PESERTA_COLLECTION = 'peserta';
export const DELEGASI_COLLECTION = 'delegasi';
export const CONFIG_COLLECTION = 'config';
export const ANGGARAN_DOC = 'anggaran';

// -------------------------------------------------------------
// Realtime Subscriptions
// -------------------------------------------------------------

export function subscribePeserta(
  onData: (peserta: Peserta[]) => void,
  onError?: (err: unknown) => void
) {
  const colRef = collection(db, PESERTA_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Peserta[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data() as Peserta;
        list.push({
          id: d.id || docSnap.id,
          nama: d.nama || '',
          domisili: d.domisili || '',
          kelas: d.kelas || '',
          jabatan: d.jabatan || 'Anggota'
        });
      });
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, PESERTA_COLLECTION);
      if (onError) onError(error);
    }
  );
}

export function subscribeDelegasi(
  onData: (delegasi: Delegasi[]) => void,
  onError?: (err: unknown) => void
) {
  const colRef = collection(db, DELEGASI_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Delegasi[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: d.id ? Number(d.id) : Number(docSnap.id),
          peserta: Array.isArray(d.peserta) ? d.peserta : [],
          tujuan: d.tujuan || '',
          tglBerangkat: d.tglBerangkat || null,
          tglKembali: d.tglKembali || null,
          uangDibawa: Number(d.uangDibawa) || 0,
          uangTerpakai: Number(d.uangTerpakai) || 0,
          rincian: Array.isArray(d.rincian) ? d.rincian : []
        });
      });
      // Sort by ID (chronological)
      list.sort((a, b) => a.id - b.id);
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, DELEGASI_COLLECTION);
      if (onError) onError(error);
    }
  );
}

export function subscribeAnggaran(
  onData: (saldo: number) => void,
  onError?: (err: unknown) => void
) {
  const docRef = doc(db, CONFIG_COLLECTION, ANGGARAN_DOC);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onData(Number(data.saldoAnggaran) || 0);
      } else {
        onData(0);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `${CONFIG_COLLECTION}/${ANGGARAN_DOC}`);
      if (onError) onError(error);
    }
  );
}

// -------------------------------------------------------------
// Mutation Functions (Async with Error Handling)
// -------------------------------------------------------------

export async function savePesertaToFirestore(peserta: Peserta): Promise<void> {
  const path = `${PESERTA_COLLECTION}/${peserta.id}`;
  try {
    const docRef = doc(db, PESERTA_COLLECTION, peserta.id);
    const dataToSave = {
      ...peserta,
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deletePesertaFromFirestore(pesertaId: string): Promise<void> {
  const path = `${PESERTA_COLLECTION}/${pesertaId}`;
  try {
    const docRef = doc(db, PESERTA_COLLECTION, pesertaId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

export async function batchImportPesertaToFirestore(
  pesertaList: Peserta[],
  mode: 'skip' | 'update' | 'replace' = 'update'
): Promise<void> {
  try {
    if (mode === 'replace') {
      // Clear existing
      const existingSnap = await getDocs(collection(db, PESERTA_COLLECTION));
      const deleteBatch = writeBatch(db);
      existingSnap.forEach(docSnap => {
        deleteBatch.delete(docSnap.ref);
      });
      await deleteBatch.commit();
    }

    // Write in chunks of 450 (Firestore limit is 500 ops per batch)
    const chunkSize = 400;
    for (let i = 0; i < pesertaList.length; i += chunkSize) {
      const chunk = pesertaList.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      
      for (const p of chunk) {
        const docRef = doc(db, PESERTA_COLLECTION, p.id);
        const dataToSave = {
          ...p,
          updatedAt: new Date().toISOString()
        };
        batch.set(docRef, dataToSave, { merge: mode === 'update' });
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, PESERTA_COLLECTION);
    throw error;
  }
}

export async function saveDelegasiToFirestore(delegasi: Delegasi): Promise<void> {
  const path = `${DELEGASI_COLLECTION}/${delegasi.id}`;
  try {
    const docRef = doc(db, DELEGASI_COLLECTION, String(delegasi.id));
    await setDoc(docRef, delegasi, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteDelegasiFromFirestore(delegasiId: number): Promise<void> {
  const path = `${DELEGASI_COLLECTION}/${delegasiId}`;
  try {
    const docRef = doc(db, DELEGASI_COLLECTION, String(delegasiId));
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

export async function clearAllDelegasiFromFirestore(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, DELEGASI_COLLECTION));
    const batch = writeBatch(db);
    snap.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, DELEGASI_COLLECTION);
    throw error;
  }
}

export async function saveAnggaranToFirestore(saldoAnggaran: number): Promise<void> {
  const path = `${CONFIG_COLLECTION}/${ANGGARAN_DOC}`;
  try {
    const docRef = doc(db, CONFIG_COLLECTION, ANGGARAN_DOC);
    await setDoc(docRef, {
      saldoAnggaran,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// Initial bootstrap/seed to Firestore if empty
export async function seedInitialDataIfEmpty(defaultPeserta: Peserta[]) {
  try {
    const snap = await getDocs(collection(db, PESERTA_COLLECTION));
    if (snap.empty && defaultPeserta.length > 0) {
      console.log('Seeding initial peserta to Firestore...');
      await batchImportPesertaToFirestore(defaultPeserta, 'update');
    }
  } catch (error) {
    console.warn('Initial seeding note:', error);
  }
}
