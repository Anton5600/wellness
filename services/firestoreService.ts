
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { EmotionHistoryEntry, EmotionKey, UserOil, OilCatalogItem } from '../types';
import { OILS_CATALOG } from '../data/oils';

export const getOilsCatalog = async (): Promise<OilCatalogItem[]> => {
  try {
    const q = query(collection(db, 'oils'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // If database is empty, return local catalog as fallback but ideally we should seed it
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
    
    // Sort alphabetically by name
    return oils.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error getting oils catalog: ", error);
    return OILS_CATALOG; // Fallback
  }
};

export const seedOilsCatalog = async (): Promise<void> => {
  try {
    const promises = OILS_CATALOG.map(oil => {
      const { id, ...data } = oil;
      return setDoc(doc(db, 'oils', id), data);
    });
    await Promise.all(promises);
  } catch (error) {
    console.error("Error seeding oils catalog: ", error);
    throw error;
  }
};

export const saveEmotionHistory = async (userId: string, emotionKey: EmotionKey): Promise<EmotionHistoryEntry> => {
  try {
    const timestamp = Date.now();
    const docRef = await addDoc(collection(db, 'emotionHistory'), {
      userId,
      emotionKey,
      timestamp,
    });
    
    return {
      id: docRef.id,
      userId,
      emotionKey,
      timestamp,
    };
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
};

export const getEmotionHistory = async (userId: string): Promise<EmotionHistoryEntry[]> => {
  try {
    const q = query(
      collection(db, 'emotionHistory'), 
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const history: EmotionHistoryEntry[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      history.push({
        id: doc.id,
        userId: data.userId,
        emotionKey: data.emotionKey,
        timestamp: data.timestamp,
      });
    });
    
    // Сортируем в памяти (от новых к старым), чтобы не требовать создания составного индекса в Firestore
    return history.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error getting documents: ", error);
    return [];
  }
};

export const getUserOils = async (userId: string): Promise<UserOil[]> => {
  try {
    const q = query(
      collection(db, 'userOils'), 
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
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
    console.error("Error getting user oils: ", error);
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
