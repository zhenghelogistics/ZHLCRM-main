import { getFirestore, collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { Lead, MonthlyArchive, LeadStatus, RiskLevel } from "../types";
import { firebaseConfig } from '../firebaseConfig';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

const dateInCurrentMonth = (day: number, hoursAgo: number = 0) => {
    const d = new Date(today);
    d.setDate(day);
    d.setHours(d.getHours() - hoursAgo);
    return d.toISOString();
};

const dateInPreviousMonth = (day: number, monthsAgo: number) => {
    const d = new Date(today);
    d.setMonth(d.getMonth() - monthsAgo, day);
    return d.toISOString();
}

const currentMonthLeads: Omit<Lead, 'id'>[] = [
    { customer_name: "Apex Solutions", quoted_price: 12500, industry: "Tech", lead_score: 9, status: LeadStatus.QUOTE_SENT, stage: "T-24h (Nurture)", createdAt: dateInCurrentMonth(today.getDate() - 1, 0), next_follow_up: dateInCurrentMonth(today.getDate(), 1), riskLevel: RiskLevel.LOW, notes: "High potential deal for server rack transport." },
    { customer_name: "BioGen Pharma", quoted_price: 7800, industry: "Pharmaceuticals", lead_score: 8, status: LeadStatus.QUOTE_SENT, stage: "T+6h", createdAt: dateInCurrentMonth(today.getDate(), 4), next_follow_up: dateInCurrentMonth(today.getDate(), -2), riskLevel: RiskLevel.MEDIUM, notes: "Previous ghosting history. Follow up carefully." },
    { customer_name: "Global Textiles Inc.", quoted_price: 4200, industry: "Manufacturing", lead_score: 6, status: LeadStatus.QUOTE_SENT, stage: "T+3h", createdAt: dateInCurrentMonth(today.getDate(), 1), next_follow_up: dateInCurrentMonth(today.getDate(), -2), riskLevel: RiskLevel.LOW, notes: "" },
    { customer_name: "Quantum Computing Co.", quoted_price: 25000, industry: "Tech", lead_score: 10, status: LeadStatus.IN_DISCUSSION, stage: "Follow-up Call", createdAt: dateInCurrentMonth(today.getDate() - 3), next_follow_up: dateInCurrentMonth(today.getDate() + 1), riskLevel: RiskLevel.LOW, respondedAtStage: "T-24h (Nurture)", notes: "Responded positively. Scheduled a call to finalize details." },
    { customer_name: "Dynamic Retail", quoted_price: 8900, industry: "Retail", lead_score: 7, status: LeadStatus.WON, stage: "Closed", createdAt: dateInCurrentMonth(today.getDate() - 2), next_follow_up: dateInCurrentMonth(today.getDate() - 2), riskLevel: RiskLevel.LOW, respondedAtStage: "T+6h", notes: "Deal closed after offering a small discount." },
    { customer_name: "Fusion Foods", quoted_price: 3200, industry: "Commodities", lead_score: 5, status: LeadStatus.LOST_REJECTED, stage: "Closed", createdAt: dateInCurrentMonth(today.getDate() - 4), next_follow_up: dateInCurrentMonth(today.getDate() - 4), riskLevel: RiskLevel.LOW, respondedAtStage: "T+3h", notes: "Client found a cheaper alternative with a local provider." },
];

const julyArchive: MonthlyArchive = {
    id: `${today.getFullYear()}-${String(today.getMonth()).padStart(2, '0')}`,
    displayName: `${new Date(today.getFullYear(), today.getMonth() - 1).toLocaleString('default', { month: 'long' })} ${today.getFullYear()}`,
    leads: [
        { id: 'july01', customer_name: "Innovate Solutions", quoted_price: 15000, industry: "Tech", lead_score: 9, status: LeadStatus.WON, createdAt: dateInPreviousMonth(25, 1), riskLevel: RiskLevel.LOW, stage: '', next_follow_up: '' },
        { id: 'july02', customer_name: "AgriCorp", quoted_price: 6500, industry: "Commodities", lead_score: 6, status: LeadStatus.WON, createdAt: dateInPreviousMonth(22, 1), riskLevel: RiskLevel.LOW, stage: '', next_follow_up: '' },
        { id: 'july03', customer_name: "Precision Parts", quoted_price: 2200, industry: "Manufacturing", lead_score: 4, status: LeadStatus.LOST_REJECTED, notes: "Price was too high.", createdAt: dateInPreviousMonth(20, 1), riskLevel: RiskLevel.LOW, stage: '', next_follow_up: '' },
        { id: 'july04', customer_name: "HealthFirst Med", quoted_price: 18000, industry: "Pharmaceuticals", lead_score: 10, status: LeadStatus.WON, createdAt: dateInPreviousMonth(18, 1), riskLevel: RiskLevel.LOW, stage: '', next_follow_up: '' },
        { id: 'july05', customer_name: "Sunrise Imports", quoted_price: 3100, industry: "General Goods", lead_score: 5, status: LeadStatus.LOST_GHOSTED, createdAt: dateInPreviousMonth(15, 1), riskLevel: RiskLevel.LOW, stage: '', next_follow_up: '' },
    ]
};

const juneArchive: MonthlyArchive = {
    id: `${today.getFullYear()}-${String(today.getMonth() - 1).padStart(2, '0')}`,
    displayName: `${new Date(today.getFullYear(), today.getMonth() - 2).toLocaleString('default', { month: 'long' })} ${today.getFullYear()}`,
    leads: [
        { id: 'june01', customer_name: "Starlight Exports", quoted_price: 9800, industry: "Retail", lead_score: 7, status: LeadStatus.WON, createdAt: dateInPreviousMonth(28, 2), riskLevel: RiskLevel.LOW, stage: '', next_follow_up: '' },
        { id: 'june02', customer_name: "BioGen Pharma", quoted_price: 5400, industry: "Pharmaceuticals", lead_score: 6, status: LeadStatus.LOST_GHOSTED, createdAt: dateInPreviousMonth(21, 2), riskLevel: RiskLevel.LOW, stage: '', next_follow_up: '' },
        { id: 'june03', customer_name: "Allied Machinery", quoted_price: 11200, industry: "Manufacturing", lead_score: 8, status: LeadStatus.WON, createdAt: dateInPreviousMonth(16, 2), riskLevel: RiskLevel.LOW, stage: '', next_follow_up: '' },
        { id: 'june04', customer_name: "Coastal Commodities", quoted_price: 2500, industry: "Commodities", lead_score: 4, status: LeadStatus.LOST_REJECTED, notes: "Internal budget cuts.", createdAt: dateInPreviousMonth(10, 2), riskLevel: RiskLevel.LOW, stage: '', next_follow_up: '' },
        { id: 'june05', customer_name: "TechWave Logistics", quoted_price: 16500, industry: "Tech", lead_score: 9, status: LeadStatus.WON, createdAt: dateInPreviousMonth(5, 2), riskLevel: RiskLevel.LOW, stage: '', next_follow_up: '' },
    ]
};

export const seedDatabaseWithSampleData = async () => {
    try {
        const leadsCollectionRef = collection(db, "leads");
        const archivesCollectionRef = collection(db, "archives");

        const [leadsSnapshot, archivesSnapshot] = await Promise.all([
            getDocs(leadsCollectionRef),
            getDocs(archivesCollectionRef)
        ]);
        
        if (!leadsSnapshot.empty || !archivesSnapshot.empty) {
            return;
        }

        const batch = writeBatch(db);

        currentMonthLeads.forEach((lead) => {
            const newLeadRef = doc(leadsCollectionRef);
            batch.set(newLeadRef, lead);
        });
        
        const archives = [juneArchive, julyArchive];
        archives.forEach(archive => {
            const archiveRef = doc(archivesCollectionRef, archive.id);
            batch.set(archiveRef, archive);
        });

        await batch.commit();

    } catch (error) {
        console.error("Error seeding database:", error);
    }
};
