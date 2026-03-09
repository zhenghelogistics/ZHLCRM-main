import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, writeBatch, getDoc, setDoc } from "firebase/firestore";
import { Lead, MonthlyArchive } from "../types";
import { firebaseConfig } from '../firebaseConfig';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Leads ---

export const getLeads = async (): Promise<Lead[]> => {
    const leadsCollectionRef = collection(db, "leads");
    const querySnapshot = await getDocs(leadsCollectionRef);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Lead));
};

export const addLead = async (leadData: Omit<Lead, 'id'>): Promise<string> => {
    const leadsCollectionRef = collection(db, "leads");
    const docRef = await addDoc(leadsCollectionRef, leadData);
    return docRef.id;
};

export const updateLead = async (id: string, updates: Partial<Lead>): Promise<void> => {
    const leadDoc = doc(db, "leads", id);
    await updateDoc(leadDoc, updates);
};

export const deleteLead = async (id: string): Promise<void> => {
    const leadDoc = doc(db, "leads", id);
    await deleteDoc(leadDoc);
};

// --- Archives ---

export const getArchives = async (): Promise<MonthlyArchive[]> => {
    const archivesCollectionRef = collection(db, "archives");
    const querySnapshot = await getDocs(archivesCollectionRef);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as MonthlyArchive));
};

export const archiveLeads = async (archiveId: string, displayName: string, leadsToArchive: Lead[]): Promise<void> => {
    if (leadsToArchive.length === 0) return;

    const batch = writeBatch(db);
    const archiveDocRef = doc(db, "archives", archiveId);
    
    const existingArchiveSnap = await getDoc(archiveDocRef);
    const existingLeads = existingArchiveSnap.exists() ? existingArchiveSnap.data().leads : [];
    const allArchivedLeads = [...existingLeads, ...leadsToArchive];
    
    batch.set(archiveDocRef, { id: archiveId, displayName, leads: allArchivedLeads });

    for (const lead of leadsToArchive) {
        const leadDocRef = doc(db, "leads", lead.id);
        batch.delete(leadDocRef);
    }
    
    await batch.commit();
};
