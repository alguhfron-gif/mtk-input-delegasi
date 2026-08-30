import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db, PESERTA_COLLECTION, DELEGASI_COLLECTION, CONFIG_COLLECTION, ANGGARAN_DOC } from '../lib/firebase';
import { Peserta, Delegasi } from '../types';

/**
 * Custom Hook useFirebaseData
 * Mendengarkan perubahan data secara realtime dari Firebase Firestore
 */
export function useFirebaseData() {
  const [peserta, setPeserta] = useState<Peserta[]>([]);
  const [delegasi, setDelegasi] = useState<Delegasi[]>([]);
  const [saldoAnggaran, setSaldoAnggaran] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Mendengarkan perubahan data pada koleksi 'peserta'
    const unsubPeserta = onSnapshot(collection(db, PESERTA_COLLECTION), (snapshot) => {
      const listPeserta = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Peserta, 'id'>)
      }));
      setPeserta(listPeserta);
      setLoading(false);
    });

    // 2. Mendengarkan perubahan data pada koleksi 'delegasi'
    const unsubDelegasi = onSnapshot(collection(db, DELEGASI_COLLECTION), (snapshot) => {
      const listDelegasi = snapshot.docs.map(doc => ({
        id: Number(doc.id),
        ...(doc.data() as Omit<Delegasi, 'id'>)
      }));
      setDelegasi(listDelegasi);
    });

    // 3. Mendengarkan perubahan data saldo anggaran
    const unsubAnggaran = onSnapshot(doc(db, CONFIG_COLLECTION, ANGGARAN_DOC), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSaldoAnggaran(Number(data.saldoAnggaran) || 0);
      } else {
        setSaldoAnggaran(0);
      }
    });

    return () => {
      unsubPeserta();
      unsubDelegasi();
      unsubAnggaran();
    };
  }, []);

  return { peserta, delegasi, saldoAnggaran, loading };
}
