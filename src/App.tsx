import React, { useState, useMemo } from 'react';
import { Lead, LeadStatus, RiskLevel } from './types';
import { parseQuoteEmail, ParsedQuote } from './utils/emailParser';
import { useLeads } from './hooks/useLeads';
import { useArchives } from './hooks/useArchives';
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
    // --- Data (managed by hooks with real-time sync) ---
    const { leads: allLeads, isLoading: isAppLoading, error: dbError, addLead, updateLead, deleteLead } = useLeads();
    const { archives, archiveMonth } = useArchives();

    // --- UI State ---
    const [isProcessing, setIsProcessing] = useState(false);
    const [uiError, setUiError] = useState<string | null>(null);
    const [lastJson, setLastJson] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('card');
    const [currentPage, setCurrentPage] = useState<Page>('pipeline');
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [parsedQuote, setParsedQuote] = useState<ParsedQuote | null>(null);

    const error = dbError || uiError;

    // --- Derived Data ---
    const ghostHistory = useMemo(() => {
        const all = [...allLeads, ...archives.flatMap(a => a.leads)];
        return new Set(all.filter(l => l.status === LeadStatus.LOST_GHOSTED).map(l => l.customer_name));
    }, [allLeads, archives]);

    const activeLeads = useMemo(() => allLeads.filter(l => l.status === LeadStatus.QUOTE_SENT || l.status === LeadStatus.IN_DISCUSSION), [allLeads]);
    const lostLeads = useMemo(() => allLeads.filter(l => l.status === LeadStatus.LOST_GHOSTED || l.status === LeadStatus.LOST_REJECTED), [allLeads]);
    const wonLeads = useMemo(() => allLeads.filter(l => l.status === LeadStatus.WON), [allLeads]);
    const existingCustomers = useMemo(() => Array.from(new Set(allLeads.map(l => l.customer_name))).sort(), [allLeads]);
    const projectedRevenue = useMemo(() => activeLeads.reduce((sum, l) => sum + l.quoted_price, 0), [activeLeads]);
    const revenueLost = useMemo(() => lostLeads.reduce((sum, l) => sum + l.quoted_price, 0), [lostLeads]);
    const wonRevenue = useMemo(() => wonLeads.reduce((sum, l) => sum + l.quoted_price, 0), [wonLeads]);

    // --- Handlers ---
    const handleParseQuote = (emailText: string) => {
        if (!emailText.trim()) { setUiError('Email content cannot be empty.'); return; }
        setIsProcessing(true);
        setUiError(null);
        setLastJson(null);
        setParsedQuote(null);
        try {
            const parsedData = parseQuoteEmail(emailText);
            setParsedQuote(parsedData);
            setLastJson(JSON.stringify(parsedData, null, 2));
            if (parsedData.confidence < 30) setUiError('Could not parse significant commercial data. Please check the email body.');
            if (parsedData.total_price === 0) setUiError('The parser could not determine a final price. The lead will be saved with a price of $0, please update it manually.');
        } catch (err: any) {
            setUiError(err.message || 'An unexpected error occurred during parsing.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveLead = async (customerName: string, customerEmail?: string) => {
        if (!parsedQuote) { setUiError('Parsing data is missing. Please parse an email first.'); return; }
        setIsProcessing(true);
        setUiError(null);
        try {
            const detailedNotes = [
                '--- PARSED QUOTE DETAILS ---',
                `Mode: ${parsedQuote.mode}`,
                `Liner: ${parsedQuote.liner || 'N/A'}`,
                `Contract Ref: ${parsedQuote.contract_ref || 'N/A'}`,
                `Free Days: ${parsedQuote.free_days || 'N/A'}`,
                `Container Rates: ${Object.entries(parsedQuote.container_rates || {}).map(([k, v]) => `${k}: $${v}`).join(', ') || 'N/A'}`,
                `\n--- EMAIL CONDITIONS ---\n${parsedQuote.notes || 'None'}`,
            ].join('\n');

            const newLead: Omit<Lead, 'id'> = {
                customer_name: customerName,
                customer_email: customerEmail,
                quoted_price: parsedQuote.total_price || 0,
                industry: parsedQuote.industry || 'Unknown',
                lead_score: Math.round(parsedQuote.confidence / 10) || 5,
                status: LeadStatus.QUOTE_SENT,
                stage: 'T-0 (Initial)',
                createdAt: new Date().toISOString(),
                next_follow_up: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
                riskLevel: ghostHistory.has(customerName) ? RiskLevel.MEDIUM : RiskLevel.HIGH,
                notes: detailedNotes,
            };

            await addLead(newLead);
            setLastJson(JSON.stringify(newLead, null, 2));
            setParsedQuote(null);
            setToast({ message: `Success! Lead for ${customerName} created.`, type: 'success' });
        } catch (err: any) {
            setUiError(err.message || 'An unknown error occurred while saving the lead.');
            setToast({ message: `Error: ${err.message || 'Could not save lead.'}`, type: 'error' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAddManualLead = async (leadData: Omit<Lead, 'id' | 'stage' | 'next_follow_up' | 'riskLevel' | 'respondedAtStage'> & { respondedAtStage?: string | null }) => {
        await addLead({ ...leadData, stage: 'Manual Entry', next_follow_up: new Date().toISOString(), riskLevel: RiskLevel.LOW });
    };

    const handleUpdateLeadDate = (id: string, newDate: string) =>
        updateLead(id, { createdAt: new Date(newDate).toISOString() });

    const handleMarkResponded = (id: string) => {
        const lead = allLeads.find(l => l.id === id);
        if (lead) updateLead(id, { status: LeadStatus.IN_DISCUSSION, respondedAtStage: lead.stage });
    };
    const handleMarkWon = (id: string) => updateLead(id, { status: LeadStatus.WON });
    const handleMarkLost = (id: string, reason: string) => updateLead(id, { status: LeadStatus.LOST_REJECTED, notes: reason });
    const handleDeleteLead = (id: string) => deleteLead(id).catch((err: any) => setToast({ message: `Delete failed: ${err.message}`, type: 'error' }));
    const handleUpdateNotes = (id: string, notes: string) => updateLead(id, { notes });
    const handleUpdateLeadPrice = (id: string, quoted_price: number) => updateLead(id, { quoted_price });
    const handleNudgeSent = (id: string) => updateLead(id, {
        stage: 'Follow-up 1 Sent',
        next_follow_up: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    const handleArchiveCurrentMonth = async () => {
        const now = new Date();
        const archiveId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const displayName = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;
        const leadsToArchive = allLeads.filter(l =>
            l.status === LeadStatus.WON || l.status === LeadStatus.LOST_GHOSTED || l.status === LeadStatus.LOST_REJECTED
        );
        if (leadsToArchive.length > 0) {
            await archiveMonth(archiveId, displayName, leadsToArchive);
            setToast({ message: `Archived ${leadsToArchive.length} leads for ${displayName}.`, type: 'success' });
        } else {
            setToast({ message: 'No leads to archive this month.', type: 'error' });
        }
        setIsArchiveModalOpen(false);
    };

    // --- Render ---
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
            );
        }
        switch (currentPage) {
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
                                    onCancel={() => { setParsedQuote(null); setLastJson(null); setUiError(null); }}
                                    isSaving={isProcessing && !!parsedQuote}
                                />
                            )}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start space-x-2" role="alert">
                                    <AlertTriangleIcon className="h-5 w-5 mt-0.5" /><span>{error}</span>
                                </div>
                            )}
                            {lastJson && !parsedQuote && (
                                <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl p-4 shadow-sm">
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                                        <JsonIcon className="h-5 w-5 mr-2 text-slate-500" />Last Saved Lead
                                    </h3>
                                    <pre className="bg-slate-50 p-3 rounded text-xs text-slate-700 overflow-x-auto border border-slate-200"><code>{lastJson}</code></pre>
                                </div>
                            )}
                        </div>
                        <div className="lg:col-span-2 space-y-8">
                            <Dashboard
                                projectedRevenue={projectedRevenue}
                                wonRevenue={wonRevenue}
                                revenueLost={revenueLost}
                                activeLeadsCount={activeLeads.length}
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
                                <WonLeads leads={wonLeads} />
                                <LostLeads leads={lostLeads} />
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
                <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
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
