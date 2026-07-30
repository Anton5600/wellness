
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { EmotionHistoryEntry, EmotionKey, UserOil, OilCatalogItem } from '../types';
import { OILS_CATALOG } from '../data/oils';

const withTimeout = <T>(promise: Promise<T>, timeoutMs = 1500): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore request timeout')), timeoutMs)
    )
  ]);
};

export const getOilsCatalog = async (): Promise<OilCatalogItem[]> => {
  try {
    const q = query(collection(db, 'oils'));
    const querySnapshot = await withTimeout(getDocs(q), 1500);
    
    if (querySnapshot.empty) {
      return OILS_CATALOG;
    }
    
    const oils: OilCatalogItem[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      oils.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        icon: data.icon,
        price: data.price
      });
    });
    
    return oils.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.warn("Error getting oils catalog (using local catalog fallback): ", error);
    return OILS_CATALOG;
  }
};

export const seedOilsCatalog = async (): Promise<void> => {
  try {
    const promises = OILS_CATALOG.map(oil => {
      const { id, ...data } = oil;
      return setDoc(doc(db, 'oils', id), data);
    });
    await withTimeout(Promise.all(promises), 3000);
  } catch (error) {
    console.error("Error seeding oils catalog: ", error);
    throw error;
  }
};

const getLocalHistory = (userId: string): EmotionHistoryEntry[] => {
  try {
    const raw = localStorage.getItem(`emotionHistory_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading local history", e);
  }
  return [];
};

const saveLocalHistory = (userId: string, history: EmotionHistoryEntry[]) => {
  try {
    localStorage.setItem(`emotionHistory_${userId}`, JSON.stringify(history));
  } catch (e) {
    console.error("Error saving local history", e);
  }
};

export const saveEmotionHistory = async (userId: string, emotionKey: EmotionKey): Promise<EmotionHistoryEntry> => {
  const timestamp = Date.now();
  const localId = `local_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;
  const entry: EmotionHistoryEntry = {
    id: localId,
    userId: userId || 'guest',
    emotionKey,
    timestamp,
  };

  const effectiveUserId = userId || 'guest';
  const existingLocal = getLocalHistory(effectiveUserId);
  const updatedLocal = [entry, ...existingLocal];
  saveLocalHistory(effectiveUserId, updatedLocal);

  // Sync to Firestore in background without blocking UI/navigation
  if (effectiveUserId !== 'guest') {
    addDoc(collection(db, 'emotionHistory'), {
      userId: effectiveUserId,
      emotionKey,
      timestamp,
    }).then(docRef => {
      entry.id = docRef.id;
      const latestLocal = getLocalHistory(effectiveUserId).map(item => item.timestamp === timestamp ? entry : item);
      saveLocalHistory(effectiveUserId, latestLocal);
    }).catch(error => {
      console.warn("Firestore save failed or skipped, saved locally:", error);
    });
  }

  return entry;
};

export const getEmotionHistory = async (userId: string): Promise<EmotionHistoryEntry[]> => {
  const effectiveUserId = userId || 'guest';
  const localHistory = getLocalHistory(effectiveUserId);
  const guestHistory = effectiveUserId !== 'guest' ? getLocalHistory('guest') : [];
  
  let remoteHistory: EmotionHistoryEntry[] = [];

  if (effectiveUserId !== 'guest') {
    try {
      const q = query(
        collection(db, 'emotionHistory'), 
        where('userId', '==', effectiveUserId)
      );
      
      const querySnapshot = await withTimeout(getDocs(q), 1500);
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        remoteHistory.push({
          id: doc.id,
          userId: data.userId,
          emotionKey: data.emotionKey,
          timestamp: data.timestamp,
        });
      });
    } catch (error) {
      console.warn("Firestore fetch history failed/timed out, using local history:", error);
    }
  }

  // Merge remote, local, and guest history, deduplicating by timestamp
  const map = new Map<number, EmotionHistoryEntry>();
  [...guestHistory, ...localHistory, ...remoteHistory].forEach(item => {
    if (item && item.timestamp && item.emotionKey) {
      map.set(item.timestamp, item);
    }
  });

  const merged = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
  
  saveLocalHistory(effectiveUserId, merged);

  return merged;
};

export const getUserOils = async (userId: string): Promise<UserOil[]> => {
  try {
    const q = query(
      collection(db, 'userOils'), 
      where('userId', '==', userId)
    );
    
    const querySnapshot = await withTimeout(getDocs(q), 1500);
    const oils: UserOil[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      oils.push({
        id: doc.id,
        userId: data.userId,
        oilId: data.oilId,
        addedAt: data.addedAt,
      });
    });
    
    return oils.sort((a, b) => b.addedAt - a.addedAt);
  } catch (error) {
    console.warn("Error getting user oils: ", error);
    return [];
  }
};

export const addUserOil = async (userId: string, oilId: string): Promise<UserOil> => {
  try {
    const addedAt = Date.now();
    const docRef = await addDoc(collection(db, 'userOils'), {
      userId,
      oilId,
      addedAt,
    });
    
    return {
      id: docRef.id,
      userId,
      oilId,
      addedAt,
    };
  } catch (error) {
    console.error("Error adding user oil: ", error);
    throw error;
  }
};

export const removeUserOil = async (docId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'userOils', docId));
  } catch (error) {
    console.error("Error removing user oil: ", error);
    throw error;
  }
};

export const deleteAllUserData = async (userId: string): Promise<void> => {
  try {
    const qHistory = query(
      collection(db, 'emotionHistory'), 
      where('userId', '==', userId)
    );
    const snapshotHistory = await getDocs(qHistory);
    const deleteHistoryPromises = snapshotHistory.docs.map(d => deleteDoc(doc(db, 'emotionHistory', d.id)));
    
    const qOils = query(
      collection(db, 'userOils'), 
      where('userId', '==', userId)
    );
    const snapshotOils = await getDocs(qOils);
    const deleteOilsPromises = snapshotOils.docs.map(d => deleteDoc(doc(db, 'userOils', d.id)));

    await Promise.all([...deleteHistoryPromises, ...deleteOilsPromises]);
  } catch (error) {
    console.error("Error deleting user data: ", error);
    throw error;
  }
};
