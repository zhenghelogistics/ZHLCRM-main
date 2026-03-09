import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Lead, LeadStatus, RiskLevel, MonthlyArchive } from './types';
import { parseQuoteEmail, ParsedQuote } from './utils/emailParser';
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
import CustomerConfirmation from './components/CustomerConfirmation';
import BackgroundWaves from './components/BackgroundWaves';

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
    const [parsedQuote, setParsedQuote] = useState<ParsedQuote | null>(null);

    const fetchData = useCallback(async (isInitialLoad = false) => {
        if (isInitialLoad) {
            setIsAppLoading(true);
        }
        try {
            await seedDatabaseWithSampleData(); // Seed database if it's empty
            
            const [leads, archivesData] = await Promise.all([db.getLeads(), db.getArchives()]);
            setAllLeads(leads);
            setArchives(archivesData.sort((a, b) => b.id.localeCompare(a.id))); // Sort archives descending
            
            const allHistoricalLeads = [...leads, ...archivesData.flatMap(a => a.leads)];
            const ghostedCustomers = new Set(allHistoricalLeads.filter(l => l.status === LeadStatus.LOST_GHOSTED).map(l => l.customer_name));
            setGhostHistory(ghostedCustomers);

        } catch (err) {
            console.error(err);
            setError("Could not connect to the database. Please check your Firebase configuration in `firebaseConfig.ts`.");
        } finally {
            if (isInitialLoad) {
                setIsAppLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        fetchData(true);
    }, [fetchData]);

    const checkAndCullLeads = useCallback(async () => {
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        let needsRefetch = false;

        // Use a functional update for allLeads to get the latest state
        setAllLeads(currentLeads => {
            (async () => {
                for (const lead of currentLeads) {
                    if (lead.status !== LeadStatus.QUOTE_SENT) continue;

                    const timeElapsed = now - new Date(lead.createdAt).getTime();
                    if (timeElapsed > twentyFourHours) {
                        await db.updateLead(lead.id, { status: LeadStatus.LOST_GHOSTED });
                        needsRefetch = true;
                        continue;
                    }

                    let newStage = lead.stage;
                    const threeHours = 3 * 60 * 60 * 1000;
                    const sixHours = 6 * 60 * 60 * 1000;
                    if (timeElapsed > sixHours) newStage = "T-24h (Nurture)";
                    else if (timeElapsed > threeHours) newStage = "T+6h";
                    else if (lead.stage === "T-0 (Initial)" && timeElapsed > 0) newStage = "T+3h";

                    if (newStage !== lead.stage) {
                        await db.updateLead(lead.id, { stage: newStage });
                        needsRefetch = true;
                    }
                }
                if (needsRefetch) {
                    fetchData(false); // Perform a silent refresh
                }
            })();
            return currentLeads; // Return original state, fetchData will update it
        });
    }, [fetchData]);


    useEffect(() => {
        const interval = setInterval(checkAndCullLeads, 60 * 1000); 
        return () => clearInterval(interval);
    }, [checkAndCullLeads]);
    
    const handleParseQuote = (emailText: string) => {
        if (!emailText.trim()) {
            setError("Email content cannot be empty.");
            return;
        }
        setIsProcessing(true);
        setError(null);
        setLastJson(null);
        setParsedQuote(null);

        try {
            // This is now a synchronous, client-side call
            const parsedData = parseQuoteEmail(emailText);
            setParsedQuote(parsedData);
            setLastJson(JSON.stringify(parsedData, null, 2));
             if (parsedData.confidence < 30) {
                setError("Could not parse significant commercial data. Please check the email body.")
            }
             if (parsedData.total_price === 0) {
                setError("The parser could not determine a final price. The quote may be ambiguous. The lead will be saved with a price of $0, please update it manually.")
             }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred during parsing.");
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleSaveLead = async (customerName: string, customerEmail?: string) => {
        if (!parsedQuote) {
            setError("Parsing data is missing. Please parse an email first.");
            return;
        }
        
        setIsProcessing(true);
        setError(null);

        try {
            const detailedNotes = [
                `--- PARSED QUOTE DETAILS ---`,
                `Mode: ${parsedQuote.mode}`,
                `Liner: ${parsedQuote.liner || 'N/A'}`,
                `Contract Ref: ${parsedQuote.contract_ref || 'N/A'}`,
                `Free Days: ${parsedQuote.free_days || 'N/A'}`,
                `Container Rates: ${Object.entries(parsedQuote.container_rates || {}).map(([k,v]) => `${k}: $${v}`).join(', ') || 'N/A'}`,
                `\n--- EMAIL CONDITIONS ---\n${parsedQuote.notes || 'None'}`
            ].join('\n');

            const newLead: Omit<Lead, 'id'> = {
                customer_name: customerName,
                customer_email: customerEmail,
                quoted_price: parsedQuote.total_price || 0,
                industry: parsedQuote.industry || "Unknown",
                lead_score: Math.round(parsedQuote.confidence / 10) || 5,
                status: LeadStatus.QUOTE_SENT,
                stage: "T-0 (Initial)",
                createdAt: new Date().toISOString(),
                next_follow_up: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
                riskLevel: ghostHistory.has(customerName) ? RiskLevel.MEDIUM : RiskLevel.HIGH,
                notes: detailedNotes,
            };
            
            await db.addLead(newLead);
            setLastJson(JSON.stringify(newLead, null, 2));
            setParsedQuote(null); // Reset the flow
            await fetchData();
            setToast({ message: `Success! Lead for ${customerName} created.`, type: 'success' });

        } catch (err: any) {
             console.error(err);
             setError(err.message || "An unknown error occurred while saving the lead.");
             setToast({ message: `Error: ${err.message || "Could not save lead."}`, type: 'error' });
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleAddManualLead = async (leadData: Omit<Lead, 'id' | 'stage' | 'next_follow_up' | 'riskLevel' | 'respondedAtStage'> & { respondedAtStage?: string | null }) => {
        const newLead: Omit<Lead, 'id'> = {
            ...leadData,
            stage: 'Manual Entry',
            next_follow_up: new Date().toISOString(),
            riskLevel: RiskLevel.LOW,
        };
        await db.addLead(newLead);
        await fetchData();
    };

    const handleUpdateLeadDate = async (id: string, newDate: string) => {
        await db.updateLead(id, { createdAt: new Date(newDate).toISOString() });
        await fetchData();
    };
    
    const updateLeadStatus = async (id: string, newStatus: LeadStatus, extraData: Partial<Lead> = {}) => {
        await db.updateLead(id, { status: newStatus, ...extraData });
        await fetchData();
    };

    const handleMarkResponded = (id: string) => {
        const lead = allLeads.find(l => l.id === id);
        if (lead) updateLeadStatus(id, LeadStatus.IN_DISCUSSION, { respondedAtStage: lead.stage });
    };
    const handleMarkWon = (id: string) => updateLeadStatus(id, LeadStatus.WON);
    const handleMarkLost = (id: string, reason: string) => updateLeadStatus(id, LeadStatus.LOST_REJECTED, { notes: reason });
    const handleDeleteLead = async (id: string) => {
        await db.deleteLead(id);
        await fetchData();
    };
    const handleUpdateNotes = async (id: string, notes: string) => {
        await db.updateLead(id, { notes });
        setAllLeads(prev => prev.map(l => l.id === id ? {...l, notes} : l));
    };
    
    const handleUpdateLeadPrice = async (id: string, newPrice: number) => {
        await db.updateLead(id, { quoted_price: newPrice });
        setAllLeads(prev => prev.map(l => l.id === id ? {...l, quoted_price: newPrice} : l));
    };

    const handleNudgeSent = async (id: string) => {
        const nextFollowUp = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await db.updateLead(id, { stage: 'Follow-up 1 Sent', next_follow_up: nextFollowUp });
        await fetchData();
    };

    const handleArchiveCurrentMonth = async () => {
        const now = new Date();
        const month = now.toLocaleString('default', { month: 'long' });
        const year = now.getFullYear();
        const archiveId = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const displayName = `${month} ${year}`;
        
        const leadsToArchive = allLeads.filter(l => l.status === LeadStatus.WON || l.status === LeadStatus.LOST_GHOSTED || l.status === LeadStatus.LOST_REJECTED);
        
        if (leadsToArchive.length > 0) {
            await db.archiveLeads(archiveId, displayName, leadsToArchive);
            await fetchData();
            setToast({ message: `Archived ${leadsToArchive.length} leads for ${displayName}.`, type: 'success' });
        } else {
             setToast({ message: "No leads to archive this month.", type: 'error' });
        }
        setIsArchiveModalOpen(false);
    };

    const activeLeads = useMemo(() => allLeads.filter(l => l.status === LeadStatus.QUOTE_SENT || l.status === LeadStatus.IN_DISCUSSION), [allLeads]);
    const lostLeads = useMemo(() => allLeads.filter(l => l.status === LeadStatus.LOST_GHOSTED || l.status === LeadStatus.LOST_REJECTED), [allLeads]);
    const wonLeads = useMemo(() => allLeads.filter(l => l.status === LeadStatus.WON), [allLeads]);
    const existingCustomers = useMemo(() => Array.from(new Set(allLeads.map(l => l.customer_name))).sort(), [allLeads]);
    
    const projectedRevenue = useMemo(() => activeLeads.reduce((sum, lead) => sum + lead.quoted_price, 0), [activeLeads]);
    const revenueLost = useMemo(() => lostLeads.reduce((sum, lead) => sum + lead.quoted_price, 0), [lostLeads]);
    const wonRevenue = useMemo(() => wonLeads.reduce((sum, lead) => sum + lead.quoted_price, 0), [wonLeads]);

    const renderPage = () => {
        if (isAppLoading && currentPage !== 'devtools') {
            return (
                 <div className="flex justify-center items-center h-[80vh] flex-col">
                    <ShipIcon className="h-16 w-16 text-blue-600 animate-pulse" />
                    <div className="flex items-center mt-4">
                        <LoaderIcon className="animate-spin h-8 w-8 text-blue-600" />
                        <span className="ml-4 text-xl text-slate-500">Connecting to Database...</span>
                    </div>
                </div>
            )
        }
        switch(currentPage) {
            case 'pipeline':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-6">
                            <EmailInput onParseDetails={handleParseQuote} isLoading={isProcessing && !parsedQuote} />
                            
                            {parsedQuote && (
                                <CustomerConfirmation 
                                    parsedData={parsedQuote}
                                    existingCustomers={existingCustomers}
                                    onSaveLead={handleSaveLead}
                                    onCancel={() => { setParsedQuote(null); setLastJson(null); setError(null); }}
                                    isSaving={isProcessing && !!parsedQuote}
                                />
                            )}

                             {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start space-x-2" role="alert">
                                    <AlertTriangleIcon className="h-5 w-5 mt-0.5"/><span>{error}</span>
                                </div>
                            )}
                            {lastJson && !parsedQuote && (
                                 <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl p-4 shadow-sm">
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center"><JsonIcon className="h-5 w-5 mr-2 text-slate-500"/>Last Saved Lead</h3>
                                    <pre className="bg-slate-50 p-3 rounded text-xs text-slate-700 overflow-x-auto border border-slate-200"><code>{lastJson}</code></pre>
                                </div>
                            )}
                        </div>
                        <div className="lg:col-span-2 space-y-8">
                            <Dashboard 
                                projectedRevenue={projectedRevenue} wonRevenue={wonRevenue} revenueLost={revenueLost} activeLeadsCount={activeLeads.length}
                                onOpenArchiveModal={() => setIsArchiveModalOpen(true)}
                            />
                            <Pipeline 
                                leads={activeLeads}
                                onMarkResponded={handleMarkResponded}
                                onMarkWon={handleMarkWon}
                                onMarkLost={handleMarkLost}
                                onDelete={handleDeleteLead}
                                onUpdateNotes={handleUpdateNotes}
                                onUpdateLeadPrice={handleUpdateLeadPrice}
                                onNudgeSent={handleNudgeSent}
                                viewMode={viewMode}
                                onViewModeChange={setViewMode}
                            />
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <WonLeads leads={wonLeads}/>
                                <LostLeads leads={lostLeads}/>
                            </div>
                        </div>
                    </div>
                );
            case 'reporting':
                return <ReportingPage allLeads={allLeads} onAddLead={handleAddManualLead} onUpdateNotes={handleUpdateNotes} onDelete={handleDeleteLead} onUpdateDate={handleUpdateLeadDate} />;
            case 'history':
                return <HistoricalReportPage archives={archives} />;
            case 'devtools':
                return <DevToolsPage />;
            default:
                return <div>Page not found</div>;
        }
    };
    
    return (
        <div className="relative min-h-screen bg-white overflow-hidden text-slate-900">
            <BackgroundWaves />
            <div className="relative z-10">
                <Header currentPage={currentPage} setCurrentPage={setCurrentPage}/>
                <main className="container mx-auto p-4 md:p-8">
                    {renderPage()}
                </main>
                <ArchiveConfirmModal
                    isOpen={isArchiveModalOpen}
                    onClose={() => setIsArchiveModalOpen(false)}
                    onConfirm={handleArchiveCurrentMonth}
                />
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </div>
        </div>
    );
};

export default App;