import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot,
  getDocFromServer,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { Worker, Zone } from '../types';
import { INITIAL_WORKERS, ZONES_DATA } from '../data/dormitoryData';

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
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connectivity
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    console.warn('Firestore connection check:', error);
    return false;
  }
}

// 1. Subscribe to Workers in real-time
export function subscribeWorkers(
  onUpdate: (workers: Worker[]) => void,
  onError?: (err: Error) => void
) {
  const workersCol = collection(db, 'workers');
  return onSnapshot(
    workersCol,
    (snapshot) => {
      const workersList: Worker[] = [];
      snapshot.forEach((docSnap) => {
        workersList.push({ id: docSnap.id, ...docSnap.data() } as Worker);
      });
      onUpdate(workersList);
    },
    (error) => {
      console.error('Lỗi khi lắng nghe dữ liệu công nhân từ Firestore:', error);
      if (onError) onError(error instanceof Error ? error : new Error(String(error)));
    }
  );
}

// 2. Add or Update Worker
export async function saveWorkerToFirestore(worker: Worker): Promise<void> {
  try {
    const workerRef = doc(db, 'workers', worker.id);
    await setDoc(workerRef, {
      ...worker,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `workers/${worker.id}`);
  }
}

// 3. Delete Worker
export async function deleteWorkerFromFirestore(workerId: string): Promise<void> {
  try {
    const workerRef = doc(db, 'workers', workerId);
    await deleteDoc(workerRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `workers/${workerId}`);
  }
}

// 4. Batch Initialize / Seed Firestore with default data if empty
export async function seedInitialDataIfEmpty(): Promise<Worker[]> {
  try {
    const snapshot = await getDocs(collection(db, 'workers'));
    if (snapshot.empty) {
      console.log('Khởi tạo dữ liệu mẫu ban đầu lên Google Cloud Firestore...');
      const batch = writeBatch(db);
      INITIAL_WORKERS.forEach((w) => {
        const ref = doc(db, 'workers', w.id);
        batch.set(ref, w);
      });
      await batch.commit();
      return INITIAL_WORKERS;
    } else {
      const existing: Worker[] = [];
      snapshot.forEach(docSnap => {
        existing.push({ id: docSnap.id, ...docSnap.data() } as Worker);
      });
      return existing;
    }
  } catch (error) {
    console.error('Lỗi khi kiểm tra hoặc khởi tạo dữ liệu mẫu:', error);
    return INITIAL_WORKERS;
  }
}

// 5. Structure Zones persistence
export function subscribeZones(
  onUpdate: (zones: Zone[]) => void,
  onError?: (err: Error) => void
) {
  const zonesCol = collection(db, 'zones');
  return onSnapshot(
    zonesCol,
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate(ZONES_DATA);
        return;
      }
      const zonesList: Zone[] = [];
      snapshot.forEach((docSnap) => {
        zonesList.push({ id: docSnap.id, ...docSnap.data() } as Zone);
      });
      onUpdate(zonesList.sort((a, b) => a.code.localeCompare(b.code)));
    },
    (error) => {
      console.error('Lỗi khi lắng nghe cấu trúc zones từ Firestore:', error);
      if (onError) onError(error);
    }
  );
}

export async function saveZoneToFirestore(zone: Zone): Promise<void> {
  try {
    const zoneRef = doc(db, 'zones', zone.id);
    await setDoc(zoneRef, zone, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `zones/${zone.id}`);
  }
}

export async function deleteZoneFromFirestore(zoneId: string): Promise<void> {
  try {
    const zoneRef = doc(db, 'zones', zoneId);
    await deleteDoc(zoneRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `zones/${zoneId}`);
  }
}

export async function seedZonesIfEmpty(): Promise<Zone[]> {
  try {
    const snapshot = await getDocs(collection(db, 'zones'));
    if (snapshot.empty) {
      const batch = writeBatch(db);
      ZONES_DATA.forEach((z) => {
        const ref = doc(db, 'zones', z.id);
        batch.set(ref, z);
      });
      await batch.commit();
      return ZONES_DATA;
    } else {
      const existing: Zone[] = [];
      snapshot.forEach(docSnap => {
        existing.push({ id: docSnap.id, ...docSnap.data() } as Zone);
      });
      return existing.sort((a, b) => a.code.localeCompare(b.code));
    }
  } catch (error) {
    console.error('Lỗi khi khởi tạo zones:', error);
    return ZONES_DATA;
  }
}
