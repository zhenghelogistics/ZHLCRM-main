
import React, { useState, useCallback } from 'react';
import { CodeIcon, CheckCircleIcon } from './Icons';

// --- This is a workaround for the development environment ---
// In a real-world scenario (e.g., with Node.js), you would use the 'fs' module to read files.
// Here, we embed the file contents as strings to simulate reading them.
const fileContents: Record<string, string> = {
    "index.html": `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-ar" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Zhenghe Logistics CRM</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Inter', sans-serif;
      }
    </style>
  <script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@^18.2.0",
    "react-dom/": "https://esm.sh/react-dom@^18.2.0/",
    "react/": "https://esm.sh/react@^18.2.0/",
    "@google/genai": "https://esm.sh/@google/genai@^1.34.0",
    "https://esm.sh/recharts@2.12.7": "https://esm.sh/recharts@2.12.7",
    "firebase/app": "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js",
    "firebase/firestore": "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js",
    "firebase/": "https://esm.sh/firebase@^12.7.0/"
  }
}
</script>
</head>
  <body class="bg-slate-900 text-slate-200">
    <div id="root"></div>
    <script type="module" src="./index.tsx"></script>
  </body>
</html>`,
    "index.tsx": `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
    "App.tsx": `
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Lead, LeadStatus, RiskLevel, MonthlyArchive } from './types';
import { extractLeadDataFromEmail } from './services/geminiService';
import * as db from './services/firebaseService';
import { seedDatabaseWithSampleData } from './services/sampleDataService';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Pipeline from './components/Pipeline';
import LostLeads from './components/LostLeads';
import ReportingPage from './components/ReportingPage';
import { AlertTriangleIcon, JsonIcon, LoaderIcon, ShipIcon } from './components/Icons';
import WonLeads from './components/WonLeads';
import ArchiveConfirmModal from './components/ArchiveConfirmModal';
import HistoricalReportPage from './components/HistoricalReportPage';
import EmailInput from './components/EmailInput';
import Toast from './components/Toast';
import DevToolsPage from './components/DevToolsPage';

export type ViewMode = 'card' | 'table';
export type Page = 'pipeline' | 'reporting' | 'history' | 'devtools';

