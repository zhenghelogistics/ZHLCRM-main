
import React, { useState, useMemo, useEffect } from 'react';
import { MonthlyArchive, Lead } from '../types';
import MonthlyCharts from './MonthlyCharts';
import { HistoryIcon } from './Icons';

interface HistoricalReportPageProps {
    archives: MonthlyArchive[];
}

const StatCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-xl p-4">
        <p className="text-sm text-slate-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-100">{value}</p>
    </div>
);

const HistoricalReportPage: React.FC<HistoricalReportPageProps> = ({ archives }) => {
    const [selectedArchiveId, setSelectedArchiveId] = useState<string | null>(null);

    useEffect(() => {
        if (archives.length > 0 && !selectedArchiveId) {
            setSelectedArchiveId(archives[0].id);
        }
    }, [archives, selectedArchiveId]);

    const selectedArchive = useMemo(() => {
        return archives.find(a => a.id === selectedArchiveId) || null;
    }, [archives, selectedArchiveId]);

    const summaryStats = useMemo(() => {
        if (!selectedArchive) return { won: 0, lost: 0, winRate: 0, avgDealSize: 0 };

        const wonLeads = selectedArchive.leads.filter(l => l.status === 'Won');
        const lostLeads = selectedArchive.leads.filter(l => l.status.startsWith('LOST'));

        const wonValue = wonLeads.reduce((sum, l) => sum + l.quoted_price, 0);
        const lostValue = lostLeads.reduce((sum, l) => sum + l.quoted_price, 0);
        const totalClosed = wonLeads.length + lostLeads.length;
        const winRate = totalClosed > 0 ? (wonLeads.length / totalClosed) * 100 : 0;
        const avgDealSize = wonLeads.length > 0 ? wonValue / wonLeads.length : 0;

        return { won: wonValue, lost: lostValue, winRate, avgDealSize };
    }, [selectedArchive]);
    
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-100">Historical Analysis</h1>
                <p className="text-slate-400 mt-1">Review performance from previous months.</p>
            </div>

            {archives.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1">
                        <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-xl p-4">
                            <h2 className="font-semibold text-slate-200 mb-3">Select a Month</h2>
                            <div className="flex flex-col space-y-2">
                                {archives.map(archive => (
                                    <button
                                        key={archive.id}
                                        onClick={() => setSelectedArchiveId(archive.id)}
                                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                            selectedArchiveId === archive.id 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                                        }`}
                                    >
                                        {archive.displayName}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-3 space-y-6">
                        {selectedArchive ? (
                            <>
                                <h2 className="text-xl font-bold text-slate-200">
                                    Report for: <span className="text-blue-500">{selectedArchive.displayName}</span>
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                   <StatCard title="Revenue Won" value={formatCurrency(summaryStats.won)} />
                                   <StatCard title="Revenue Lost" value={formatCurrency(summaryStats.lost)} />
                                   <StatCard title="Win Rate" value={`${summaryStats.winRate.toFixed(1)}%`} />
                                   <StatCard title="Avg. Deal Size (Won)" value={formatCurrency(summaryStats.avgDealSize)} />
                                </div>
                                <MonthlyCharts leads={selectedArchive.leads} />
                            </>
                        ) : (
                            <p>Select a month to view its report.</p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center py-16 bg-zinc-900/40 backdrop-blur-md rounded-xl shadow-sm border-2 border-dashed border-zinc-800/50">
                    <HistoryIcon className="mx-auto h-12 w-12 text-slate-500" />
                    <h3 className="mt-2 text-sm font-medium text-slate-200">No Archives Found</h3>
                    <p className="mt-1 text-sm text-slate-400">Archive a month from the main pipeline dashboard to start building your history.</p>
                </div>
            )}
        </div>
    );
};

export default HistoricalReportPage;