const App: React.FC = () => {
    const [allLeads, setAllLeads] = useState<Lead[]>([]);
    const [archives, setArchives] = useState<MonthlyArchive[]>([]);
    const [ghostHistory, setGhostHistory] = useState<Set<string>>(new Set());
    const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [lastJson, setLastJson] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('card');
    const [currentPage, setCurrentPage] = useState<Page>('pipeline');
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const fetchData = useCallback(async () => {
        setIsAppLoading(true);
        try {
            await seedDatabaseWithSampleData(); // Seed database if it's empty
            
            const [leads, archivesData] = await Promise.all([db.getLeads(), db.getArchives()]);
            setAllLeads(leads);
            setArchives(archivesData.sort((a, b) => b.id.localeCompare(a.id))); // Sort archives descending
            
            // Build ghost history from all leads ever
            const allHistoricalLeads = [...leads, ...archivesData.flatMap(a => a.leads)];
            const ghostedCustomers = new Set(allHistoricalLeads.filter(l => l.status === LeadStatus.LOST_GHOSTED).map(l => l.customer_name));
            setGhostHistory(ghostedCustomers);

        } catch (err) {
            console.error(err);
            setError("Could not connect to the database. Please check your Firebase configuration in \`firebaseConfig.ts\`.");
        } finally {
            setIsAppLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
};`,
    "types.ts": `
export enum LeadStatus {
    QUOTE_SENT = "Quote Sent",
    IN_DISCUSSION = "In Discussion",
    WON = "Won",
    LOST_GHOSTED = "LOST: GHOSTED",
    LOST_REJECTED = "Lost (Rejected)",
}

export enum RiskLevel {
    LOW = "Low",
    MEDIUM = "Medium",
    HIGH = "High",
}

export interface ExtractedLeadData {
    customer_name: string;
    quoted_price: number;
    industry: string;
    lead_score: number;
}

export interface Lead extends ExtractedLeadData {
    id: string;
    status: LeadStatus;
    stage: string;
    createdAt: string;
    next_follow_up: string;
    riskLevel: RiskLevel;
    notes?: string;
    respondedAtStage?: string | null;
}

export interface MonthlyArchive {
    id: string;
    displayName: string;
    leads: Lead[];
}`,
    "services/geminiService.ts": `
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedLeadData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const leadDataSchema = { /* ... content omitted for brevity ... */ };
const nudgeResponseSchema = { /* ... content omitted for brevity ... */ };

export const extractLeadDataFromEmail = async (emailText: string): Promise<ExtractedLeadData> => {
    // ... content omitted for brevity ...
};

export const generateNudgeEmail = async (customerName: string, quotePrice: number): Promise<{ subject: string, body: string }> => {
    // ... content omitted for brevity ...
};`,
    "services/firebaseService.ts": `
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, writeBatch, getDoc, setDoc } from "firebase/firestore";
import { Lead, MonthlyArchive } from "../types";
import { firebaseConfig } from '../firebaseConfig';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const getLeads = async (): Promise<Lead[]> => { /* ... */ };
export const addLead = async (leadData: Omit<Lead, 'id'>): Promise<string> => { /* ... */ };
export const updateLead = async (id: string, updates: Partial<Lead>): Promise<void> => { /* ... */ };
export const deleteLead = async (id: string): Promise<void> => { /* ... */ };
export const getArchives = async (): Promise<MonthlyArchive[]> => { /* ... */ };
export const archiveLeads = async (archiveId: string, displayName: string, leadsToArchive: Lead[]): Promise<void> => { /* ... */ };
`,
"services/sampleDataService.ts": `
import { getFirestore, collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { Lead, MonthlyArchive, LeadStatus, RiskLevel } from "../types";
import { firebaseConfig } from '../firebaseConfig';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ... [Full content of the new sampleDataService.ts file] ...

export const seedDatabaseWithSampleData = async () => {
    try {
        const leadsCollectionRef = collection(db, "leads");
        const archivesCollectionRef = collection(db, "archives");

        const [leadsSnapshot, archivesSnapshot] = await Promise.all([
            getDocs(leadsCollectionRef),
            getDocs(archivesCollectionRef)
        ]);
        
        if (!leadsSnapshot.empty || !archivesSnapshot.empty) {
            console.log("Database already contains data. Skipping seed.");
            return;
        }

        console.log("Database is empty. Seeding with sample data...");
        const batch = writeBatch(db);

        // Add current month's leads
        currentMonthLeads.forEach((lead) => {
            const newLeadRef = doc(leadsCollectionRef);
            batch.set(newLeadRef, lead);
        });
        
        // Add archives
        const archives = [juneArchive, julyArchive];
        archives.forEach(archive => {
            const archiveRef = doc(archivesCollectionRef, archive.id);
            batch.set(archiveRef, archive);
        });

        await batch.commit();
        console.log("Successfully seeded database with sample data.");

    } catch (error) {
        console.error("Error seeding database:", error);
    }
};
`,
};

const DevToolsPage: React.FC = () => {
    const [summary, setSummary] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    const generateSummary = useCallback(() => {
        const header = "Here is the full source code for my project, 'Zhenghe Logistics CRM'. Please review it for code quality, functionality, complexity, and provide an estimate of its potential value or the cost to develop such a tool. I've omitted some long prompt strings and component code for brevity.\n\n";
        
        const allFiles = Object.entries(fileContents).map(([filename, content]) => {
            return `--- START OF FILE ${filename} ---\n${content.trim()}\n--- END OF FILE ${filename} ---`;
        }).join('\n\n');

        const fullText = header + allFiles;
        setSummary(fullText);
        return fullText;
    }, []);

    const handleCopy = () => {
        const fullText = summary || generateSummary();
        navigator.clipboard.writeText(fullText).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
        }, (err) => {
            console.error('Could not copy text: ', err);
            alert('Failed to copy text.');
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-100">Developer Tools</h1>
                <p className="text-slate-400 mt-1">Tools to help with project analysis and review.</p>
            </div>
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-slate-200 mb-2 flex items-center">
                    <CodeIcon className="h-6 w-6 mr-3 text-slate-400" />
                    Project Summary for AI Review
                </h2>
                <p className="text-sm text-slate-400 mb-4">
                    This tool gathers all relevant source code into a single, formatted text block. Click the button to copy it, then paste the entire block into an AI chat (like Gemini) to ask for a code review, feature suggestions, or a valuation.
                </p>
                <button
                    onClick={handleCopy}
                    className="w-full flex items-center justify-center bg-blue-600 text-white font-semibold py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                >
                    {isCopied ? (
                        <>
                            <CheckCircleIcon className="-ml-1 mr-3 h-5 w-5" />
                            Copied to Clipboard!
                        </>
                    ) : (
                        'Generate & Copy Project to Clipboard'
                    )}
                </button>
                {summary && (
                    <div className="mt-4">
                        <label htmlFor="summary-output" className="block text-sm font-medium text-slate-300 mb-1">
                            Generated Output (Read-only)
                        </label>
                        <textarea
                            id="summary-output"
                            readOnly
                            value={summary}
                            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-md text-xs text-slate-400 h-64"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default DevToolsPage;
